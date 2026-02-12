import ExpoModulesCore
import MWDATCore

public class EMWDATAppDelegateSubscriber: ExpoAppDelegateSubscriber {
    public func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    ) -> Bool {
        // handleUrl is async in SDK 0.4 — fire-and-forget since delegate must return synchronously
        Task {
            do {
                _ = try await Wearables.shared.handleUrl(url)
            } catch {
                EMWDATLogger.shared.error("AppDelegate", "handleUrl failed", error: error)
            }
        }
        return true
    }
}
