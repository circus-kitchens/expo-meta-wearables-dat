package expo.modules.emwdat

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
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
            "onDeviceSessionStateChange",
            "onDeviceSessionError",
            "onCapabilityStateChange"
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

            // Request BLUETOOTH_CONNECT runtime permission on Android 12+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val activity = appContext.currentActivity
                if (activity != null && ContextCompat.checkSelfPermission(
                        activity, Manifest.permission.BLUETOOTH_CONNECT
                    ) != PackageManager.PERMISSION_GRANTED
                ) {
                    ActivityCompat.requestPermissions(
                        activity,
                        arrayOf(Manifest.permission.BLUETOOTH_CONNECT),
                        1001
                    )
                }
            }

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
            runBlocking {
                WearablesManager.requestPermission(
                    activity,
                    com.meta.wearable.dat.core.types.Permission.CAMERA
                )
            }
        }

        // MARK: - Devices

        AsyncFunction("getDevices") {
            WearablesManager.getDevices()
        }

        AsyncFunction("getDevice") { identifier: String ->
            WearablesManager.getDevice(identifier)
        }

        // MARK: - Session Management

        AsyncFunction("createSession") { deviceId: String? ->
            WearablesManager.createSession(deviceId)
        }

        AsyncFunction("startSession") { sessionId: String ->
            WearablesManager.startSession(sessionId)
        }

        AsyncFunction("stopSession") { sessionId: String ->
            WearablesManager.stopSession(sessionId)
        }

        AsyncFunction("addStreamToSession") { sessionId: String, config: Map<String, Any> ->
            StreamSessionManager.addStreamToSession(sessionId, config)
        }

        AsyncFunction("removeStreamFromSession") { sessionId: String ->
            StreamSessionManager.removeStreamFromSession(sessionId)
        }

        // MARK: - Photo Capture

        AsyncFunction("capturePhoto") { format: String ->
            val context = appContext.reactContext?.applicationContext
                ?: throw Exception("Application context not available")
            runBlocking {
                StreamSessionManager.capturePhoto(context, format)
            }
            null
        }

        // MARK: - Mock Device Kit (DEBUG only)

        AsyncFunction("enableMockDeviceKit") { config: Map<String, Any> ->
            if (!isDebug) throw Exception("Mock devices are only available in debug builds")
            val context = appContext.reactContext?.applicationContext
                ?: throw Exception("Application context not available")
            val initiallyRegistered = config["initiallyRegistered"] as? Boolean ?: true
            val initialPermissionsGranted = config["initialPermissionsGranted"] as? Boolean ?: true
            MockDeviceManager.enableMockDeviceKit(context, initiallyRegistered, initialPermissionsGranted)
        }

        AsyncFunction("disableMockDeviceKit") {
            if (!isDebug) throw Exception("Mock devices are only available in debug builds")
            val context = appContext.reactContext?.applicationContext
                ?: throw Exception("Application context not available")
            MockDeviceManager.disableMockDeviceKit(context)
        }

        AsyncFunction("isMockDeviceKitEnabled") {
            if (!isDebug) throw Exception("Mock devices are only available in debug builds")
            val context = appContext.reactContext?.applicationContext
                ?: throw Exception("Application context not available")
            MockDeviceManager.isMockDeviceKitEnabled(context)
        }

        AsyncFunction("pairMockDevice") {
            if (!isDebug) throw Exception("Mock devices are only available in debug builds")
            val context = appContext.reactContext?.applicationContext
                ?: throw Exception("Application context not available")
            MockDeviceManager.pairMockDevice(context)
        }

        AsyncFunction("unpairMockDevice") { deviceId: String ->
            if (!isDebug) throw Exception("Mock devices are only available in debug builds")
            val context = appContext.reactContext?.applicationContext
                ?: throw Exception("Application context not available")
            MockDeviceManager.unpairMockDevice(context, deviceId)
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

        AsyncFunction("mockDeviceSetCameraFeedFromCamera") { id: String, facing: String ->
            if (!isDebug) throw Exception("Mock devices are only available in debug builds")
            MockDeviceManager.setCameraFeedFromCamera(id, facing)
        }

        AsyncFunction("mockSetPermissionStatus") { permission: String, status: String ->
            if (!isDebug) throw Exception("Mock devices are only available in debug builds")
            val context = appContext.reactContext?.applicationContext
                ?: throw Exception("Application context not available")
            MockDeviceManager.setPermissionStatus(context, permission, status)
        }

        AsyncFunction("mockSetPermissionRequestResult") { permission: String, result: String ->
            if (!isDebug) throw Exception("Mock devices are only available in debug builds")
            val context = appContext.reactContext?.applicationContext
                ?: throw Exception("Application context not available")
            MockDeviceManager.setPermissionRequestResult(context, permission, result)
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
