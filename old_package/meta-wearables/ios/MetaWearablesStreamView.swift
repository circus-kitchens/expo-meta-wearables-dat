import ExpoModulesCore
import UIKit

/// Native view for rendering video stream frames from Meta Wearables
public class MetaWearablesStreamView: ExpoView {
    private let logger = MetaWearablesLogger.shared
    private let imageView = UIImageView()

    // MARK: - Props

    var isActive: Bool = false {
        didSet {
            handleActiveChange()
        }
    }

    var resizeMode: String = "contain" {
        didSet {
            switch resizeMode {
            case "cover":
                imageView.contentMode = .scaleAspectFill
            case "stretch":
                imageView.contentMode = .scaleToFill
            default:
                imageView.contentMode = .scaleAspectFit
            }
        }
    }

    // MARK: - Initialization

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        setupView()
    }

    private func setupView() {
        // Configure image view
        imageView.contentMode = .scaleAspectFit
        imageView.backgroundColor = .black
        imageView.clipsToBounds = true
        imageView.translatesAutoresizingMaskIntoConstraints = false

        addSubview(imageView)

        // Pin to edges
        NSLayoutConstraint.activate([
            imageView.topAnchor.constraint(equalTo: topAnchor),
            imageView.bottomAnchor.constraint(equalTo: bottomAnchor),
            imageView.leadingAnchor.constraint(equalTo: leadingAnchor),
            imageView.trailingAnchor.constraint(equalTo: trailingAnchor)
        ])

        logger.debug("StreamView", "View initialized")
    }

    // MARK: - Frame Handling

    private func handleActiveChange() {
        let shouldActivate = isActive
        Task { @MainActor in
            if shouldActivate {
                self.logger.info("StreamView", "View became active, subscribing to frames")
                StreamSessionManager.shared.setFrameCallback { [weak self] image in
                    self?.updateFrame(image)
                }
            } else {
                self.logger.info("StreamView", "View became inactive")
                StreamSessionManager.shared.setFrameCallback { _ in }
                self.imageView.image = nil
            }
        }
    }

    private func updateFrame(_ image: UIImage) {
        // Already on main thread from StreamSessionManager
        imageView.image = image
    }

    // MARK: - Cleanup

    deinit {
        // Note: Can't call @MainActor methods from deinit
        // Frame callback will be replaced when a new view is created
        logger.debug("StreamView", "View deinitialized")
    }
}

// MARK: - View Module

public class MetaWearablesStreamViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("MetaWearablesStreamView")

        View(MetaWearablesStreamView.self) {
            Prop("isActive") { (view: MetaWearablesStreamView, value: Bool) in
                view.isActive = value
            }

            Prop("resizeMode") { (view: MetaWearablesStreamView, value: String) in
                view.resizeMode = value
            }
        }
    }
}
