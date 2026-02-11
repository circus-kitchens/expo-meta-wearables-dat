import ExpoModulesCore
import MWDATCore

public class EMWDATAppDelegateSubscriber: ExpoAppDelegateSubscriber {
    public func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    ) -> Bool {
        return Wearables.shared.handleUrl(url)
    }
}
