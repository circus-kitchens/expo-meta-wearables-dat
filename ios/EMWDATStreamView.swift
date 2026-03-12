import ExpoModulesCore
import UIKit

/// Native view for rendering video stream frames from Meta Wearables
public class EMWDATStreamView: ExpoView {
    private let logger = EMWDATLogger.shared
    private let imageView = UIImageView()
    private var isActive: Bool = false
    private let viewId = UUID()

    // MARK: - Initialization

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        setupView()
    }

    private func setupView() {
        imageView.contentMode = .scaleAspectFit
        imageView.backgroundColor = .black
        imageView.clipsToBounds = true
        imageView.translatesAutoresizingMaskIntoConstraints = false

        addSubview(imageView)

        NSLayoutConstraint.activate([
            imageView.topAnchor.constraint(equalTo: topAnchor),
            imageView.bottomAnchor.constraint(equalTo: bottomAnchor),
            imageView.leadingAnchor.constraint(equalTo: leadingAnchor),
            imageView.trailingAnchor.constraint(equalTo: trailingAnchor)
        ])

        logger.debug("StreamView", "View initialized")
    }

    // MARK: - Props

    /// Called by EMWDATModule Prop("isActive")
    func setActive(_ active: Bool) {
        isActive = active
        Task { @MainActor in
            if active {
                self.logger.info("StreamView", "Subscribing to frames", context: ["viewId": self.viewId.uuidString.prefix(8)])
                StreamSessionManager.shared.setFrameCallback({ [weak self] image in
                    self?.imageView.image = image
                }, owner: self.viewId)
            } else {
                self.logger.info("StreamView", "Unsubscribing from frames", context: ["viewId": self.viewId.uuidString.prefix(8)])
                StreamSessionManager.shared.removeFrameCallback(owner: self.viewId)
                self.imageView.image = nil
            }
        }
    }

    /// Called by EMWDATModule Prop("resizeMode")
    func setResizeMode(_ mode: String) {
        switch mode {
        case "cover":
            imageView.contentMode = .scaleAspectFill
        case "stretch":
            imageView.contentMode = .scaleToFill
        default:
            imageView.contentMode = .scaleAspectFit
        }
    }

    // MARK: - Cleanup

    deinit {
        logger.debug("StreamView", "View deinitialized")
    }
}
