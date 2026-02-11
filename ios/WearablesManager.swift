import Foundation
import MWDATCore

/// Callback type for sending events to the Expo module
public typealias EventEmitter = (String, [String: Any]) -> Void

/// Singleton manager for Meta Wearables SDK
/// Handles state management, event subscription, and coordinates with the Expo module
@MainActor
public final class WearablesManager {
    public static let shared = WearablesManager()

    private let logger = EMWDATLogger.shared

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
            logger.info("Manager", "SDK already configured, skipping")
            return
        }

        logger.info("Manager", "Configuring SDK")
        try Wearables.configure()
        isConfigured = true

        setupListeners()
        setupURLCallbackHandler()

        logger.info("Manager", "SDK configured and listeners attached")
    }

    // MARK: - Listeners Setup

    private func setupListeners() {
        registrationStateToken = Wearables.shared.addRegistrationStateListener { [weak self] state in
            Task { @MainActor in
                self?.handleRegistrationStateChange(state)
            }
        }

        devicesToken = Wearables.shared.addDevicesListener { [weak self] devices in
            Task { @MainActor in
                self?.handleDevicesChange(devices)
            }
        }

        logger.debug("Manager", "Listeners attached")
    }

    // MARK: - URL Callback Handler (backup for AppDelegateSubscriber)

    private func setupURLCallbackHandler() {
        urlCallbackObserver = NotificationCenter.default.addObserver(
            forName: Notification.Name("EMWDATURLCallback"),
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let url = notification.userInfo?["url"] as? URL else {
                self?.logger.warn("Manager", "URL callback received but URL is missing")
                return
            }
            Task { @MainActor in
                await self?.handleUrl(url)
            }
        }
        logger.debug("Manager", "URL callback handler registered")
    }

    // MARK: - URL Handling

    /// Handle a URL callback from the Meta AI app (async in SDK 0.4)
    @discardableResult
    public func handleUrl(_ url: URL) async -> Bool {
        logger.info("Manager", "Handling URL callback", context: ["url": url.absoluteString])
        do {
            let handled = try await Wearables.shared.handleUrl(url)
            logger.info("Manager", "URL callback result", context: ["handled": handled])
            return handled
        } catch {
            logger.error("Manager", "handleUrl failed", error: error)
            return false
        }
    }

    // MARK: - State Change Handlers

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
        emitDeviceList()
    }

    private func handleDeviceLinkStateChange(deviceId: DeviceIdentifier, linkState: LinkState) {
        logger.info("Manager", "Device link state changed", context: [
            "deviceId": deviceId,
            "linkState": String(describing: linkState)
        ])

        emitEvent("onLinkStateChange", [
            "deviceId": deviceId,
            "linkState": mapLinkState(linkState)
        ])

        // Re-emit full device list so JS side gets updated device data
        emitDeviceList()

        // Delayed re-emit: properties like compatibility may update after connection is established
        if linkState == .connected {
            Task { @MainActor [weak self] in
                try? await Task.sleep(nanoseconds: 1_500_000_000)
                self?.emitDeviceList()
            }
        }
    }

    private func emitDeviceList() {
        emitEvent("onDevicesChange", [
            "devices": currentDevices.compactMap { id -> [String: Any]? in
                guard let device = Wearables.shared.deviceForIdentifier(id) else { return nil }
                return serializeDevice(device)
            }
        ])
    }

    // MARK: - Registration

    public func startRegistration() async throws {
        guard isConfigured else {
            throw WearablesManagerError.notConfigured
        }

        logger.info("Manager", "Starting registration")
        try await Wearables.shared.startRegistration()
    }

    public func startUnregistration() async throws {
        guard isConfigured else {
            throw WearablesManagerError.notConfigured
        }

        logger.info("Manager", "Starting unregistration")
        try await Wearables.shared.startUnregistration()
    }

    // MARK: - Permissions (async throws in SDK 0.4)

    public func checkPermissionStatus(_ permission: Permission) async throws -> PermissionStatus {
        logger.debug("Manager", "Checking permission status", context: ["permission": String(describing: permission)])
        return try await Wearables.shared.checkPermissionStatus(permission)
    }

    public func requestPermission(_ permission: Permission) async throws -> PermissionStatus {
        guard isConfigured else {
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
            return serializeDevice(device)
        }
    }

    public func getDevice(identifier: DeviceIdentifier) -> [String: Any]? {
        guard let device = Wearables.shared.deviceForIdentifier(identifier) else { return nil }
        return serializeDevice(device)
    }

    // MARK: - Event Emission

    private func emitEvent(_ name: String, _ body: [String: Any]) {
        logger.debug("Manager", "Emitting event", context: ["event": name])
        eventEmitter?(name, body)
    }

    // MARK: - Serialization

    private func serializeDevice(_ device: Device) -> [String: Any] {
        return [
            "identifier": device.identifier,
            "name": device.name,
            "linkState": mapLinkState(device.linkState),
            "deviceType": mapDeviceType(device.deviceType()),
            "compatibility": device.compatibility() == .compatible ? "compatible" : "incompatible"
        ]
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

    private func mapLinkState(_ linkState: LinkState) -> String {
        switch linkState {
        case .connected: return "connected"
        case .connecting: return "connecting"
        case .disconnected: return "disconnected"
        @unknown default: return "disconnected"
        }
    }

    private func mapDeviceType(_ deviceType: DeviceType) -> String {
        switch deviceType {
        case .rayBanMeta: return "rayBanMeta"
        case .oakleyMetaHSTN: return "oakleyMetaHSTN"
        case .oakleyMetaVanguard: return "oakleyMetaVanguard"
        case .metaRayBanDisplay: return "metaRayBanDisplay"
        case .unknown: return "unknown"
        @unknown default: return "unknown"
        }
    }

    // MARK: - Cleanup

    public func cleanup() {
        logger.info("Manager", "Cleaning up listeners")
        registrationStateToken = nil
        devicesToken = nil
        deviceLinkStateTokens.removeAll()

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
