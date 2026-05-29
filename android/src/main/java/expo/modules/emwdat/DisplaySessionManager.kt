package expo.modules.emwdat

import com.meta.wearable.dat.display.Display
import com.meta.wearable.dat.display.DisplayConfiguration
import com.meta.wearable.dat.display.types.DisplayError
import com.meta.wearable.dat.display.types.DisplayState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

object DisplaySessionManager {
    private val logger = EMWDATLogger

    private val displays: MutableMap<String, Display> = mutableMapOf()
    private val stateJobs: MutableMap<String, Job> = mutableMapOf()

    private var scope: CoroutineScope? = null
    private var eventEmitter: EventEmitter? = null

    fun setEventEmitter(emitter: EventEmitter) {
        eventEmitter = emitter
    }

    fun setScope(s: CoroutineScope) {
        scope = s
    }

    fun addDisplayToSession(sessionId: String) {
        val session = WearablesManager.getSession(sessionId)
            ?: throw IllegalArgumentException("Session not found: $sessionId")

        var display: Display? = null
        session.addDisplay(DisplayConfiguration()).fold(
            onSuccess = { d -> display = d },
            onFailure = { error -> throw Exception("Failed to add display: $error") }
        )
        val activeDisplay = display ?: throw Exception("Failed to add display to session")
        displays[sessionId] = activeDisplay

        val currentScope = scope ?: throw IllegalStateException("Module scope not available")
        stateJobs[sessionId] = currentScope.launch {
            activeDisplay.state.collect { state ->
                handleStateChange(sessionId, state)
            }
        }

        logger.info("Display", "Display added to session", mapOf("sessionId" to sessionId))
    }

    fun removeDisplayFromSession(sessionId: String) {
        WearablesManager.getSession(sessionId)?.removeDisplay()
        destroyDisplay(sessionId)
        emitEvent("onDisplayStateChange", mapOf("sessionId" to sessionId, "state" to "stopped"))
        logger.info("Display", "Display removed from session", mapOf("sessionId" to sessionId))
    }

    suspend fun sendDisplayContent(sessionId: String, contentTree: Map<String, Any>) {
        val display = displays[sessionId]
            ?: throw IllegalArgumentException("No active display for session: $sessionId")

        val result = display.sendContent {
            DisplayContentBuilder.build(this, contentTree) { interactionId ->
                emitEvent(
                    "onDisplayInteraction",
                    mapOf("sessionId" to sessionId, "interactionId" to interactionId)
                )
            }
        }

        result.fold(
            onSuccess = { /* sent */ },
            onFailure = { error ->
                val errorCode = mapDisplayError(error)
                emitEvent("onDisplayError", mapOf("sessionId" to sessionId, "error" to errorCode))
                throw Exception("sendDisplayContent failed: $error")
            }
        )
    }

    private fun handleStateChange(sessionId: String, state: DisplayState) {
        val mapped = mapDisplayState(state)
        logger.info("Display", "State changed", mapOf("sessionId" to sessionId, "state" to mapped))
        emitEvent("onDisplayStateChange", mapOf("sessionId" to sessionId, "state" to mapped))

        if (state == DisplayState.CLOSED || state == DisplayState.STOPPED) {
            destroyDisplay(sessionId)
        }
    }

    private fun destroyDisplay(sessionId: String) {
        stateJobs[sessionId]?.cancel()
        stateJobs.remove(sessionId)
        displays.remove(sessionId)
    }

    fun destroy() {
        for (sessionId in displays.keys.toList()) {
            destroyDisplay(sessionId)
        }
    }

    private fun mapDisplayState(state: DisplayState): String = when (state) {
        DisplayState.STOPPED -> "stopped"
        DisplayState.STARTING -> "starting"
        DisplayState.STARTED -> "started"
        DisplayState.STOPPING -> "stopping"
        DisplayState.CLOSED -> "stopped"
        else -> "stopped"
    }

    private fun mapDisplayError(error: DisplayError): String = when (error) {
        DisplayError.CAPABILITY_DENIED -> "capabilityDenied"
        DisplayError.DEVICE_DISCONNECTED -> "deviceDisconnected"
        DisplayError.INVALID_SESSION_STATE -> "invalidSessionState"
        DisplayError.RENDERING_FAILED -> "renderingFailed"
        else -> "unexpectedError"
    }

    private fun emitEvent(name: String, body: Map<String, Any>) {
        eventEmitter?.invoke(name, body)
    }
}
