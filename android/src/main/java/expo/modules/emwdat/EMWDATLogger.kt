package expo.modules.emwdat

import android.util.Log

enum class EMWDATLogLevel(val priority: Int) {
    DEBUG(0),
    INFO(1),
    WARN(2),
    ERROR(3),
    NONE(4);

    companion object {
        fun fromString(level: String): EMWDATLogLevel = when (level) {
            "debug" -> DEBUG
            "info" -> INFO
            "warn" -> WARN
            "error" -> ERROR
            "none" -> NONE
            else -> INFO
        }
    }
}

object EMWDATLogger {
    private const val TAG = "EMWDAT"
    private var currentLevel: EMWDATLogLevel = EMWDATLogLevel.INFO

    fun setLogLevel(level: EMWDATLogLevel) {
        currentLevel = level
    }

    fun debug(component: String, message: String, context: Map<String, Any>? = null) {
        log(EMWDATLogLevel.DEBUG, component, message, context)
    }

    fun info(component: String, message: String, context: Map<String, Any>? = null) {
        log(EMWDATLogLevel.INFO, component, message, context)
    }

    fun warn(component: String, message: String, context: Map<String, Any>? = null) {
        log(EMWDATLogLevel.WARN, component, message, context)
    }

    fun error(component: String, message: String, context: Map<String, Any>? = null) {
        log(EMWDATLogLevel.ERROR, component, message, context)
    }

    fun error(component: String, message: String, error: Throwable, context: Map<String, Any>? = null) {
        val ctx = (context?.toMutableMap() ?: mutableMapOf()).apply {
            put("error", error.toString())
            put("errorType", error.javaClass.simpleName)
        }
        log(EMWDATLogLevel.ERROR, component, message, ctx)
    }

    private fun log(level: EMWDATLogLevel, component: String, message: String, context: Map<String, Any>?) {
        if (level.priority < currentLevel.priority) return

        val prefix = level.name
        var logMessage = "[$TAG] [$prefix] [$component] $message"

        if (!context.isNullOrEmpty()) {
            val contextStr = context.entries.joinToString(", ") { "${it.key}: ${it.value}" }
            logMessage += " - {$contextStr}"
        }

        when (level) {
            EMWDATLogLevel.DEBUG -> Log.d(TAG, logMessage)
            EMWDATLogLevel.INFO -> Log.i(TAG, logMessage)
            EMWDATLogLevel.WARN -> Log.w(TAG, logMessage)
            EMWDATLogLevel.ERROR -> Log.e(TAG, logMessage)
            EMWDATLogLevel.NONE -> {}
        }
    }
}
