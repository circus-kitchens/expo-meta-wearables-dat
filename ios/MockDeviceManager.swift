#if DEBUG
import Foundation
import MWDATCore
import MWDATMockDevice

/// Manages mock devices for testing without physical hardware.
/// Only available in DEBUG builds.
@MainActor
public final class MockDeviceManager {
    public static let shared = MockDeviceManager()

    private let logger = EMWDATLogger.shared

    /// Map of deviceIdentifier → MockRaybanMeta instance
    private var devices: [String: any MockRaybanMeta] = [:]

    private init() {}

    // MARK: - Kit Lifecycle

    public func enableMockDeviceKit(initiallyRegistered: Bool = true, initialPermissionsGranted: Bool = true) {
        let config = MockDeviceKitConfig(
            initiallyRegistered: initiallyRegistered,
            initialPermissionsGranted: initialPermissionsGranted
        )
        MockDeviceKit.shared.enable(config: config)
        logger.info("MockDeviceManager", "MockDeviceKit enabled", context: [
            "initiallyRegistered": initiallyRegistered,
            "initialPermissionsGranted": initialPermissionsGranted
        ])
    }

    public func disableMockDeviceKit() {
        MockDeviceKit.shared.disable()
        devices.removeAll()
        logger.info("MockDeviceManager", "MockDeviceKit disabled")
    }

    public func isMockDeviceKitEnabled() -> Bool {
        return MockDeviceKit.shared.isEnabled
    }

    // MARK: - Pair / Unpair

    public func pairMockDevice() -> String {
        let device = MockDeviceKit.shared.pairRaybanMeta()
        let id = "\(device.deviceIdentifier)"
        devices[id] = device
        logger.info("MockDeviceManager", "Paired mock device", context: ["id": id])
        return id
    }

    public func unpairMockDevice(id: String) throws {
        guard let device = devices[id] else {
            throw MockDeviceManagerError.deviceNotFound(id)
        }
        MockDeviceKit.shared.unpairDevice(device)
        devices.removeValue(forKey: id)
        logger.info("MockDeviceManager", "Unpaired mock device", context: ["id": id])
    }

    public func getMockDevices() -> [String] {
        return Array(devices.keys)
    }

    // MARK: - Power

    public func powerOn(id: String) throws {
        try getDevice(id).powerOn()
    }

    public func powerOff(id: String) throws {
        try getDevice(id).powerOff()
    }

    // MARK: - Don / Doff

    public func don(id: String) throws {
        try getDevice(id).don()
    }

    public func doff(id: String) throws {
        try getDevice(id).doff()
    }

    // MARK: - Fold / Unfold

    public func fold(id: String) throws {
        try getDevice(id).fold()
    }

    public func unfold(id: String) throws {
        try getDevice(id).unfold()
    }

    // MARK: - Camera (file-based — now synchronous in SDK 0.6)

    public func setCameraFeed(id: String, fileURL: URL) throws {
        let camera = try getDevice(id).services.camera
        camera.setCameraFeed(fileURL: fileURL)
    }

    public func setCapturedImage(id: String, fileURL: URL) throws {
        let camera = try getDevice(id).services.camera
        camera.setCapturedImage(fileURL: fileURL)
    }

    // MARK: - Camera (phone camera — new in SDK 0.6)

    public func setCameraFeedFromCamera(id: String, facing: String) async throws {
        let camera = try getDevice(id).services.camera
        let cameraFacing: CameraFacing = facing == "back" ? .back : .front
        await camera.setCameraFeed(cameraFacing: cameraFacing)
    }

    // MARK: - Permissions

    public func setPermissionStatus(permission: String, status: String) {
        guard let perm = mapPermission(permission),
              let stat = mapPermissionStatus(status) else { return }
        MockDeviceKit.shared.permissions.set(perm, stat)
        logger.info("MockDeviceManager", "Set permission status", context: [
            "permission": permission,
            "status": status
        ])
    }

    public func setPermissionRequestResult(permission: String, result: String) {
        guard let perm = mapPermission(permission),
              let stat = mapPermissionStatus(result) else { return }
        MockDeviceKit.shared.permissions.setRequestResult(perm, result: stat)
        logger.info("MockDeviceManager", "Set permission request result", context: [
            "permission": permission,
            "result": result
        ])
    }

    // MARK: - Helpers

    private func getDevice(_ id: String) throws -> any MockRaybanMeta {
        guard let device = devices[id] else {
            throw MockDeviceManagerError.deviceNotFound(id)
        }
        return device
    }

    private func mapPermission(_ permission: String) -> Permission? {
        switch permission {
        case "camera": return .camera
        default: return nil
        }
    }

    private func mapPermissionStatus(_ status: String) -> PermissionStatus? {
        switch status {
        case "granted": return .granted
        case "denied": return .denied
        default: return nil
        }
    }
}

public enum MockDeviceManagerError: LocalizedError {
    case deviceNotFound(String)

    public var errorDescription: String? {
        switch self {
        case .deviceNotFound(let id):
            return "Mock device not found: \(id)"
        }
    }
}
#endif
