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

    private let logger = MetaWearablesLogger.shared

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

    // MARK: - Stream Control

    /// Start a streaming session with the given configuration
    public func startStream(config: StreamSessionConfig) async throws {
        guard streamSession == nil else {
            logger.warn("StreamSession", "Stream already active")
            throw StreamSessionManagerError.sessionAlreadyActive
        }

        logger.info("StreamSession", "Starting stream", context: [
            "resolution": String(describing: config.resolution),
            "frameRate": config.frameRate,
            "codec": String(describing: config.videoCodec)
        ])

        // Create auto device selector
        let deviceSelector = AutoDeviceSelector(wearables: Wearables.shared)

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

        // Start the session
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
        // Convert to UIImage and call the frame callback for native rendering
        guard let image = frame.makeUIImage() else {
            logger.warn("StreamSession", "Failed to create UIImage from frame")
            return
        }

        // Already on main actor, call callback directly
        frameCallback?(image)
    }

    private func handleError(_ error: StreamSessionError) {
        logger.error("StreamSession", "Stream error", context: [
            "error": String(describing: error)
        ])

        emitEvent("onStreamError", [
            "code": mapStreamError(error),
            "message": error.localizedDescription
        ])
    }

    private func handlePhotoCapture(_ photoData: PhotoData) {
        logger.info("StreamSession", "Photo captured", context: [
            "format": String(describing: photoData.format)
        ])

        // Save photo to temp file
        let tempDir = FileManager.default.temporaryDirectory
        let filename = "meta_wearables_photo_\(Int(Date().timeIntervalSince1970 * 1000)).\(photoData.format == .jpeg ? "jpg" : "heic")"
        let filePath = tempDir.appendingPathComponent(filename)

        do {
            try photoData.data.write(to: filePath)
            logger.info("StreamSession", "Photo saved", context: ["path": filePath.path])

            emitEvent("onPhotoCaptured", [
                "filePath": filePath.path,
                "format": mapPhotoFormat(photoData.format),
                "timestamp": Int(Date().timeIntervalSince1970 * 1000)
            ])
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

    private func mapStreamError(_ error: StreamSessionError) -> String {
        switch error {
        case .deviceNotFound(_): return "deviceNotFound"
        case .deviceNotConnected(_): return "deviceNotConnected"
        case .timeout: return "timeout"
        case .permissionDenied: return "permissionDenied"
        case .internalError: return "internalError"
        case .videoStreamingError: return "videoStreamingError"
        case .audioStreamingError: return "audioStreamingError"
        @unknown default: return "internalError"
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
