import Foundation
import UIKit
import MWDATCore
import MWDATCamera

/// Callback type for frame updates
public typealias FrameCallback = (UIImage) -> Void

/// Manages the camera streaming session
@MainActor
public final class StreamSessionManager {
    public static let shared = StreamSessionManager()

    private let logger = EMWDATLogger.shared

    // MARK: - State

    private var streamSession: StreamSession?
    private var stateToken: AnyListenerToken?
    private var frameToken: AnyListenerToken?
    private var errorToken: AnyListenerToken?
    private var photoToken: AnyListenerToken?

    private(set) var currentState: StreamSessionState = .stopped
    private(set) var currentConfig: StreamSessionConfig?

    // MARK: - Callbacks

    private var eventEmitter: EventEmitter?
    private var frameCallback: FrameCallback?

    private init() {}

    // MARK: - Configuration

    /// Set the event emitter for sending events to JavaScript
    public func setEventEmitter(_ emitter: @escaping EventEmitter) {
        self.eventEmitter = emitter
    }

    /// Set the frame callback for native view rendering
    public func setFrameCallback(_ callback: @escaping FrameCallback) {
        self.frameCallback = callback
    }

    /// Remove the frame callback
    public func removeFrameCallback() {
        self.frameCallback = nil
    }

    // MARK: - Stream Control

    /// Start a streaming session with the given configuration
    /// - Parameters:
    ///   - config: Stream session configuration (resolution, codec, frame rate)
    ///   - deviceId: Optional device identifier. When provided, targets that specific device
    ///               via `SpecificDeviceSelector`. When nil, uses `AutoDeviceSelector`.
    public func startStream(config: StreamSessionConfig, deviceId: String? = nil) async throws {
        guard streamSession == nil else {
            logger.warn("StreamSession", "Stream already active")
            throw StreamSessionManagerError.sessionAlreadyActive
        }

        logger.info("StreamSession", "Starting stream", context: [
            "resolution": String(describing: config.resolution),
            "frameRate": config.frameRate,
            "codec": String(describing: config.videoCodec)
        ])

        // Create device selector — specific device if provided, otherwise auto-select
        let deviceSelector: any DeviceSelector
        if let deviceId = deviceId {
            deviceSelector = SpecificDeviceSelector(device: deviceId)
            logger.info("StreamSession", "Using specific device", context: ["deviceId": deviceId])
        } else {
            deviceSelector = AutoDeviceSelector(wearables: Wearables.shared)
        }

        // Create stream session
        let session = StreamSession(streamSessionConfig: config, deviceSelector: deviceSelector)
        self.streamSession = session
        self.currentConfig = config

        // Subscribe to state changes
        stateToken = session.statePublisher.listen { [weak self] state in
            Task { @MainActor in
                self?.handleStateChange(state)
            }
        }

        // Subscribe to video frames
        frameToken = session.videoFramePublisher.listen { [weak self] frame in
            Task { @MainActor in
                self?.handleVideoFrame(frame)
            }
        }

        // Subscribe to errors
        errorToken = session.errorPublisher.listen { [weak self] error in
            Task { @MainActor in
                self?.handleError(error)
            }
        }

        // Subscribe to photos
        photoToken = session.photoDataPublisher.listen { [weak self] photoData in
            Task { @MainActor in
                self?.handlePhotoCapture(photoData)
            }
        }

        // Start the session (async in SDK 0.4)
        await session.start()
        logger.info("StreamSession", "Stream session started")
    }

    /// Stop the current streaming session
    public func stopStream() async {
        guard let session = streamSession else {
            logger.warn("StreamSession", "No active stream to stop")
            return
        }

        logger.info("StreamSession", "Stopping stream")
        await session.stop()
        cleanup()
    }

    /// Capture a photo during streaming
    public func capturePhoto(format: PhotoCaptureFormat) -> Bool {
        guard let session = streamSession else {
            logger.warn("StreamSession", "Cannot capture photo - no active stream")
            return false
        }

        guard currentState == .streaming else {
            logger.warn("StreamSession", "Cannot capture photo - not streaming", context: [
                "state": String(describing: currentState)
            ])
            return false
        }

        logger.info("StreamSession", "Capturing photo", context: ["format": String(describing: format)])
        return session.capturePhoto(format: format)
    }

    // MARK: - Event Handlers

    private func handleStateChange(_ state: StreamSessionState) {
        logger.info("StreamSession", "State changed", context: [
            "from": String(describing: currentState),
            "to": String(describing: state)
        ])

        currentState = state
        emitEvent("onStreamStateChange", [
            "state": mapStreamState(state)
        ])
    }

    private func handleVideoFrame(_ frame: VideoFrame) {
        guard let image = frame.makeUIImage() else {
            logger.warn("StreamSession", "Failed to create UIImage from frame")
            return
        }

        // Forward to native view
        frameCallback?(image)

        // Emit metadata to JS
        emitEvent("onVideoFrame", [
            "timestamp": Int(Date().timeIntervalSince1970 * 1000),
            "width": Int(image.size.width),
            "height": Int(image.size.height)
        ])
    }

    private func handleError(_ error: StreamSessionError) {
        logger.error("StreamSession", "Stream error", context: [
            "error": String(describing: error)
        ])

        emitEvent("onStreamError", mapStreamErrorToDict(error))
    }

    private func handlePhotoCapture(_ photoData: PhotoData) {
        logger.info("StreamSession", "Photo captured", context: [
            "format": String(describing: photoData.format)
        ])

        let tempDir = FileManager.default.temporaryDirectory
        let ext = photoData.format == .jpeg ? "jpg" : "heic"
        let filename = "emwdat_photo_\(Int(Date().timeIntervalSince1970 * 1000)).\(ext)"
        let filePath = tempDir.appendingPathComponent(filename)

        do {
            try photoData.data.write(to: filePath)
            logger.info("StreamSession", "Photo saved", context: ["path": filePath.path])

            var payload: [String: Any] = [
                "filePath": filePath.path,
                "format": mapPhotoFormat(photoData.format),
                "timestamp": Int(Date().timeIntervalSince1970 * 1000)
            ]

            if let image = UIImage(data: photoData.data) {
                payload["width"] = Int(image.size.width * image.scale)
                payload["height"] = Int(image.size.height * image.scale)
            }

            emitEvent("onPhotoCaptured", payload)
        } catch {
            logger.error("StreamSession", "Failed to save photo", error: error)
        }
    }

    // MARK: - Cleanup

    private func cleanup() {
        stateToken = nil
        frameToken = nil
        errorToken = nil
        photoToken = nil
        streamSession = nil
        currentConfig = nil
        currentState = .stopped
        logger.debug("StreamSession", "Cleaned up resources")
    }

    // MARK: - Event Emission

    private func emitEvent(_ name: String, _ body: [String: Any]) {
        eventEmitter?(name, body)
    }

    // MARK: - Mapping Helpers

    private func mapStreamState(_ state: StreamSessionState) -> String {
        switch state {
        case .stopping: return "stopping"
        case .stopped: return "stopped"
        case .waitingForDevice: return "waitingForDevice"
        case .starting: return "starting"
        case .streaming: return "streaming"
        case .paused: return "paused"
        @unknown default: return "stopped"
        }
    }

    /// Maps StreamSessionError to a dictionary matching the TS discriminated union
    private func mapStreamErrorToDict(_ error: StreamSessionError) -> [String: Any] {
        switch error {
        case .deviceNotFound(let deviceId):
            return ["type": "deviceNotFound", "deviceId": deviceId]
        case .deviceNotConnected(let deviceId):
            return ["type": "deviceNotConnected", "deviceId": deviceId]
        case .timeout:
            return ["type": "timeout"]
        case .permissionDenied:
            return ["type": "permissionDenied"]
        case .internalError:
            return ["type": "internalError"]
        case .videoStreamingError:
            return ["type": "videoStreamingError"]
        case .audioStreamingError:
            return ["type": "audioStreamingError"]
        case .hingesClosed:
            return ["type": "hingesClosed"]
        @unknown default:
            return ["type": "internalError"]
        }
    }

    private func mapPhotoFormat(_ format: PhotoCaptureFormat) -> String {
        switch format {
        case .jpeg: return "jpeg"
        case .heic: return "heic"
        @unknown default: return "jpeg"
        }
    }
}

// MARK: - Configuration Parsing

extension StreamSessionManager {
    /// Parse configuration from JavaScript object
    nonisolated public static func parseConfig(from dict: [String: Any]) -> StreamSessionConfig {
        // SDK only supports raw video codec
        let videoCodec: VideoCodec = .raw

        let resolution: StreamingResolution
        if let resStr = dict["resolution"] as? String {
            switch resStr {
            case "high": resolution = .high
            case "medium": resolution = .medium
            default: resolution = .low
            }
        } else {
            resolution = .low
        }

        let frameRate = dict["frameRate"] as? Int ?? 15

        return StreamSessionConfig(
            videoCodec: videoCodec,
            resolution: resolution,
            frameRate: UInt(frameRate)
        )
    }
}

// MARK: - Errors

public enum StreamSessionManagerError: LocalizedError {
    case sessionAlreadyActive
    case sessionNotActive
    case notConfigured

    public var errorDescription: String? {
        switch self {
        case .sessionAlreadyActive:
            return "A streaming session is already active"
        case .sessionNotActive:
            return "No streaming session is active"
        case .notConfigured:
            return "Wearables SDK has not been configured"
        }
    }
}
