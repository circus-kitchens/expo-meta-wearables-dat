package expo.modules.emwdat

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import android.graphics.Rect
import android.graphics.YuvImage
import androidx.exifinterface.media.ExifInterface
import com.meta.wearable.dat.camera.Stream
import com.meta.wearable.dat.camera.types.CaptureError
import com.meta.wearable.dat.camera.types.PhotoData
import com.meta.wearable.dat.camera.types.StreamConfiguration
import com.meta.wearable.dat.camera.types.StreamSessionState
import com.meta.wearable.dat.camera.types.VideoFrame
import com.meta.wearable.dat.camera.types.VideoQuality
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File

typealias FrameCallback = (Bitmap) -> Unit

object StreamSessionManager {
    private val logger = EMWDATLogger

    // Active streams keyed by sessionId
    private val streams: MutableMap<String, Stream> = mutableMapOf()
    private val videoJobs: MutableMap<String, Job> = mutableMapOf()
    private val stateJobs: MutableMap<String, Job> = mutableMapOf()
    private val errorJobs: MutableMap<String, Job> = mutableMapOf()

    private var scope: CoroutineScope? = null

    // Callbacks
    private var eventEmitter: EventEmitter? = null
    private var frameCallback: FrameCallback? = null
    private var frameCallbackOwner: Any? = null

    fun setEventEmitter(emitter: EventEmitter) {
        this.eventEmitter = emitter
    }

    fun setScope(scope: CoroutineScope) {
        this.scope = scope
    }

    fun setFrameCallback(callback: FrameCallback, owner: Any) {
        this.frameCallback = callback
        this.frameCallbackOwner = owner
    }

    fun removeFrameCallback(owner: Any) {
        if (frameCallbackOwner !== owner) return
        this.frameCallback = null
        this.frameCallbackOwner = null
    }

    // MARK: - Stream Capability Control

    fun addStreamToSession(sessionId: String, config: Map<String, Any>) {
        val session = WearablesManager.getSession(sessionId)
            ?: throw IllegalArgumentException("Session not found: $sessionId")

        val videoQuality = when (config["resolution"] as? String) {
            "high" -> VideoQuality.HIGH
            "medium" -> VideoQuality.MEDIUM
            else -> VideoQuality.LOW
        }
        val frameRate = (config["frameRate"] as? Number)?.toInt() ?: 15
        val compressVideo = config["compressVideo"] as? Boolean ?: false

        val streamConfig = StreamConfiguration(videoQuality, frameRate, compressVideo)

        logger.info("StreamSession", "Adding stream to session", mapOf(
            "sessionId" to sessionId,
            "quality" to videoQuality.toString(),
            "frameRate" to frameRate,
            "compressVideo" to compressVideo
        ))

        val stream = session.addStream(streamConfig)
        streams[sessionId] = stream

        val currentScope = scope ?: throw IllegalStateException("Module scope not available")

        // Collect video frames
        videoJobs[sessionId] = currentScope.launch {
            stream.videoStream.collect { frame ->
                handleVideoFrame(sessionId, frame)
            }
        }

        // Collect state changes
        stateJobs[sessionId] = currentScope.launch {
            stream.state.collect { state ->
                handleStateChange(sessionId, state)
            }
        }

        // Collect errors
        errorJobs[sessionId] = currentScope.launch {
            stream.errorStream.collect { error ->
                logger.error("StreamSession", "Stream error", mapOf(
                    "sessionId" to sessionId,
                    "error" to error.toString()
                ))
                emitEvent("onStreamError", mapOf("type" to "internalError"))
            }
        }

        // Emit capability state
        emitEvent("onCapabilityStateChange", mapOf(
            "sessionId" to sessionId,
            "state" to "active"
        ))

        logger.info("StreamSession", "Stream added to session", mapOf("sessionId" to sessionId))
    }

    fun removeStreamFromSession(sessionId: String) {
        val session = WearablesManager.getSession(sessionId)
        session?.removeStream()
        destroyStream(sessionId)

        emitEvent("onCapabilityStateChange", mapOf(
            "sessionId" to sessionId,
            "state" to "stopped"
        ))

        logger.info("StreamSession", "Stream removed from session", mapOf("sessionId" to sessionId))
    }

    suspend fun capturePhoto(context: Context, format: String) {
        // Find the first active stream
        val stream = streams.values.firstOrNull()
            ?: throw Exception("No active stream session")

        logger.info("StreamSession", "Capturing photo", mapOf("requestedFormat" to format))
        val result = stream.capturePhoto()

        result.fold(
            onSuccess = { photoData ->
                handlePhotoCapture(context, photoData, format)
            },
            onFailure = { error ->
                val msg = when (error) {
                    is CaptureError.DeviceDisconnected -> "Device disconnected"
                    is CaptureError.NotStreaming -> "Not streaming"
                    is CaptureError.CaptureInProgress -> "Capture already in progress"
                    is CaptureError.CaptureFailed -> "Capture failed"
                }
                logger.error("StreamSession", "Photo capture failed", mapOf("error" to msg))
                throw Exception("Photo capture failed: $msg")
            }
        )
    }

    // MARK: - Frame Handling

    private fun handleVideoFrame(sessionId: String, videoFrame: VideoFrame) {
        // If frame is compressed HEVC, emit metadata only (can't decode to bitmap)
        if (videoFrame.isCompressed) {
            emitEvent("onVideoFrame", mapOf(
                "timestamp" to System.currentTimeMillis(),
                "width" to videoFrame.width,
                "height" to videoFrame.height,
                "isCompressed" to true
            ))
            return
        }

        val buffer = videoFrame.buffer
        val dataSize = buffer.remaining()
        val byteArray = ByteArray(dataSize)

        val originalPosition = buffer.position()
        buffer.get(byteArray)
        buffer.position(originalPosition)

        // I420 -> NV21 -> JPEG -> Bitmap
        val nv21 = convertI420toNV21(byteArray, videoFrame.width, videoFrame.height)
        val image = YuvImage(nv21, ImageFormat.NV21, videoFrame.width, videoFrame.height, null)
        val out = ByteArrayOutputStream()
        image.compressToJpeg(Rect(0, 0, videoFrame.width, videoFrame.height), 50, out)
        val jpegBytes = out.toByteArray()
        val bitmap = BitmapFactory.decodeByteArray(jpegBytes, 0, jpegBytes.size) ?: return

        // Forward to native view
        frameCallback?.invoke(bitmap)

        // Emit metadata to JS
        emitEvent("onVideoFrame", mapOf(
            "timestamp" to System.currentTimeMillis(),
            "width" to videoFrame.width,
            "height" to videoFrame.height,
            "isCompressed" to false
        ))
    }

    private fun convertI420toNV21(input: ByteArray, width: Int, height: Int): ByteArray {
        val output = ByteArray(input.size)
        val size = width * height
        val quarter = size / 4

        // Copy Y plane directly
        input.copyInto(output, 0, 0, size)

        // Interleave V and U planes into NV21 format
        for (n in 0 until quarter) {
            output[size + n * 2] = input[size + quarter + n]     // V
            output[size + n * 2 + 1] = input[size + n]           // U
        }
        return output
    }

    // MARK: - State Handling

    private fun handleStateChange(sessionId: String, state: StreamSessionState) {
        val mapped = mapStreamState(state)
        logger.info("StreamSession", "State changed", mapOf(
            "sessionId" to sessionId,
            "state" to mapped
        ))

        emitEvent("onStreamStateChange", mapOf("state" to mapped))
    }

    // MARK: - Photo Handling

    private fun handlePhotoCapture(context: Context, photoData: PhotoData, requestedFormat: String) {
        val timestamp = System.currentTimeMillis()
        val tempDir = context.cacheDir

        when (photoData) {
            is PhotoData.Bitmap -> {
                val filename = "emwdat_photo_${timestamp}.jpg"
                val file = File(tempDir, filename)
                file.outputStream().use { out ->
                    photoData.bitmap.compress(Bitmap.CompressFormat.JPEG, 95, out)
                }
                logger.info("StreamSession", "Photo saved (Bitmap→JPEG)", mapOf("path" to file.absolutePath))

                emitEvent("onPhotoCaptured", mapOf(
                    "filePath" to file.absolutePath,
                    "format" to "jpeg",
                    "timestamp" to timestamp,
                    "width" to photoData.bitmap.width,
                    "height" to photoData.bitmap.height
                ))
            }
            is PhotoData.HEIC -> {
                val buffer = photoData.data
                val bytes = ByteArray(buffer.remaining())
                val originalPos = buffer.position()
                buffer.get(bytes)
                buffer.position(originalPos)

                // If JPEG requested, decode HEIC to bitmap and re-encode as JPEG
                if (requestedFormat == "jpeg") {
                    val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                    if (bitmap != null) {
                        val filename = "emwdat_photo_${timestamp}.jpg"
                        val file = File(tempDir, filename)
                        file.outputStream().use { out ->
                            bitmap.compress(Bitmap.CompressFormat.JPEG, 95, out)
                        }
                        logger.info("StreamSession", "Photo saved (HEIC→JPEG)", mapOf("path" to file.absolutePath))

                        emitEvent("onPhotoCaptured", mapOf(
                            "filePath" to file.absolutePath,
                            "format" to "jpeg",
                            "timestamp" to timestamp,
                            "width" to bitmap.width,
                            "height" to bitmap.height
                        ))
                        return
                    }
                    logger.warn("StreamSession", "HEIC→JPEG conversion failed, saving as HEIC")
                }

                // Save as HEIC (default or conversion failed)
                val filename = "emwdat_photo_${timestamp}.heic"
                val file = File(tempDir, filename)
                file.writeBytes(bytes)
                logger.info("StreamSession", "Photo saved (HEIC)", mapOf("path" to file.absolutePath))

                // Try to get dimensions from EXIF
                var width = 0
                var height = 0
                try {
                    val exif = ExifInterface(ByteArrayInputStream(bytes))
                    width = exif.getAttributeInt(ExifInterface.TAG_IMAGE_WIDTH, 0)
                    height = exif.getAttributeInt(ExifInterface.TAG_IMAGE_LENGTH, 0)
                } catch (e: Exception) {
                    logger.warn("StreamSession", "Could not read HEIC EXIF", mapOf("error" to e.toString()))
                }

                val payload = mutableMapOf<String, Any>(
                    "filePath" to file.absolutePath,
                    "format" to "heic",
                    "timestamp" to timestamp
                )
                if (width > 0 && height > 0) {
                    payload["width"] = width
                    payload["height"] = height
                }
                emitEvent("onPhotoCaptured", payload)
            }
            else -> {
                logger.warn("StreamSession", "Unknown PhotoData type")
            }
        }
    }

    // MARK: - Mapping Helpers

    private fun mapStreamState(state: StreamSessionState): String = when (state) {
        StreamSessionState.STOPPED -> "stopped"
        StreamSessionState.STARTING -> "starting"
        StreamSessionState.STARTED -> "starting"
        StreamSessionState.STREAMING -> "streaming"
        StreamSessionState.STOPPING -> "stopping"
        StreamSessionState.CLOSED -> "stopped"
    }

    // MARK: - Cleanup

    private fun destroyStream(sessionId: String) {
        videoJobs[sessionId]?.cancel()
        videoJobs.remove(sessionId)
        stateJobs[sessionId]?.cancel()
        stateJobs.remove(sessionId)
        errorJobs[sessionId]?.cancel()
        errorJobs.remove(sessionId)
        streams.remove(sessionId)
        logger.debug("StreamSession", "Stream destroyed", mapOf("sessionId" to sessionId))
    }

    fun destroy() {
        for (sessionId in streams.keys.toList()) {
            destroyStream(sessionId)
        }
    }

    // MARK: - Event Emission

    private fun emitEvent(name: String, body: Map<String, Any>) {
        eventEmitter?.invoke(name, body)
    }
}
