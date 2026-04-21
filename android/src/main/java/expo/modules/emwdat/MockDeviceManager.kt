package expo.modules.emwdat

import android.content.Context
import android.net.Uri
import com.meta.wearable.dat.core.types.Permission
import com.meta.wearable.dat.core.types.PermissionStatus
import com.meta.wearable.dat.mockdevice.MockDeviceKit
import com.meta.wearable.dat.mockdevice.api.MockDeviceKitConfig
import com.meta.wearable.dat.mockdevice.api.MockDeviceKitInterface
import com.meta.wearable.dat.mockdevice.api.MockRaybanMeta
import com.meta.wearable.dat.mockdevice.api.camera.CameraFacing

object MockDeviceManager {
    private val logger = EMWDATLogger
    private var devices: MutableMap<String, MockRaybanMeta> = mutableMapOf()
    private var mockDeviceKit: MockDeviceKitInterface? = null

    private fun getKit(context: Context): MockDeviceKitInterface {
        return mockDeviceKit ?: MockDeviceKit.getInstance(context.applicationContext).also {
            mockDeviceKit = it
        }
    }

    // MARK: - Kit Lifecycle

    fun enableMockDeviceKit(context: Context, initiallyRegistered: Boolean, initialPermissionsGranted: Boolean) {
        val kit = getKit(context)
        val config = MockDeviceKitConfig(
            initiallyRegistered = initiallyRegistered,
            initialPermissionsGranted = initialPermissionsGranted
        )
        kit.enable(config)
        logger.info("MockDeviceManager", "MockDeviceKit enabled", mapOf(
            "initiallyRegistered" to initiallyRegistered,
            "initialPermissionsGranted" to initialPermissionsGranted
        ))
    }

    fun disableMockDeviceKit(context: Context) {
        val kit = getKit(context)
        kit.disable()
        devices.clear()
        logger.info("MockDeviceManager", "MockDeviceKit disabled")
    }

    fun isMockDeviceKitEnabled(context: Context): Boolean {
        val kit = getKit(context)
        return kit.isEnabled
    }

    // MARK: - Pair / Unpair

    fun pairMockDevice(context: Context): String {
        val kit = getKit(context)
        val device = kit.pairRaybanMeta()
        val id = device.deviceIdentifier.toString()
        devices[id] = device
        logger.info("MockDeviceManager", "Paired mock device", mapOf("id" to id))
        return id
    }

    fun unpairMockDevice(context: Context, id: String) {
        val device = devices[id] ?: throw IllegalArgumentException("Mock device not found: $id")
        val kit = getKit(context)
        kit.unpairDevice(device)
        devices.remove(id)
        logger.info("MockDeviceManager", "Unpaired mock device", mapOf("id" to id))
    }

    fun getMockDevices(): List<String> = devices.keys.toList()

    // MARK: - Power

    fun powerOn(id: String) {
        getDevice(id).powerOn()
    }

    fun powerOff(id: String) {
        getDevice(id).powerOff()
    }

    // MARK: - Don / Doff

    fun don(id: String) {
        getDevice(id).don()
    }

    fun doff(id: String) {
        getDevice(id).doff()
    }

    // MARK: - Fold / Unfold

    fun fold(id: String) {
        getDevice(id).fold()
    }

    fun unfold(id: String) {
        getDevice(id).unfold()
    }

    // MARK: - Camera (file-based)

    fun setCameraFeed(id: String, fileUrl: String) {
        val device = getDevice(id)
        val uri = parseUri(fileUrl)
        device.services.cameraKit.setCameraFeed(uri)
        logger.info("MockDeviceManager", "Set camera feed", mapOf("id" to id, "uri" to uri.toString()))
    }

    fun setCapturedImage(id: String, fileUrl: String) {
        val device = getDevice(id)
        val uri = parseUri(fileUrl)
        device.services.cameraKit.setCapturedImage(uri)
        logger.info("MockDeviceManager", "Set captured image", mapOf("id" to id, "uri" to uri.toString()))
    }

    // MARK: - Camera (phone camera — new in SDK 0.6)

    fun setCameraFeedFromCamera(id: String, facing: String) {
        val device = getDevice(id)
        val cameraFacing = if (facing == "back") CameraFacing.BACK else CameraFacing.FRONT
        device.services.cameraKit.setCameraFeed(cameraFacing)
        logger.info("MockDeviceManager", "Set camera feed from camera", mapOf("id" to id, "facing" to facing))
    }

    // MARK: - Permissions

    fun setPermissionStatus(context: Context, permission: String, status: String) {
        val kit = getKit(context)
        val perm = mapPermission(permission) ?: return
        val stat = mapPermissionStatus(status) ?: return
        kit.permissions.set(perm, stat)
        logger.info("MockDeviceManager", "Set permission status", mapOf(
            "permission" to permission,
            "status" to status
        ))
    }

    fun setPermissionRequestResult(context: Context, permission: String, result: String) {
        val kit = getKit(context)
        val perm = mapPermission(permission) ?: return
        val stat = mapPermissionStatus(result) ?: return
        kit.permissions.setRequestResult(perm, stat)
        logger.info("MockDeviceManager", "Set permission request result", mapOf(
            "permission" to permission,
            "result" to result
        ))
    }

    // MARK: - Helpers

    private fun getDevice(id: String): MockRaybanMeta {
        return devices[id] ?: throw IllegalArgumentException("Mock device not found: $id")
    }

    private fun parseUri(fileUrl: String): Uri {
        return if (fileUrl.startsWith("file://")) {
            Uri.parse(fileUrl)
        } else {
            Uri.parse("file://$fileUrl")
        }
    }

    private fun mapPermission(permission: String): Permission? = when (permission) {
        "camera" -> Permission.CAMERA
        else -> null
    }

    private fun mapPermissionStatus(status: String): PermissionStatus? = when (status) {
        "granted" -> PermissionStatus.Granted
        "denied" -> PermissionStatus.Denied
        else -> null
    }
}
