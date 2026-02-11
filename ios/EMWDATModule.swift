import ExpoModulesCore
import MWDATCore
import MWDATCamera

public class EMWDATModule: Module {
    private let logger = EMWDATLogger.shared

    public func definition() -> ModuleDefinition {
        Name("EMWDAT")

        Events(
            "onRegistrationStateChange",
            "onDevicesChange",
            "onLinkStateChange",
            "onStreamStateChange",
            "onVideoFrame",
            "onPhotoCaptured",
            "onStreamError",
            "onPermissionStatusChange"
        )

        // MARK: - Lifecycle

        OnCreate {
            self.logger.info("Module", "Module created")
            Task { @MainActor in
                let emitter: EventEmitter = { [weak self] name, body in
                    self?.sendEvent(name, body)
                }
                WearablesManager.shared.setEventEmitter(emitter)
                StreamSessionManager.shared.setEventEmitter(emitter)
            }
        }

        OnDestroy {
            self.logger.info("Module", "Module destroyed")
            Task { @MainActor in
                WearablesManager.shared.cleanup()
            }
        }

        // MARK: - Logging

        Function("setLogLevel") { (level: String) in
            let logLevel: EMWDATLogLevel
            switch level {
            case "debug": logLevel = .debug
            case "info": logLevel = .info
            case "warn": logLevel = .warn
            case "error": logLevel = .error
            case "none": logLevel = .none
            default: logLevel = .info
            }
            self.logger.setLogLevel(logLevel)
            self.logger.info("Module", "Log level set", context: ["level": level])
        }

        // MARK: - Configuration

        AsyncFunction("configure") { (promise: Promise) in
            Task { @MainActor in
                do {
                    try WearablesManager.shared.configure()
                    promise.resolve(nil)
                } catch {
                    promise.reject("CONFIGURATION_FAILED", "Failed to configure SDK: \(error.localizedDescription)")
                }
            }
        }

        // MARK: - Registration

        Function("getRegistrationState") { () -> String in
            return "unavailable"
        }

        AsyncFunction("getRegistrationStateAsync") { (promise: Promise) in
            Task { @MainActor in
                let state = WearablesManager.shared.currentRegistrationState
                promise.resolve(self.mapRegistrationState(state))
            }
        }

        AsyncFunction("startRegistration") { (promise: Promise) in
            Task { @MainActor in
                do {
                    try WearablesManager.shared.startRegistration()
                    promise.resolve(nil)
                } catch {
                    promise.reject("REGISTRATION_FAILED", error.localizedDescription)
                }
            }
        }

        AsyncFunction("startUnregistration") { (promise: Promise) in
            Task { @MainActor in
                do {
                    try WearablesManager.shared.startUnregistration()
                    promise.resolve(nil)
                } catch {
                    promise.reject("UNREGISTRATION_FAILED", error.localizedDescription)
                }
            }
        }

        // MARK: - URL Handling

        Function("handleUrl") { (url: String) -> Bool in
            guard let parsedUrl = URL(string: url) else {
                self.logger.warn("Module", "Invalid URL", context: ["url": url])
                return false
            }
            // Call SDK directly (not through @MainActor manager) since Function runs on JS thread.
            // SDK's handleUrl is a synchronous URL routing call.
            return Wearables.shared.handleUrl(parsedUrl)
        }

        // MARK: - Permissions

        AsyncFunction("checkPermissionStatus") { (permission: String, promise: Promise) in
            guard permission == "camera" else {
                promise.resolve("denied")
                return
            }
            Task { @MainActor in
                let status = WearablesManager.shared.checkPermissionStatus(.camera)
                promise.resolve(self.mapPermissionStatus(status))
            }
        }

        AsyncFunction("requestPermission") { (permission: String, promise: Promise) in
            guard permission == "camera" else {
                promise.reject("INVALID_PERMISSION", "Unknown permission: \(permission)")
                return
            }
            Task { @MainActor in
                let status = WearablesManager.shared.requestPermission(.camera)
                promise.resolve(self.mapPermissionStatus(status))
            }
        }

        // MARK: - Devices

        AsyncFunction("getDevices") { (promise: Promise) in
            Task { @MainActor in
                promise.resolve(WearablesManager.shared.getDevices())
            }
        }

        AsyncFunction("getDevice") { (identifier: String, promise: Promise) in
            Task { @MainActor in
                promise.resolve(WearablesManager.shared.getDevice(identifier: identifier))
            }
        }

        // MARK: - Streaming

        AsyncFunction("getStreamState") { (promise: Promise) in
            Task { @MainActor in
                let state = StreamSessionManager.shared.currentState
                promise.resolve(self.mapStreamState(state))
            }
        }

        AsyncFunction("startStream") { (config: [String: Any], promise: Promise) in
            Task { @MainActor in
                do {
                    let sessionConfig = StreamSessionManager.parseConfig(from: config)
                    try StreamSessionManager.shared.startStream(config: sessionConfig)
                    promise.resolve(nil)
                } catch {
                    promise.reject("STREAM_START_FAILED", error.localizedDescription)
                }
            }
        }

        AsyncFunction("stopStream") { (promise: Promise) in
            Task { @MainActor in
                StreamSessionManager.shared.stopStream()
                promise.resolve(nil)
            }
        }

        // MARK: - Photo Capture

        AsyncFunction("capturePhoto") { (format: String, promise: Promise) in
            Task { @MainActor in
                let photoFormat: PhotoCaptureFormat = format == "heic" ? .heic : .jpeg
                let success = StreamSessionManager.shared.capturePhoto(format: photoFormat)
                if success {
                    promise.resolve(nil)
                } else {
                    promise.reject("CAPTURE_FAILED", "Failed to capture photo - stream may not be active")
                }
            }
        }

        // MARK: - View (EMWDATStreamView created in step 6)

        View(EMWDATStreamView.self) {
            Prop("isActive") { (view: EMWDATStreamView, isActive: Bool) in
                view.setActive(isActive)
            }

            Prop("resizeMode") { (view: EMWDATStreamView, resizeMode: String) in
                view.setResizeMode(resizeMode)
            }
        }
    }

    // MARK: - Mapping Helpers

    private func mapRegistrationState(_ state: RegistrationState) -> String {
        switch state {
        case .unavailable: return "unavailable"
        case .available: return "available"
        case .registering: return "registering"
        case .registered: return "registered"
        @unknown default: return "unavailable"
        }
    }

    private func mapPermissionStatus(_ status: PermissionStatus) -> String {
        switch status {
        case .granted: return "granted"
        case .denied: return "denied"
        @unknown default: return "denied"
        }
    }

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
}
