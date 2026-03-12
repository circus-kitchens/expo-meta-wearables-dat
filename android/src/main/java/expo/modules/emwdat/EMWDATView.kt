package expo.modules.emwdat

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.widget.ImageView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

class EMWDATView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
    private val imageView: ImageView
    private var isActive = false

    private val frameCallback: FrameCallback = { bitmap ->
        post { imageView.setImageBitmap(bitmap) }
    }

    init {
        setBackgroundColor(Color.BLACK)
        imageView = ImageView(context).apply {
            scaleType = ImageView.ScaleType.CENTER_CROP
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        }
        addView(imageView)
    }

    fun setActive(active: Boolean) {
        if (active == isActive) return
        isActive = active
        if (active) {
            StreamSessionManager.setFrameCallback(frameCallback, this)
        } else {
            StreamSessionManager.removeFrameCallback(this)
            imageView.setImageBitmap(null)
        }
    }

    fun setResizeMode(mode: String) {
        imageView.scaleType = when (mode) {
            "cover" -> ImageView.ScaleType.CENTER_CROP
            "stretch" -> ImageView.ScaleType.FIT_XY
            "contain" -> ImageView.ScaleType.FIT_CENTER
            else -> ImageView.ScaleType.CENTER_CROP
        }
    }
}
