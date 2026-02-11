package expo.modules.emwdat

import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class EMWDATModule : Module() {
    private fun platformNotSupported(): Nothing {
        throw CodedException("PLATFORM_NOT_SUPPORTED", "EMWDAT is not supported on Android", null)
    }

    override fun definition() = ModuleDefinition {
        Name("EMWDAT")

        Events(
            "onRegistrationStateChange",
            "onDevicesChange",
            "onLinkStateChange",
            "onStreamStateChange",
            "onVideoFrame",
            "onPhotoCaptured",
            "onStreamError",
            "onPermissionStatusChange"
        )

        // MARK: - Logging

        Function("setLogLevel") { _: String ->
            platformNotSupported()
        }

        // MARK: - Configuration

        AsyncFunction("configure") {
            platformNotSupported()
        }

        // MARK: - Registration

        Function("getRegistrationState") {
            platformNotSupported()
        }

        AsyncFunction("getRegistrationStateAsync") {
            platformNotSupported()
        }

        AsyncFunction("startRegistration") {
            platformNotSupported()
        }

        AsyncFunction("startUnregistration") {
            platformNotSupported()
        }

        // MARK: - URL Handling

        Function("handleUrl") { _: String ->
            platformNotSupported()
        }

        // MARK: - Permissions

        AsyncFunction("checkPermissionStatus") { _: String ->
            platformNotSupported()
        }

        AsyncFunction("requestPermission") { _: String ->
            platformNotSupported()
        }

        // MARK: - Devices

        AsyncFunction("getDevices") {
            platformNotSupported()
        }

        AsyncFunction("getDevice") { _: String ->
            platformNotSupported()
        }

        // MARK: - Streaming

        AsyncFunction("getStreamState") {
            platformNotSupported()
        }

        AsyncFunction("startStream") { _: Map<String, Any> ->
            platformNotSupported()
        }

        AsyncFunction("stopStream") {
            platformNotSupported()
        }

        // MARK: - Photo Capture

        AsyncFunction("capturePhoto") { _: String ->
            platformNotSupported()
        }

        // MARK: - View

        View(EMWDATView::class) {
            Prop("isActive") { _: EMWDATView, _: Boolean -> }
            Prop("resizeMode") { _: EMWDATView, _: String -> }
        }
    }
}
