import Foundation
import MWDATCore
import MWDATDisplay

public typealias EventEmitterDisplay = (String, [String: Any]) -> Void

@MainActor
public final class DisplaySessionManager {
    public static let shared = DisplaySessionManager()

    private let logger = EMWDATLogger.shared
    private var displays: [String: Display] = [:]
    private var stateTokens: [String: AnyListenerToken] = [:]
    private var eventEmitter: EventEmitterDisplay?

    private init() {}

    public func setEventEmitter(_ emitter: @escaping EventEmitterDisplay) {
        self.eventEmitter = emitter
    }

    // MARK: - Display Capability Control

    public func addDisplayToSession(sessionId: String) async throws {
        guard let session = WearablesManager.shared.getSession(sessionId: sessionId) else {
            throw DisplaySessionManagerError.sessionNotFound(sessionId)
        }

        let display = try session.addDisplay()
        displays[sessionId] = display

        stateTokens[sessionId] = display.statePublisher.listen { [weak self] state in
            Task { @MainActor in
                self?.handleStateChange(sessionId: sessionId, state: state)
            }
        }

        await display.start()

        logger.info("Display", "Display added and started", context: ["sessionId": sessionId])
    }

    public func removeDisplayFromSession(sessionId: String) async {
        await displays[sessionId]?.stop()
        destroyDisplay(sessionId: sessionId)
        emitEvent("onDisplayStateChange", ["sessionId": sessionId, "state": "stopped"])
        logger.info("Display", "Display removed from session", context: ["sessionId": sessionId])
    }

    public func sendDisplayContent(sessionId: String, contentTree: [String: Any]) async throws {
        guard let display = displays[sessionId] else {
            throw DisplaySessionManagerError.displayNotFound(sessionId)
        }

        guard let rootView = DisplayContentBuilder.build(from: contentTree, onInteraction: { [weak self] interactionId in
            Task { @MainActor in
                self?.emitEvent("onDisplayInteraction", [
                    "sessionId": sessionId,
                    "interactionId": interactionId
                ])
            }
        }) as? FlexBox else {
            throw DisplaySessionManagerError.invalidContentTree("Root node must be a flexBox")
        }

        try await display.send(rootView)
    }

    public func destroy() {
        for sessionId in Array(displays.keys) {
            destroyDisplay(sessionId: sessionId)
        }
    }

    // MARK: - Private

    private func handleStateChange(sessionId: String, state: DisplayState) {
        let mapped = mapDisplayState(state)
        logger.info("Display", "State changed", context: ["sessionId": sessionId, "state": mapped])
        emitEvent("onDisplayStateChange", ["sessionId": sessionId, "state": mapped])

        if state == .stopped || state == .stopping {
            // Only fully destroy on stopped, not stopping
        }
        if state == .stopped {
            destroyDisplay(sessionId: sessionId)
        }
    }

    private func destroyDisplay(sessionId: String) {
        stateTokens[sessionId] = nil
        displays[sessionId] = nil
    }

    private func mapDisplayState(_ state: DisplayState) -> String {
        switch state {
        case .stopped: return "stopped"
        case .starting: return "starting"
        case .started: return "started"
        case .stopping: return "stopping"
        @unknown default: return "stopped"
        }
    }

    private func emitEvent(_ name: String, _ body: [String: Any]) {
        eventEmitter?(name, body)
    }
}

// MARK: - Errors

public enum DisplaySessionManagerError: LocalizedError {
    case sessionNotFound(String)
    case displayNotFound(String)
    case invalidContentTree(String)

    public var errorDescription: String? {
        switch self {
        case .sessionNotFound(let id): return "Session not found: \(id)"
        case .displayNotFound(let id): return "No active display for session: \(id)"
        case .invalidContentTree(let reason): return "Invalid content tree: \(reason)"
        }
    }
}
