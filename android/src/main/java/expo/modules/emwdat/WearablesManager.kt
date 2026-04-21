package expo.modules.emwdat

import android.app.Activity
import android.content.Context
import com.meta.wearable.dat.core.Wearables
import com.meta.wearable.dat.core.session.DeviceSessionState
import com.meta.wearable.dat.core.session.Session
import com.meta.wearable.dat.core.session.SessionError
import com.meta.wearable.dat.core.selectors.AutoDeviceSelector
import com.meta.wearable.dat.core.selectors.SpecificDeviceSelector
import com.meta.wearable.dat.core.types.DeviceCompatibility
import com.meta.wearable.dat.core.types.DeviceIdentifier
import com.meta.wearable.dat.core.types.DeviceType
import com.meta.wearable.dat.core.types.LinkState
import com.meta.wearable.dat.core.types.Permission
import com.meta.wearable.dat.core.types.PermissionStatus
import com.meta.wearable.dat.core.types.RegistrationState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import java.util.UUID

typealias EventEmitter = (String, Map<String, Any>) -> Unit

object WearablesManager {
    private val logger = EMWDATLogger

    var isConfigured = false
        private set

    private var eventEmitter: EventEmitter? = null
    private var scope: CoroutineScope? = null

    // Flow collection jobs
    private var registrationJob: Job? = null
    private var devicesJob: Job? = null
    private var deviceMetadataJobs: MutableMap<DeviceIdentifier, Job> = mutableMapOf()

    // Device sessions
    private val sessions: MutableMap<String, Session> = mutableMapOf()
    private val sessionStateJobs: MutableMap<String, Job> = mutableMapOf()
    private val sessionErrorJobs: MutableMap<String, Job> = mutableMapOf()

    // Cached state
    var currentRegistrationState: String = "unavailable"
        private set
    private var currentDevices: Set<DeviceIdentifier> = emptySet()
    private var deviceNames: MutableMap<DeviceIdentifier, String> = mutableMapOf()
    private var deviceCompatibilities: MutableMap<DeviceIdentifier, DeviceCompatibility> = mutableMapOf()
    private var deviceLinkStates: MutableMap<DeviceIdentifier, LinkState> = mutableMapOf()
    private var deviceTypes: MutableMap<DeviceIdentifier, DeviceType> = mutableMapOf()

    fun setEventEmitter(emitter: EventEmitter) {
        logger.debug("Manager", "Event emitter set")
        this.eventEmitter = emitter
    }

    fun setScope(scope: CoroutineScope) {
        this.scope = scope
    }

    fun configure(context: Context) {
        if (isConfigured) {
            logger.info("Manager", "SDK already configured, skipping")
            return
        }

        logger.info("Manager", "Configuring SDK")
        Wearables.initialize(context)
        isConfigured = true

        setupListeners()
        logger.info("Manager", "SDK configured and listeners attached")
    }

    private fun setupListeners() {
        val scope = this.scope ?: return

        registrationJob = scope.launch {
            Wearables.registrationState.collect { state ->
                handleRegistrationStateChange(state)
            }
        }

        devicesJob = scope.launch {
            Wearables.devices.collect { devices ->
                handleDevicesChange(devices)
            }
        }

        logger.debug("Manager", "Listeners attached")
    }

    private fun handleRegistrationStateChange(state: RegistrationState) {
        val mapped = mapRegistrationState(state)
        logger.info("Manager", "Registration state changed", mapOf(
            "from" to currentRegistrationState,
            "to" to mapped
        ))

        currentRegistrationState = mapped
        emitEvent("onRegistrationStateChange", mapOf("state" to mapped))
    }

    private fun handleDevicesChange(devices: Set<DeviceIdentifier>) {
        logger.info("Manager", "Devices changed", mapOf("count" to devices.size))

        val previousDevices = currentDevices
        val addedDevices = devices - previousDevices
        val removedDevices = previousDevices - devices

        // Remove metadata jobs for removed devices
        for (deviceId in removedDevices) {
            deviceMetadataJobs[deviceId]?.cancel()
            deviceMetadataJobs.remove(deviceId)
            deviceNames.remove(deviceId)
            deviceCompatibilities.remove(deviceId)
            deviceLinkStates.remove(deviceId)
            deviceTypes.remove(deviceId)
            logger.debug("Manager", "Removed device listeners", mapOf("deviceId" to deviceId.toString()))
        }

        // Add metadata listeners for new devices
        val currentScope = this.scope ?: return
        for (deviceId in addedDevices) {
            val metadataFlow = Wearables.devicesMetadata[deviceId]
            if (metadataFlow != null) {
                deviceMetadataJobs[deviceId] = currentScope.launch {
                    metadataFlow.collect { metadata ->
                        deviceNames[deviceId] = metadata.name
                        deviceCompatibilities[deviceId] = metadata.compatibility

                        // Track link state
                        val previousLinkState = deviceLinkStates[deviceId]
                        deviceLinkStates[deviceId] = metadata.linkState
                        if (previousLinkState != null && previousLinkState != metadata.linkState) {
                            emitEvent("onLinkStateChange", mapOf(
                                "deviceId" to deviceId.toString(),
                                "linkState" to mapLinkState(metadata.linkState)
                            ))
                        }

                        // Track device type
                        deviceTypes[deviceId] = metadata.deviceType

                        emitEvent("onCompatibilityChange", mapOf(
                            "deviceId" to deviceId.toString(),
                            "compatibility" to mapCompatibility(metadata.compatibility)
                        ))

                        // Re-emit full device list
                        emitDeviceList()
                    }
                }
            }

            logger.debug("Manager", "Added device listeners", mapOf("deviceId" to deviceId.toString()))
        }

        currentDevices = devices
        emitDeviceList()
    }

    private fun emitDeviceList() {
        emitEvent("onDevicesChange", mapOf(
            "devices" to currentDevices.map { id -> serializeDevice(id) }
        ))
    }

    // MARK: - Session Management

    fun createSession(deviceId: String?): String {
        if (!isConfigured) {
            throw IllegalStateException("Wearables SDK has not been configured. Call configure() first.")
        }

        val deviceSelector = if (deviceId != null) {
            logger.info("Manager", "Creating session for device", mapOf("deviceId" to deviceId))
            SpecificDeviceSelector(DeviceIdentifier(deviceId))
        } else {
            logger.info("Manager", "Creating session with auto device selector")
            AutoDeviceSelector()
        }

        val session = Wearables.createSession(deviceSelector)
        val sessionId = UUID.randomUUID().toString()
        sessions[sessionId] = session

        // Collect session state
        val currentScope = this.scope ?: throw IllegalStateException("Module scope not available")
        sessionStateJobs[sessionId] = currentScope.launch {
            session.state.collect { state ->
                handleSessionStateChange(sessionId, state)
            }
        }

        // Collect session errors
        sessionErrorJobs[sessionId] = currentScope.launch {
            session.errors.collect { error ->
                handleSessionError(sessionId, error)
            }
        }

        logger.info("Manager", "Session created", mapOf("sessionId" to sessionId))
        return sessionId
    }

    fun startSession(sessionId: String) {
        val session = sessions[sessionId]
            ?: throw IllegalArgumentException("Session not found: $sessionId")
        logger.info("Manager", "Starting session", mapOf("sessionId" to sessionId))
        session.start()
    }

    fun stopSession(sessionId: String) {
        val session = sessions[sessionId]
            ?: throw IllegalArgumentException("Session not found: $sessionId")
        logger.info("Manager", "Stopping session", mapOf("sessionId" to sessionId))
        session.stop()
    }

    fun getSession(sessionId: String): Session? = sessions[sessionId]

    fun removeSession(sessionId: String) {
        sessionStateJobs[sessionId]?.cancel()
        sessionStateJobs.remove(sessionId)
        sessionErrorJobs[sessionId]?.cancel()
        sessionErrorJobs.remove(sessionId)
        sessions.remove(sessionId)
        logger.info("Manager", "Session removed", mapOf("sessionId" to sessionId))
    }

    private fun handleSessionStateChange(sessionId: String, state: DeviceSessionState) {
        val mapped = mapDeviceSessionState(state)
        logger.info("Manager", "Session state changed", mapOf(
            "sessionId" to sessionId,
            "state" to mapped
        ))

        emitEvent("onDeviceSessionStateChange", mapOf(
            "sessionId" to sessionId,
            "state" to mapped
        ))

        // Auto-clean stopped sessions
        if (state == DeviceSessionState.STOPPED) {
            removeSession(sessionId)
        }
    }

    private fun handleSessionError(sessionId: String, error: SessionError) {
        val mapped = mapSessionError(error)
        logger.error("Manager", "Session error", mapOf(
            "sessionId" to sessionId,
            "error" to mapped
        ))

        emitEvent("onDeviceSessionError", mapOf(
            "sessionId" to sessionId,
            "error" to mapped,
            "message" to error.toString()
        ))
    }

    // MARK: - Registration

    fun startRegistration(activity: Activity) {
        if (!isConfigured) {
            throw IllegalStateException("Wearables SDK has not been configured. Call configure() first.")
        }
        logger.info("Manager", "Starting registration")
        Wearables.startRegistration(activity)
    }

    fun startUnregistration(activity: Activity) {
        if (!isConfigured) {
            throw IllegalStateException("Wearables SDK has not been configured. Call configure() first.")
        }
        logger.info("Manager", "Starting unregistration")
        Wearables.startUnregistration(activity)
    }

    // MARK: - Permissions

    suspend fun checkPermissionStatus(permission: Permission): String {
        logger.debug("Manager", "Checking permission status", mapOf("permission" to permission.toString()))
        val result = Wearables.checkPermissionStatus(permission)
        val status = result.getOrNull()
        val mapped = if (status != null) mapPermissionStatus(status) else "denied"
        logger.debug("Manager", "Permission status result", mapOf(
            "permission" to permission.toString(),
            "status" to mapped,
            "rawResult" to result.toString()
        ))
        return mapped
    }

    suspend fun requestPermission(activity: Activity, permission: Permission): String {
        if (!isConfigured) {
            throw IllegalStateException("Wearables SDK has not been configured. Call configure() first.")
        }
        logger.info("Manager", "Requesting permission", mapOf("permission" to permission.toString()))

        val permName = if (permission == Permission.CAMERA) "camera" else "unknown"

        // Return early if already granted
        val currentStatus = checkPermissionStatus(permission)
        if (currentStatus == "granted") {
            logger.info("Manager", "Permission already granted, skipping request")
            emitEvent("onPermissionStatusChange", mapOf(
                "permission" to permName,
                "status" to currentStatus
            ))
            return currentStatus
        }

        val contract = Wearables.RequestPermissionContract()
        val intent = contract.createIntent(activity, permission)
        activity.startActivity(intent)

        // Poll for permission status change (500ms intervals, 30s total)
        repeat(60) {
            kotlinx.coroutines.delay(500)
            val status = checkPermissionStatus(permission)
            if (status == "granted") {
                emitEvent("onPermissionStatusChange", mapOf(
                    "permission" to permName,
                    "status" to status
                ))
                return status
            }
        }

        val finalStatus = checkPermissionStatus(permission)
        emitEvent("onPermissionStatusChange", mapOf(
            "permission" to permName,
            "status" to finalStatus
        ))
        return finalStatus
    }

    // MARK: - Devices

    fun getDevices(): List<Map<String, Any>> {
        return currentDevices.map { id -> serializeDevice(id) }
    }

    fun getDevice(identifier: String): Map<String, Any>? {
        val deviceId = currentDevices.find { it.toString() == identifier } ?: return null
        return serializeDevice(deviceId)
    }

    // MARK: - Serialization

    private fun serializeDevice(id: DeviceIdentifier): Map<String, Any> {
        return mapOf(
            "identifier" to id.toString(),
            "name" to (deviceNames[id] ?: "Unknown"),
            "linkState" to mapLinkState(deviceLinkStates[id] ?: LinkState.DISCONNECTED),
            "deviceType" to mapDeviceType(deviceTypes[id]),
            "compatibility" to mapCompatibility(deviceCompatibilities[id] ?: DeviceCompatibility.UNDEFINED)
        )
    }

    // MARK: - Mapping Helpers

    private fun mapLinkState(state: LinkState): String = when (state) {
        LinkState.CONNECTED -> "connected"
        LinkState.CONNECTING -> "connecting"
        LinkState.DISCONNECTED -> "disconnected"
    }

    private fun mapRegistrationState(state: RegistrationState): String = when (state) {
        is RegistrationState.Unavailable -> "unavailable"
        is RegistrationState.Available -> "available"
        is RegistrationState.Registering -> "registering"
        is RegistrationState.Registered -> "registered"
        is RegistrationState.Unregistering -> "unavailable"
        else -> "unavailable"
    }

    private fun mapPermissionStatus(status: PermissionStatus): String = when (status) {
        is PermissionStatus.Granted -> "granted"
        is PermissionStatus.Denied -> "denied"
        else -> "denied"
    }

    private fun mapCompatibility(compat: DeviceCompatibility): String = when (compat) {
        DeviceCompatibility.COMPATIBLE -> "compatible"
        DeviceCompatibility.UNDEFINED -> "undefined"
        DeviceCompatibility.DEVICE_UPDATE_REQUIRED -> "deviceUpdateRequired"
        DeviceCompatibility.SDK_UPDATE_REQUIRED -> "sdkUpdateRequired"
    }

    private fun mapDeviceType(type: DeviceType?): String = when (type) {
        DeviceType.RAYBAN_META -> "rayBanMeta"
        DeviceType.OAKLEY_META_HSTN -> "oakleyMetaHSTN"
        DeviceType.OAKLEY_META_VANGUARD -> "oakleyMetaVanguard"
        DeviceType.META_RAYBAN_DISPLAY -> "metaRayBanDisplay"
        DeviceType.RAYBAN_META_OPTICS -> "rayBanMetaOptics"
        DeviceType.UNKNOWN -> "unknown"
        null -> "unknown"
        else -> "unknown"
    }

    private fun mapDeviceSessionState(state: DeviceSessionState): String = when (state) {
        DeviceSessionState.IDLE -> "idle"
        DeviceSessionState.STARTING -> "starting"
        DeviceSessionState.STARTED -> "started"
        DeviceSessionState.PAUSED -> "paused"
        DeviceSessionState.STOPPING -> "stopping"
        DeviceSessionState.STOPPED -> "stopped"
    }

    private fun mapSessionError(error: SessionError): String = when (error) {
        SessionError.DEVICE_DISCONNECTED -> "noEligibleDevice"
        SessionError.DEVICE_POWERED_OFF -> "noEligibleDevice"
        else -> "unexpectedError"
    }

    // MARK: - Event Emission

    private fun emitEvent(name: String, body: Map<String, Any>) {
        logger.debug("Manager", "Emitting event", mapOf("event" to name))
        eventEmitter?.invoke(name, body)
    }

    // MARK: - Cleanup

    fun cleanup() {
        logger.info("Manager", "Cleaning up listeners")
        registrationJob?.cancel()
        devicesJob?.cancel()
        deviceMetadataJobs.values.forEach { it.cancel() }
        deviceMetadataJobs.clear()
        sessionStateJobs.values.forEach { it.cancel() }
        sessionStateJobs.clear()
        sessionErrorJobs.values.forEach { it.cancel() }
        sessionErrorJobs.clear()
        sessions.clear()
        deviceNames.clear()
        deviceCompatibilities.clear()
        deviceLinkStates.clear()
        deviceTypes.clear()
        currentDevices = emptySet()
        currentRegistrationState = "unavailable"
        isConfigured = false
    }
}
