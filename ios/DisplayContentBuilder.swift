import Foundation
import MWDATDisplay

public typealias DisplayInteractionHandler = (String) -> Void

public struct DisplayContentBuilder {

    public static func build(
        from node: [String: Any],
        onInteraction: @escaping DisplayInteractionHandler
    ) -> (any ViewComponent)? {
        guard let type = node["type"] as? String else { return nil }

        switch type {
        case "flexBox":
            return buildFlexBox(node: node, onInteraction: onInteraction)
        case "text":
            return buildText(node: node)
        case "button":
            return buildButton(node: node, onInteraction: onInteraction)
        case "image":
            return buildImage(node: node)
        case "icon":
            return buildIcon(node: node)
        default:
            return nil
        }
    }

    private static func buildFlexBox(
        node: [String: Any],
        onInteraction: @escaping DisplayInteractionHandler
    ) -> FlexBox? {
        let direction: Direction = (node["direction"] as? String) == "row" ? .row : .column
        let gap = CGFloat((node["gap"] as? NSNumber)?.floatValue ?? 0)
        let paddingAll = CGFloat((node["paddingAll"] as? NSNumber)?.floatValue ?? 0)
        let onPressId = node["onPressId"] as? String
        let childNodes = node["children"] as? [[String: Any]] ?? []

        let children: [any ViewComponent] = childNodes.compactMap {
            build(from: $0, onInteraction: onInteraction)
        }

        var box = FlexBox(direction: direction, spacing: gap, padding: paddingAll > 0 ? EdgeInsets(all: paddingAll) : nil) {
            children
        }

        if let pressId = onPressId {
            box = box.onTap { onInteraction(pressId) }
        }

        return box
    }

    private static func buildText(node: [String: Any]) -> MWDATDisplay.Text? {
        guard let content = node["content"] as? String else { return nil }

        let style: TextStyle
        switch node["style"] as? String {
        case "heading": style = .heading
        case "meta": style = .meta
        default: style = .body
        }

        let color: TextColor = (node["color"] as? String) == "secondary" ? .secondary : .primary
        return MWDATDisplay.Text(content, style: style, color: color)
    }

    private static func buildButton(
        node: [String: Any],
        onInteraction: @escaping DisplayInteractionHandler
    ) -> MWDATDisplay.Button? {
        guard let label = node["label"] as? String,
              let onPressId = node["onPressId"] as? String else { return nil }

        let style: ButtonStyle
        switch node["style"] as? String {
        case "secondary": style = .secondary
        case "outline": style = .outline
        default: style = .primary
        }

        return MWDATDisplay.Button(label: label, style: style) { onInteraction(onPressId) }
    }

    private static func buildImage(node: [String: Any]) -> MWDATDisplay.Image? {
        guard let uri = node["uri"] as? String else { return nil }

        let sizePreset: ImageSizePreset = (node["sizePreset"] as? String) == "icon" ? .icon : .fill
        return MWDATDisplay.Image(uri: uri, sizePreset: sizePreset)
    }

    private static func buildIcon(node: [String: Any]) -> MWDATDisplay.Icon? {
        guard let name = node["name"] as? String else { return nil }

        let iconStyle: IconStyle = (node["style"] as? String) == "outline" ? .outline : .filled
        let iconName = parseIconName(name)
        return MWDATDisplay.Icon(name: iconName, style: iconStyle)
    }

    private static func parseIconName(_ name: String) -> IconName {
        if let match = IconName(rawValue: name) { return match }
        return .checkmarkCircle
    }
}
