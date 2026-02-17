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

    // MARK: - Create / Remove

    public func createMockDevice() -> String {
        let device = MockDeviceKit.shared.pairRaybanMeta()
        let id = "\(device.deviceIdentifier)"
        devices[id] = device
        logger.info("MockDeviceManager", "Created mock device", context: ["id": id])
        return id
    }

    public func removeMockDevice(id: String) throws {
        guard let device = devices[id] else {
            throw MockDeviceManagerError.deviceNotFound(id)
        }
        MockDeviceKit.shared.unpairDevice(device)
        devices.removeValue(forKey: id)
        logger.info("MockDeviceManager", "Removed mock device", context: ["id": id])
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

    // MARK: - Camera

    public func setCameraFeed(id: String, fileURL: URL) async throws {
        let cameraKit = try getDevice(id).getCameraKit()
        await cameraKit.setCameraFeed(fileURL: fileURL)
    }

    public func setCapturedImage(id: String, fileURL: URL) async throws {
        let cameraKit = try getDevice(id).getCameraKit()
        await cameraKit.setCapturedImage(fileURL: fileURL)
    }

    // MARK: - Helpers

    private func getDevice(_ id: String) throws -> any MockRaybanMeta {
        guard let device = devices[id] else {
            throw MockDeviceManagerError.deviceNotFound(id)
        }
        return device
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
