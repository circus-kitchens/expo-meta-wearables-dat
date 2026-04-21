import Foundation
import UIKit
import MWDATCore
import MWDATCamera

/// Callback type for frame updates
public typealias FrameCallback = (UIImage) -> Void

/// Manages camera streaming as a capability attached to a DeviceSession.
@MainActor
public final class StreamSessionManager {
    public static let shared = StreamSessionManager()

    private let logger = EMWDATLogger.shared

    // MARK: - State

    /// Active stream sessions keyed by sessionId
    private var streams: [String: StreamSession] = [:]
    private var stateTokens: [String: AnyListenerToken] = [:]
    private var frameTokens: [String: AnyListenerToken] = [:]
    private var errorTokens: [String: AnyListenerToken] = [:]
    private var photoTokens: [String: AnyListenerToken] = [:]
    private var hevcDecoders: [String: HEVCDecoder] = [:]

    // MARK: - Callbacks

    private var eventEmitter: EventEmitter?
    private var frameCallback: FrameCallback?
    private var frameCallbackOwner: UUID?

    private init() {}

    // MARK: - Configuration

    /// Set the event emitter for sending events to JavaScript
    public func setEventEmitter(_ emitter: @escaping EventEmitter) {
        self.eventEmitter = emitter
    }

    /// Set the frame callback for native view rendering
    public func setFrameCallback(_ callback: @escaping FrameCallback, owner: UUID) {
        self.frameCallback = callback
        self.frameCallbackOwner = owner
    }

    /// Remove the frame callback only if the caller is the current owner
    public func removeFrameCallback(owner: UUID) {
        guard frameCallbackOwner == owner else { return }
        self.frameCallback = nil
        self.frameCallbackOwner = nil
    }

    // MARK: - Stream Capability Control

    /// Add a camera stream capability to a device session and start streaming.
    public func addStreamToSession(sessionId: String, config: StreamSessionConfig) async throws {
        guard let session = WearablesManager.shared.getSession(sessionId: sessionId) else {
            throw StreamSessionManagerError.sessionNotFound(sessionId)
        }

        logger.info("StreamSession", "Adding stream to session", context: [
            "sessionId": sessionId,
            "resolution": String(describing: config.resolution),
            "frameRate": config.frameRate,
            "codec": String(describing: config.videoCodec)
        ])

        // Create HEVC decoder if needed
        if config.videoCodec == .hvc1 {
            hevcDecoders[sessionId] = HEVCDecoder()
            logger.info("StreamSession", "HEVC decoder created for session", context: ["sessionId": sessionId])
        }

        // Add stream capability to the session
        guard let streamSession = try session.addStream(config: config) else {
            throw StreamSessionManagerError.streamNotFound(sessionId)
        }
        streams[sessionId] = streamSession

        // Subscribe to state changes
        stateTokens[sessionId] = streamSession.statePublisher.listen { [weak self] state in
            Task { @MainActor in
                self?.handleStateChange(sessionId: sessionId, state: state)
            }
        }

        // Subscribe to video frames
        frameTokens[sessionId] = streamSession.videoFramePublisher.listen { [weak self] frame in
            Task { @MainActor in
                self?.handleVideoFrame(sessionId: sessionId, frame: frame)
            }
        }

        // Subscribe to errors
        errorTokens[sessionId] = streamSession.errorPublisher.listen { [weak self] error in
            Task { @MainActor in
                self?.handleError(sessionId: sessionId, error: error)
            }
        }

        // Subscribe to photos
        photoTokens[sessionId] = streamSession.photoDataPublisher.listen { [weak self] photoData in
            Task { @MainActor in
                self?.handlePhotoCapture(sessionId: sessionId, photoData: photoData)
            }
        }

        // Start the stream (required in SDK v0.6)
        await streamSession.start()

        // Emit initial capability state
        emitEvent("onCapabilityStateChange", [
            "sessionId": sessionId,
            "state": "active"
        ])

        logger.info("StreamSession", "Stream added and started", context: ["sessionId": sessionId])
    }

    /// Remove the camera stream capability from a session.
    public func removeStreamFromSession(sessionId: String) async {
        // Stop the stream before destroying
        await streams[sessionId]?.stop()

        destroyStream(sessionId: sessionId)

        emitEvent("onCapabilityStateChange", [
            "sessionId": sessionId,
            "state": "stopped"
        ])

        logger.info("StreamSession", "Stream removed from session", context: ["sessionId": sessionId])
    }

    /// Capture a photo from the active stream on any session.
    public func capturePhoto(format: PhotoCaptureFormat) -> Bool {
        // Find the first streaming session
        guard let (_, streamSession) = streams.first(where: { _ in true }) else {
            logger.warn("StreamSession", "Cannot capture photo - no active stream")
            return false
        }

        logger.info("StreamSession", "Capturing photo", context: ["format": String(describing: format)])
        return streamSession.capturePhoto(format: format)
    }

    // MARK: - Event Handlers

    private func handleStateChange(sessionId: String, state: StreamSessionState) {
        logger.info("StreamSession", "State changed", context: [
            "sessionId": sessionId,
            "state": String(describing: state)
        ])

        emitEvent("onStreamStateChange", [
            "state": mapStreamState(state)
        ])
    }

    private func handleVideoFrame(sessionId: String, frame: VideoFrame) {
        let decoder = hevcDecoders[sessionId]

        // Try SDK's built-in conversion first (works for raw codec).
        // For HEVC, makeUIImage() returns nil — fall back to hardware decoder.
        let image: UIImage
        if let direct = frame.makeUIImage() {
            image = direct
        } else if let decoded = decoder?.decode(frame.sampleBuffer) {
            image = decoded
        } else {
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

    private func handleError(sessionId: String, error: StreamSessionError) {
        logger.error("StreamSession", "Stream error", context: [
            "sessionId": sessionId,
            "error": String(describing: error)
        ])

        emitEvent("onStreamError", mapStreamErrorToDict(error))
    }

    private func handlePhotoCapture(sessionId: String, photoData: PhotoData) {
        logger.info("StreamSession", "Photo captured", context: [
            "sessionId": sessionId,
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

    /// Destroy a specific stream (listeners + decoder).
    private func destroyStream(sessionId: String) {
        stateTokens[sessionId] = nil
        frameTokens[sessionId] = nil
        errorTokens[sessionId] = nil
        photoTokens[sessionId] = nil
        streams[sessionId] = nil
        hevcDecoders[sessionId]?.invalidate()
        hevcDecoders[sessionId] = nil
        logger.debug("StreamSession", "Stream destroyed", context: ["sessionId": sessionId])
    }

    /// Full teardown for module lifecycle (OnDestroy).
    public func destroy() {
        for sessionId in streams.keys {
            destroyStream(sessionId: sessionId)
        }
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
        case .hingesClosed:
            return ["type": "hingesClosed"]
        case .thermalCritical:
            return ["type": "thermalCritical"]
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
        let videoCodec: VideoCodec
        let compressVideo = dict["compressVideo"] as? Bool ?? false
        if compressVideo || (dict["videoCodec"] as? String) == "hvc1" {
            videoCodec = .hvc1
        } else {
            videoCodec = .raw
        }

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
        let skipAppLaunch = dict["skipAppLaunch"] as? Bool ?? false

        return StreamSessionConfig(
            videoCodec: videoCodec,
            resolution: resolution,
            frameRate: UInt(frameRate),
            skipAppLaunch: skipAppLaunch
        )
    }
}

// MARK: - Errors

public enum StreamSessionManagerError: LocalizedError {
    case sessionNotFound(String)
    case streamNotFound(String)
    case notConfigured

    public var errorDescription: String? {
        switch self {
        case .sessionNotFound(let id):
            return "Session not found: \(id)"
        case .streamNotFound(let id):
            return "No active stream for session: \(id)"
        case .notConfigured:
            return "Wearables SDK has not been configured"
        }
    }
}
