import ExpoModulesCore
import MWDATCore
import MWDATCamera

public class MetaWearablesModule: Module {
    private let logger = MetaWearablesLogger.shared

    public func definition() -> ModuleDefinition {
        Name("MetaWearables")

        // MARK: - Lifecycle

        OnCreate {
            self.logger.info("Module", "Module created")
            // Set up event emitter bridge on main actor
            Task { @MainActor in
                WearablesManager.shared.setEventEmitter { [weak self] eventName, body in
                    self?.sendEvent(eventName, body)
                }
            }
        }

        OnDestroy {
            self.logger.info("Module", "Module destroyed")
            Task { @MainActor in
                WearablesManager.shared.cleanup()
            }
        }

        // MARK: - Events

        Events(
            "onRegistrationStateChange",
            "onDevicesChange",
            "onDeviceLinkStateChange",
            "onStreamStateChange",
            "onStreamError",
            "onPhotoCaptured",
            "onPermissionStatusChange"
        )

        // MARK: - Logging

        Function("setLogLevel") { (level: String) in
            let logLevel: MetaWearablesLogLevel
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
            self.logger.info("Module", "configure() called")
            Task { @MainActor in
                do {
                    try WearablesManager.shared.configure()
                    self.logger.info("Module", "SDK configured successfully")
                    promise.resolve(nil)
                } catch {
                    self.logger.error("Module", "Failed to configure SDK", error: error)
                    promise.reject("CONFIGURATION_FAILED", "Failed to configure Wearables SDK: \(error.localizedDescription)")
                }
            }
        }

        // MARK: - Registration

        Function("getRegistrationState") { () -> String in
            // Return cached state synchronously - will be updated via event
            return "unavailable"
        }

        AsyncFunction("getRegistrationStateAsync") { (promise: Promise) in
            Task { @MainActor in
                let state = WearablesManager.shared.currentRegistrationState
                self.logger.debug("Module", "getRegistrationState()", context: ["state": String(describing: state)])
                promise.resolve(self.mapRegistrationState(state))
            }
        }

        AsyncFunction("startRegistration") { (promise: Promise) in
            self.logger.info("Module", "startRegistration() called")
            Task { @MainActor in
                do {
                    try WearablesManager.shared.startRegistration()
                    self.logger.info("Module", "Registration started")
                    promise.resolve(nil)
                } catch {
                    self.logger.error("Module", "Failed to start registration", error: error)
                    promise.reject("REGISTRATION_FAILED", "Failed to start registration: \(error.localizedDescription)")
                }
            }
        }

        AsyncFunction("startUnregistration") { (promise: Promise) in
            self.logger.info("Module", "startUnregistration() called")
            Task { @MainActor in
                do {
                    try WearablesManager.shared.startUnregistration()
                    self.logger.info("Module", "Unregistration started")
                    promise.resolve(nil)
                } catch {
                    self.logger.error("Module", "Failed to start unregistration", error: error)
                    promise.reject("UNREGISTRATION_FAILED", "Failed to start unregistration: \(error.localizedDescription)")
                }
            }
        }

        // MARK: - Permissions

        AsyncFunction("checkPermissionStatus") { (permission: String, promise: Promise) in
            self.logger.debug("Module", "checkPermissionStatus()", context: ["permission": permission])
            guard permission == "camera" else {
                self.logger.warn("Module", "Unknown permission type", context: ["permission": permission])
                promise.resolve("denied")
                return
            }
            Task { @MainActor in
                do {
                    let status = try await WearablesManager.shared.checkPermissionStatus(.camera)
                    promise.resolve(self.mapPermissionStatus(status))
                } catch {
                    self.logger.error("Module", "Failed to check permission status", error: error)
                    promise.resolve("denied")
                }
            }
        }

        AsyncFunction("requestPermission") { (permission: String, promise: Promise) in
            self.logger.info("Module", "requestPermission() called", context: ["permission": permission])
            guard permission == "camera" else {
                self.logger.warn("Module", "Unknown permission type", context: ["permission": permission])
                promise.reject("INVALID_PERMISSION", "Unknown permission type: \(permission)")
                return
            }
            Task { @MainActor in
                do {
                    let status = try await WearablesManager.shared.requestPermission(.camera)
                    self.logger.info("Module", "Permission request completed", context: ["status": String(describing: status)])
                    promise.resolve(self.mapPermissionStatus(status))
                } catch {
                    self.logger.error("Module", "Failed to request permission", error: error)
                    promise.reject("PERMISSION_REQUEST_FAILED", "Failed to request permission: \(error.localizedDescription)")
                }
            }
        }

        // MARK: - Devices

        AsyncFunction("getDevices") { (promise: Promise) in
            Task { @MainActor in
                let devices = WearablesManager.shared.getDevices()
                self.logger.debug("Module", "getDevices()", context: ["count": devices.count])
                promise.resolve(devices)
            }
        }

        AsyncFunction("getDevice") { (identifier: String, promise: Promise) in
            Task { @MainActor in
                self.logger.debug("Module", "getDevice()", context: ["identifier": identifier])
                let device = WearablesManager.shared.getDevice(identifier: identifier)
                promise.resolve(device)
            }
        }

        // MARK: - Streaming

        AsyncFunction("getStreamState") { (promise: Promise) in
            Task { @MainActor in
                let state = StreamSessionManager.shared.currentState
                self.logger.debug("Module", "getStreamState()", context: ["state": String(describing: state)])
                promise.resolve(self.mapStreamState(state))
            }
        }

        AsyncFunction("startStream") { (config: [String: Any], promise: Promise) in
            self.logger.info("Module", "startStream() called", context: ["config": config])

            Task { @MainActor in
                // Set up event emitter for stream events
                StreamSessionManager.shared.setEventEmitter { [weak self] eventName, body in
                    self?.sendEvent(eventName, body)
                }

                do {
                    let sessionConfig = StreamSessionManager.parseConfig(from: config)
                    try await StreamSessionManager.shared.startStream(config: sessionConfig)
                    promise.resolve(nil)
                } catch {
                    self.logger.error("Module", "Failed to start stream", error: error)
                    promise.reject("STREAM_START_FAILED", "Failed to start stream: \(error.localizedDescription)")
                }
            }
        }

        AsyncFunction("stopStream") { (promise: Promise) in
            self.logger.info("Module", "stopStream() called")
            Task { @MainActor in
                await StreamSessionManager.shared.stopStream()
                promise.resolve(nil)
            }
        }

        // MARK: - Photo Capture

        AsyncFunction("capturePhoto") { (format: String, promise: Promise) in
            self.logger.info("Module", "capturePhoto() called", context: ["format": format])

            let photoFormat: PhotoCaptureFormat
            switch format {
            case "heic": photoFormat = .heic
            default: photoFormat = .jpeg
            }

            Task { @MainActor in
                let success = StreamSessionManager.shared.capturePhoto(format: photoFormat)
                if success {
                    // Photo will be delivered via onPhotoCaptured event
                    promise.resolve(nil)
                } else {
                    promise.reject("CAPTURE_FAILED", "Failed to capture photo - stream may not be active")
                }
            }
        }
    }

    // MARK: - Helper Methods

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
