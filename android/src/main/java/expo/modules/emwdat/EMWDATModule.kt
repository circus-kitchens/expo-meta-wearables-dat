package expo.modules.emwdat

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

class EMWDATModule : Module() {
    private val logger = EMWDATLogger
    private val moduleScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val isDebug by lazy {
        try {
            val appContext = appContext.reactContext?.applicationContext ?: return@lazy false
            val appInfo = appContext.applicationInfo
            appInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE != 0
        } catch (e: Exception) {
            false
        }
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
            "onPermissionStatusChange",
            "onCompatibilityChange",
            "onDeviceSessionStateChange"
        )

        OnCreate {
            logger.info("Module", "Module created")
            val emitter: EventEmitter = { name, body ->
                sendEvent(name, body)
            }
            WearablesManager.setEventEmitter(emitter)
            WearablesManager.setScope(moduleScope)
            StreamSessionManager.setEventEmitter(emitter)
            StreamSessionManager.setScope(moduleScope)
        }

        OnDestroy {
            logger.info("Module", "Module destroyed")
            StreamSessionManager.destroy()
            WearablesManager.cleanup()
            moduleScope.cancel()
        }

        // MARK: - Logging

        Function("setLogLevel") { level: String ->
            val logLevel = EMWDATLogLevel.fromString(level)
            EMWDATLogger.setLogLevel(logLevel)
            logger.info("Module", "Log level set", mapOf("level" to level))
        }

        // MARK: - Configuration

        AsyncFunction("configure") {
            val context = appContext.reactContext?.applicationContext
                ?: throw Exception("Application context not available")
            WearablesManager.configure(context)
        }

        // MARK: - Registration

        Function("getRegistrationState") {
            WearablesManager.currentRegistrationState
        }

        AsyncFunction("getRegistrationStateAsync") {
            WearablesManager.currentRegistrationState
        }

        AsyncFunction("startRegistration") {
            val activity = appContext.currentActivity
                ?: throw Exception("Current activity not available")
            WearablesManager.startRegistration(activity)
        }

        AsyncFunction("startUnregistration") {
            val activity = appContext.currentActivity
                ?: throw Exception("Current activity not available")
            WearablesManager.startUnregistration(activity)
        }

        // MARK: - URL Handling (no-op on Android — deep links handled via intent-filter)

        AsyncFunction("handleUrl") { _: String ->
            false
        }

        // MARK: - Permissions

        AsyncFunction("checkPermissionStatus") { permission: String ->
            if (permission != "camera") return@AsyncFunction "denied"
            runBlocking {
                WearablesManager.checkPermissionStatus(
                    com.meta.wearable.dat.core.types.Permission.CAMERA
                )
            }
        }

        AsyncFunction("requestPermission") { permission: String ->
            if (permission != "camera") throw Exception("Unknown permission: $permission")
            val activity = appContext.currentActivity
                ?: throw Exception("Current activity not available")
            // Launch permission request and return current status
            // The actual result comes back via the onPermissionStatusChange event
            var resultStatus = "denied"
            WearablesManager.requestPermission(
                activity,
                com.meta.wearable.dat.core.types.Permission.CAMERA
            ) { status -> resultStatus = status }
            resultStatus
        }

        // MARK: - Devices

        AsyncFunction("getDevices") {
            WearablesManager.getDevices()
        }

        AsyncFunction("getDevice") { identifier: String ->
            WearablesManager.getDevice(identifier)
        }

        // MARK: - Streaming

        AsyncFunction("getStreamState") {
            StreamSessionManager.currentState
        }

        AsyncFunction("startStream") { config: Map<String, Any> ->
            val context = appContext.reactContext?.applicationContext
                ?: throw Exception("Application context not available")
            val deviceId = config["deviceId"] as? String
            StreamSessionManager.startStream(context, config, deviceId)
        }

        AsyncFunction("stopStream") {
            StreamSessionManager.stopStream()
        }

        // MARK: - Photo Capture

        AsyncFunction("capturePhoto") { _: String ->
            val context = appContext.reactContext?.applicationContext
                ?: throw Exception("Application context not available")
            runBlocking {
                StreamSessionManager.capturePhoto(context)
                    ?: throw Exception("Failed to capture photo - stream may not be active")
            }
        }

        // MARK: - Mock Device (DEBUG only)

        AsyncFunction("createMockDevice") {
            if (!isDebug) throw Exception("Mock devices are only available in debug builds")
            val context = appContext.reactContext?.applicationContext
                ?: throw Exception("Application context not available")
            MockDeviceManager.createMockDevice(context)
        }

        AsyncFunction("removeMockDevice") { id: String ->
            if (!isDebug) throw Exception("Mock devices are only available in debug builds")
            val context = appContext.reactContext?.applicationContext
                ?: throw Exception("Application context not available")
            MockDeviceManager.removeMockDevice(context, id)
        }

        AsyncFunction("getMockDevices") {
            if (!isDebug) throw Exception("Mock devices are only available in debug builds")
            MockDeviceManager.getMockDevices()
        }

        AsyncFunction("mockDevicePowerOn") { id: String ->
            if (!isDebug) throw Exception("Mock devices are only available in debug builds")
            MockDeviceManager.powerOn(id)
        }

        AsyncFunction("mockDevicePowerOff") { id: String ->
            if (!isDebug) throw Exception("Mock devices are only available in debug builds")
            MockDeviceManager.powerOff(id)
        }

        AsyncFunction("mockDeviceDon") { id: String ->
            if (!isDebug) throw Exception("Mock devices are only available in debug builds")
            MockDeviceManager.don(id)
        }

        AsyncFunction("mockDeviceDoff") { id: String ->
            if (!isDebug) throw Exception("Mock devices are only available in debug builds")
            MockDeviceManager.doff(id)
        }

        AsyncFunction("mockDeviceFold") { id: String ->
            if (!isDebug) throw Exception("Mock devices are only available in debug builds")
            MockDeviceManager.fold(id)
        }

        AsyncFunction("mockDeviceUnfold") { id: String ->
            if (!isDebug) throw Exception("Mock devices are only available in debug builds")
            MockDeviceManager.unfold(id)
        }

        AsyncFunction("mockDeviceSetCameraFeed") { id: String, fileUrl: String ->
            if (!isDebug) throw Exception("Mock devices are only available in debug builds")
            MockDeviceManager.setCameraFeed(id, fileUrl)
        }

        AsyncFunction("mockDeviceSetCapturedImage") { id: String, fileUrl: String ->
            if (!isDebug) throw Exception("Mock devices are only available in debug builds")
            MockDeviceManager.setCapturedImage(id, fileUrl)
        }

        // MARK: - View

        View(EMWDATView::class) {
            Prop("isActive") { view: EMWDATView, isActive: Boolean ->
                view.setActive(isActive)
            }

            Prop("resizeMode") { view: EMWDATView, resizeMode: String ->
                view.setResizeMode(resizeMode)
            }
        }
    }
}
