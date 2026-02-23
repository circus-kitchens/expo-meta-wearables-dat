package expo.modules.emwdat

import android.content.Context
import android.net.Uri
import com.meta.wearable.dat.mockdevice.MockDeviceKit
import com.meta.wearable.dat.mockdevice.api.MockDeviceKitInterface
import com.meta.wearable.dat.mockdevice.api.MockRaybanMeta

object MockDeviceManager {
    private val logger = EMWDATLogger
    private var devices: MutableMap<String, MockRaybanMeta> = mutableMapOf()
    private var mockDeviceKit: MockDeviceKitInterface? = null

    private fun getKit(context: Context): MockDeviceKitInterface {
        return mockDeviceKit ?: MockDeviceKit.getInstance(context.applicationContext).also {
            mockDeviceKit = it
        }
    }

    fun createMockDevice(context: Context): String {
        val kit = getKit(context)
        val device = kit.pairRaybanMeta()
        val id = device.deviceIdentifier.toString()
        devices[id] = device
        logger.info("MockDeviceManager", "Created mock device", mapOf("id" to id))
        return id
    }

    fun removeMockDevice(context: Context, id: String) {
        val device = devices[id] ?: throw IllegalArgumentException("Mock device not found: $id")
        val kit = getKit(context)
        kit.unpairDevice(device)
        devices.remove(id)
        logger.info("MockDeviceManager", "Removed mock device", mapOf("id" to id))
    }

    fun getMockDevices(): List<String> = devices.keys.toList()

    fun powerOn(id: String) {
        getDevice(id).powerOn()
    }

    fun powerOff(id: String) {
        getDevice(id).powerOff()
    }

    fun don(id: String) {
        getDevice(id).don()
    }

    fun doff(id: String) {
        getDevice(id).doff()
    }

    fun fold(id: String) {
        getDevice(id).fold()
    }

    fun unfold(id: String) {
        getDevice(id).unfold()
    }

    fun setCameraFeed(id: String, fileUrl: String) {
        val device = getDevice(id)
        val uri = parseUri(fileUrl)
        device.getCameraKit().setCameraFeed(uri)
        logger.info("MockDeviceManager", "Set camera feed", mapOf("id" to id, "uri" to uri.toString()))
    }

    fun setCapturedImage(id: String, fileUrl: String) {
        val device = getDevice(id)
        val uri = parseUri(fileUrl)
        device.getCameraKit().setCapturedImage(uri)
        logger.info("MockDeviceManager", "Set captured image", mapOf("id" to id, "uri" to uri.toString()))
    }

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
}
