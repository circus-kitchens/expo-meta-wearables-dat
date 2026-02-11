import Foundation
import MWDATCore
import MWDATCamera

/// Callback type for sending events to the Expo module
public typealias EventEmitter = (String, [String: Any]) -> Void

/// Singleton manager for Meta Wearables SDK
/// Handles state management, event subscription, and coordinates with the Expo module
@MainActor
public final class WearablesManager {
    public static let shared = WearablesManager()

    private let logger = MetaWearablesLogger.shared

    // MARK: - State

    private(set) var isConfigured = false
    private var eventEmitter: EventEmitter?

    // MARK: - Listener Tokens

    private var registrationStateToken: AnyListenerToken?
    private var devicesToken: AnyListenerToken?
    private var deviceLinkStateTokens: [DeviceIdentifier: AnyListenerToken] = [:]
    private var urlCallbackObserver: NSObjectProtocol?

    // MARK: - Cached State

    private(set) var currentRegistrationState: RegistrationState = .unavailable
    private(set) var currentDevices: [DeviceIdentifier] = []

    private init() {}

    // MARK: - Configuration

    /// Set the event emitter callback for sending events to JavaScript
    public func setEventEmitter(_ emitter: @escaping EventEmitter) {
        logger.debug("Manager", "Event emitter set")
        self.eventEmitter = emitter
    }

    /// Configure the Wearables SDK (idempotent - safe to call multiple times)
    public func configure() throws {
        guard !isConfigured else {
            logger.info("Manager", "SDK already configured, skipping configuration")
            return
        }

        logger.info("Manager", "Configuring SDK")
        try Wearables.configure()
        isConfigured = true

        // Start listening to state changes
        setupListeners()

        // Set up URL callback handler for Meta AI app redirects
        setupURLCallbackHandler()

        logger.info("Manager", "SDK configured and listeners attached")
    }

    // MARK: - Listeners Setup

    private func setupListeners() {
        // Listen for registration state changes
        registrationStateToken = Wearables.shared.addRegistrationStateListener { [weak self] state in
            Task { @MainActor in
                self?.handleRegistrationStateChange(state)
            }
        }

        // Listen for device list changes
        devicesToken = Wearables.shared.addDevicesListener { [weak self] devices in
            Task { @MainActor in
                self?.handleDevicesChange(devices)
            }
        }

        logger.debug("Manager", "Listeners attached")
    }

    // MARK: - URL Callback Handler

    private func setupURLCallbackHandler() {
        // Listen for URL callbacks from AppDelegate
        urlCallbackObserver = NotificationCenter.default.addObserver(
            forName: Notification.Name("MetaWearablesURLCallback"),
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let url = notification.userInfo?["url"] as? URL else {
                self?.logger.warn("Manager", "URL callback received but URL is missing")
                return
            }
            self?.handleURLCallback(url)
        }
        logger.debug("Manager", "URL callback handler registered")
    }

    private func handleURLCallback(_ url: URL) {
        logger.info("Manager", "Handling URL callback", context: ["url": url.absoluteString])

        Task { @MainActor in
            do {
                _ = try await Wearables.shared.handleUrl(url)
                self.logger.info("Manager", "URL callback handled successfully")
            } catch {
                self.logger.error("Manager", "Failed to handle URL callback", error: error)
            }
        }
    }

    private func handleRegistrationStateChange(_ state: RegistrationState) {
        logger.info("Manager", "Registration state changed", context: [
            "from": String(describing: currentRegistrationState),
            "to": String(describing: state)
        ])

        currentRegistrationState = state
        emitEvent("onRegistrationStateChange", [
            "state": mapRegistrationState(state)
        ])
    }

    private func handleDevicesChange(_ devices: [DeviceIdentifier]) {
        logger.info("Manager", "Devices changed", context: ["count": devices.count])

        // Track which devices were added/removed
        let previousDevices = Set(currentDevices)
        let newDevices = Set(devices)
        let addedDevices = newDevices.subtracting(previousDevices)
        let removedDevices = previousDevices.subtracting(newDevices)

        // Remove link state listeners for removed devices
        for deviceId in removedDevices {
            deviceLinkStateTokens[deviceId] = nil
            logger.debug("Manager", "Removed link state listener", context: ["deviceId": deviceId])
        }

        // Add link state listeners for new devices
        for deviceId in addedDevices {
            if let device = Wearables.shared.deviceForIdentifier(deviceId) {
                let token = device.addLinkStateListener { [weak self] linkState in
                    Task { @MainActor in
                        self?.handleDeviceLinkStateChange(deviceId: deviceId, linkState: linkState)
                    }
                }
                deviceLinkStateTokens[deviceId] = token
                logger.debug("Manager", "Added link state listener", context: ["deviceId": deviceId])
            }
        }

        currentDevices = devices
        emitEvent("onDevicesChange", [
            "devices": devices.compactMap { id -> [String: Any]? in
                guard let device = Wearables.shared.deviceForIdentifier(id) else { return nil }
                return mapDevice(device)
            }
        ])
    }

    private func handleDeviceLinkStateChange(deviceId: DeviceIdentifier, linkState: LinkState) {
        logger.info("Manager", "Device link state changed", context: [
            "deviceId": deviceId,
            "linkState": String(describing: linkState)
        ])

        emitEvent("onDeviceLinkStateChange", [
            "deviceId": deviceId,
            "linkState": linkState == .connected ? "connected" : "disconnected"
        ])
    }

    // MARK: - Registration

    public func startRegistration() throws {
        guard isConfigured else {
            logger.error("Manager", "Cannot start registration - SDK not configured")
            throw WearablesManagerError.notConfigured
        }

        logger.info("Manager", "Starting registration")
        try Wearables.shared.startRegistration()
    }

    public func startUnregistration() throws {
        guard isConfigured else {
            logger.error("Manager", "Cannot start unregistration - SDK not configured")
            throw WearablesManagerError.notConfigured
        }

        logger.info("Manager", "Starting unregistration")
        try Wearables.shared.startUnregistration()
    }

    // MARK: - Permissions

    public func checkPermissionStatus(_ permission: Permission) async throws -> PermissionStatus {
        logger.debug("Manager", "Checking permission status", context: ["permission": String(describing: permission)])
        return try await Wearables.shared.checkPermissionStatus(permission)
    }

    public func requestPermission(_ permission: Permission) async throws -> PermissionStatus {
        guard isConfigured else {
            logger.error("Manager", "Cannot request permission - SDK not configured")
            throw WearablesManagerError.notConfigured
        }

        logger.info("Manager", "Requesting permission", context: ["permission": String(describing: permission)])
        let status = try await Wearables.shared.requestPermission(permission)

        emitEvent("onPermissionStatusChange", [
            "permission": permission == .camera ? "camera" : "unknown",
            "status": mapPermissionStatus(status)
        ])

        return status
    }

    // MARK: - Devices

    public func getDevices() -> [[String: Any]] {
        return currentDevices.compactMap { id -> [String: Any]? in
            guard let device = Wearables.shared.deviceForIdentifier(id) else { return nil }
            return mapDevice(device)
        }
    }

    public func getDevice(identifier: DeviceIdentifier) -> [String: Any]? {
        guard let device = Wearables.shared.deviceForIdentifier(identifier) else { return nil }
        return mapDevice(device)
    }

    // MARK: - Event Emission

    private func emitEvent(_ name: String, _ body: [String: Any]) {
        logger.debug("Manager", "Emitting event", context: ["event": name])
        eventEmitter?(name, body)
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

    private func mapDevice(_ device: Device) -> [String: Any] {
        return [
            "identifier": device.identifier,
            "name": device.name,
            "linkState": device.linkState == .connected ? "connected" : "disconnected",
            "deviceType": device.deviceType() == .rayBanMeta ? "rayBanMeta" : "unknown",
            "compatibility": device.compatibility() == .compatible ? "compatible" : "incompatible"
        ]
    }

    // MARK: - Cleanup

    public func cleanup() {
        logger.info("Manager", "Cleaning up listeners")
        registrationStateToken = nil
        devicesToken = nil
        deviceLinkStateTokens.removeAll()

        // Remove URL callback observer
        if let observer = urlCallbackObserver {
            NotificationCenter.default.removeObserver(observer)
            urlCallbackObserver = nil
        }
    }
}

// MARK: - Errors

public enum WearablesManagerError: LocalizedError {
    case alreadyConfigured
    case notConfigured

    public var errorDescription: String? {
        switch self {
        case .alreadyConfigured:
            return "Wearables SDK has already been configured"
        case .notConfigured:
            return "Wearables SDK has not been configured. Call configure() first."
        }
    }
}
