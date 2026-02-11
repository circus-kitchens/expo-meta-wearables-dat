import Foundation
import os.log

/// Log levels for the Meta Wearables module
public enum MetaWearablesLogLevel: Int, Comparable {
    case debug = 0
    case info = 1
    case warn = 2
    case error = 3
    case none = 4

    public static func < (lhs: MetaWearablesLogLevel, rhs: MetaWearablesLogLevel) -> Bool {
        return lhs.rawValue < rhs.rawValue
    }

    var prefix: String {
        switch self {
        case .debug: return "DEBUG"
        case .info: return "INFO"
        case .warn: return "WARN"
        case .error: return "ERROR"
        case .none: return ""
        }
    }

    var osLogType: OSLogType {
        switch self {
        case .debug: return .debug
        case .info: return .info
        case .warn: return .default
        case .error: return .error
        case .none: return .info
        }
    }
}

/// Logger for the Meta Wearables module
/// Format: [MetaWearables] [LEVEL] [Component] Message - {context}
public final class MetaWearablesLogger {
    public static let shared = MetaWearablesLogger()

    private let osLog = OSLog(subsystem: "com.circusgroup.opsai2.metawearables", category: "MetaWearables")
    private var currentLevel: MetaWearablesLogLevel = .info
    private let queue = DispatchQueue(label: "com.circusgroup.opsai2.metawearables.logger")

    private init() {}

    /// Set the minimum log level
    public func setLogLevel(_ level: MetaWearablesLogLevel) {
        queue.sync {
            currentLevel = level
        }
    }

    /// Get current log level
    public func getLogLevel() -> MetaWearablesLogLevel {
        return queue.sync { currentLevel }
    }

    /// Log a debug message
    public func debug(_ component: String, _ message: String, context: [String: Any]? = nil) {
        log(.debug, component: component, message: message, context: context)
    }

    /// Log an info message
    public func info(_ component: String, _ message: String, context: [String: Any]? = nil) {
        log(.info, component: component, message: message, context: context)
    }

    /// Log a warning message
    public func warn(_ component: String, _ message: String, context: [String: Any]? = nil) {
        log(.warn, component: component, message: message, context: context)
    }

    /// Log an error message
    public func error(_ component: String, _ message: String, context: [String: Any]? = nil) {
        log(.error, component: component, message: message, context: context)
    }

    /// Log an error with an Error object
    public func error(_ component: String, _ message: String, error: Error, context: [String: Any]? = nil) {
        var ctx = context ?? [:]
        ctx["error"] = String(describing: error)
        ctx["errorType"] = String(describing: type(of: error))
        log(.error, component: component, message: message, context: ctx)
    }

    private func log(_ level: MetaWearablesLogLevel, component: String, message: String, context: [String: Any]?) {
        guard level >= getLogLevel() else { return }

        var logMessage = "[MetaWearables] [\(level.prefix)] [\(component)] \(message)"

        if let context = context, !context.isEmpty {
            let contextStr = context.map { "\($0.key): \($0.value)" }.joined(separator: ", ")
            logMessage += " - {\(contextStr)}"
        }

        os_log("%{public}@", log: osLog, type: level.osLogType, logMessage)

        #if DEBUG
        print(logMessage)
        #endif
    }
}

// MARK: - Convenience type alias
public typealias Log = MetaWearablesLogger
