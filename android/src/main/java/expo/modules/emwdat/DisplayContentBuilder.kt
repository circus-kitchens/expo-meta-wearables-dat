package expo.modules.emwdat

import com.meta.wearable.dat.display.views.ButtonStyle
import com.meta.wearable.dat.display.views.ContentScope
import com.meta.wearable.dat.display.views.Direction
import com.meta.wearable.dat.display.views.IconName
import com.meta.wearable.dat.display.views.IconStyle
import com.meta.wearable.dat.display.views.ImageSizePreset
import com.meta.wearable.dat.display.views.TextColor
import com.meta.wearable.dat.display.views.TextStyle

typealias InteractionHandler = (String) -> Unit

object DisplayContentBuilder {

    fun build(scope: ContentScope, node: Map<String, Any>, onInteraction: InteractionHandler) {
        buildNode(scope, node, onInteraction)
    }

    private fun buildNode(scope: ContentScope, node: Map<String, Any>, onInteraction: InteractionHandler) {
        when (node["type"] as? String) {
            "flexBox" -> buildFlexBox(scope, node, onInteraction)
            "text" -> buildText(scope, node)
            "button" -> buildButton(scope, node, onInteraction)
            "image" -> buildImage(scope, node)
            "icon" -> buildIcon(scope, node)
        }
    }

    private fun buildFlexBox(scope: ContentScope, node: Map<String, Any>, onInteraction: InteractionHandler) {
        val direction = when (node["direction"] as? String) {
            "row" -> Direction.ROW
            else -> Direction.COLUMN
        }
        val gap = (node["gap"] as? Number)?.toInt() ?: 0
        val paddingAll = (node["paddingAll"] as? Number)?.toInt() ?: 0
        val onPressId = node["onPressId"] as? String
        @Suppress("UNCHECKED_CAST")
        val children = (node["children"] as? List<*>)?.filterIsInstance<Map<String, Any>>() ?: emptyList()

        val clickHandler: (() -> Unit)? = onPressId?.let { id -> { onInteraction(id) } }

        scope.flexBox(
            direction = direction,
            gap = gap,
            paddingTop = paddingAll,
            paddingBottom = paddingAll,
            paddingStart = paddingAll,
            paddingEnd = paddingAll,
            onClick = clickHandler
        ) {
            for (child in children) {
                buildNode(this, child, onInteraction)
            }
        }
    }

    private fun buildText(scope: ContentScope, node: Map<String, Any>) {
        val content = node["content"] as? String ?: return
        val style = when (node["style"] as? String) {
            "heading" -> TextStyle.HEADING
            "meta" -> TextStyle.META
            else -> TextStyle.BODY
        }
        val color = when (node["color"] as? String) {
            "secondary" -> TextColor.SECONDARY
            else -> TextColor.PRIMARY
        }
        scope.text(content, style = style, color = color)
    }

    private fun buildButton(scope: ContentScope, node: Map<String, Any>, onInteraction: InteractionHandler) {
        val label = node["label"] as? String ?: return
        val onPressId = node["onPressId"] as? String ?: return
        val style = when (node["style"] as? String) {
            "secondary" -> ButtonStyle.SECONDARY
            "outline" -> ButtonStyle.OUTLINE
            else -> ButtonStyle.PRIMARY
        }
        scope.button(label = label, style = style, onClick = { onInteraction(onPressId) })
    }

    private fun buildImage(scope: ContentScope, node: Map<String, Any>) {
        val uri = node["uri"] as? String ?: return
        val sizePreset = when (node["sizePreset"] as? String) {
            "icon" -> ImageSizePreset.ICON
            else -> ImageSizePreset.FILL
        }
        scope.image(uri = uri, sizePreset = sizePreset)
    }

    private fun buildIcon(scope: ContentScope, node: Map<String, Any>) {
        val name = node["name"] as? String ?: return
        val iconName = parseIconName(name)
        val style = when (node["style"] as? String) {
            "outline" -> IconStyle.OUTLINE
            else -> IconStyle.FILLED
        }
        scope.icon(name = iconName, style = style)
    }

    private fun parseIconName(name: String): IconName {
        return try {
            IconName.valueOf(name.uppercase())
        } catch (e: IllegalArgumentException) {
            IconName.CHECKMARK_CIRCLE
        }
    }
}
