package expo.modules.emwdat

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import android.graphics.Rect
import android.graphics.YuvImage
import androidx.exifinterface.media.ExifInterface
import com.meta.wearable.dat.camera.StreamSession
import com.meta.wearable.dat.camera.startStreamSession
import com.meta.wearable.dat.camera.types.PhotoData
import com.meta.wearable.dat.camera.types.StreamConfiguration
import com.meta.wearable.dat.camera.types.StreamSessionState
import com.meta.wearable.dat.camera.types.VideoFrame
import com.meta.wearable.dat.camera.types.VideoQuality
import com.meta.wearable.dat.core.Wearables
import com.meta.wearable.dat.core.selectors.AutoDeviceSelector
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File

typealias FrameCallback = (Bitmap) -> Unit

object StreamSessionManager {
    private val logger = EMWDATLogger

    private var streamSession: StreamSession? = null
    private var videoJob: Job? = null
    private var stateJob: Job? = null
    private var scope: CoroutineScope? = null

    var currentState: String = "stopped"
        private set

    // Callbacks
    private var eventEmitter: EventEmitter? = null
    private var frameCallback: FrameCallback? = null

    fun setEventEmitter(emitter: EventEmitter) {
        this.eventEmitter = emitter
    }

    fun setScope(scope: CoroutineScope) {
        this.scope = scope
    }

    fun setFrameCallback(callback: FrameCallback) {
        this.frameCallback = callback
    }

    fun removeFrameCallback() {
        this.frameCallback = null
    }

    // MARK: - Stream Control

    fun startStream(context: Context, config: Map<String, Any>, deviceId: String?) {
        if (streamSession != null) {
            logger.warn("StreamSession", "Stream already active, closing previous session")
            stopStream()
        }

        val videoQuality = when (config["resolution"] as? String) {
            "high" -> VideoQuality.HIGH
            "medium" -> VideoQuality.MEDIUM
            else -> VideoQuality.LOW
        }
        val frameRate = (config["frameRate"] as? Number)?.toInt() ?: 15
        val streamConfig = StreamConfiguration(videoQuality, frameRate)

        val deviceSelector = AutoDeviceSelector()

        logger.info("StreamSession", "Starting stream", mapOf(
            "quality" to videoQuality.toString(),
            "frameRate" to frameRate
        ))

        val session = Wearables.startStreamSession(context, deviceSelector, streamConfig)
        streamSession = session

        // Collect video frames
        videoJob = scope?.launch {
            session.videoStream.collect { frame ->
                handleVideoFrame(frame)
            }
        }

        // Collect state changes
        stateJob = scope?.launch {
            session.state.collect { state ->
                handleStateChange(state)
            }
        }

        logger.info("StreamSession", "Stream session started")
    }

    fun stopStream() {
        logger.info("StreamSession", "Stopping stream")
        videoJob?.cancel()
        stateJob?.cancel()
        videoJob = null
        stateJob = null
        streamSession?.close()
        streamSession = null
        currentState = "stopped"
        logger.info("StreamSession", "Stream stopped")
    }

    suspend fun capturePhoto(context: Context): Map<String, Any>? {
        val session = streamSession ?: run {
            logger.warn("StreamSession", "Cannot capture photo - no active stream")
            return null
        }

        if (currentState != "streaming") {
            logger.warn("StreamSession", "Cannot capture photo - not streaming", mapOf("state" to currentState))
            return null
        }

        logger.info("StreamSession", "Capturing photo")
        val result = session.capturePhoto() ?: run {
            logger.warn("StreamSession", "capturePhoto returned null")
            return null
        }

        var photoResult: Map<String, Any>? = null

        result.onSuccess { photoData ->
            photoResult = handlePhotoCapture(context, photoData)
        }
        result.onFailure { error ->
            logger.error("StreamSession", "Photo capture failed", mapOf("error" to error.toString()))
        }

        return photoResult
    }

    // MARK: - Frame Handling

    private fun handleVideoFrame(videoFrame: VideoFrame) {
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
            "height" to videoFrame.height
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

    private fun handleStateChange(state: StreamSessionState) {
        val mapped = mapStreamState(state)
        logger.info("StreamSession", "State changed", mapOf(
            "from" to currentState,
            "to" to mapped
        ))

        currentState = mapped
        emitEvent("onStreamStateChange", mapOf("state" to mapped))

        if (state == StreamSessionState.STOPPED || state == StreamSessionState.CLOSED) {
            stopStream()
        }
    }

    // MARK: - Photo Handling

    private fun handlePhotoCapture(context: Context, photoData: PhotoData): Map<String, Any>? {
        val timestamp = System.currentTimeMillis()
        val tempDir = context.cacheDir

        return when (photoData) {
            is PhotoData.Bitmap -> {
                val filename = "emwdat_photo_${timestamp}.jpg"
                val file = File(tempDir, filename)
                file.outputStream().use { out ->
                    photoData.bitmap.compress(Bitmap.CompressFormat.JPEG, 95, out)
                }
                logger.info("StreamSession", "Photo saved (Bitmap)", mapOf("path" to file.absolutePath))

                val payload = mutableMapOf<String, Any>(
                    "filePath" to file.absolutePath,
                    "format" to "jpeg",
                    "timestamp" to timestamp,
                    "width" to photoData.bitmap.width,
                    "height" to photoData.bitmap.height
                )
                emitEvent("onPhotoCaptured", payload)
                payload
            }
            is PhotoData.HEIC -> {
                val filename = "emwdat_photo_${timestamp}.heic"
                val file = File(tempDir, filename)
                val buffer = photoData.data
                val bytes = ByteArray(buffer.remaining())
                val originalPos = buffer.position()
                buffer.get(bytes)
                buffer.position(originalPos)
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
                payload
            }
            else -> {
                logger.warn("StreamSession", "Unknown PhotoData type")
                null
            }
        }
    }

    // MARK: - Mapping Helpers

    private fun mapStreamState(state: StreamSessionState): String = when (state) {
        StreamSessionState.STOPPED -> "stopped"
        StreamSessionState.STARTING -> "starting"
        StreamSessionState.STARTED -> "started"
        StreamSessionState.STREAMING -> "streaming"
        StreamSessionState.STOPPING -> "stopping"
        StreamSessionState.CLOSED -> "stopped"
    }

    // MARK: - Event Emission

    private fun emitEvent(name: String, body: Map<String, Any>) {
        eventEmitter?.invoke(name, body)
    }

    // MARK: - Cleanup

    fun destroy() {
        stopStream()
    }
}
