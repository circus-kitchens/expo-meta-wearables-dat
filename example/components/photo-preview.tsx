import type { PhotoData } from "expo-meta-wearables-dat";
import { Image, StyleSheet, Text, View } from "react-native";

import { Btn, Section, StatusRow } from "./ui";

export function PhotoPreview({ photo, onDelete }: { photo: PhotoData; onDelete: () => void }) {
  return (
    <Section title="Last Photo">
      <Image
        source={{ uri: `file://${photo.filePath}` }}
        style={styles.photoPreview}
        resizeMode="contain"
      />
      <StatusRow label="Format" value={photo.format} />
      <StatusRow
        label="Size"
        value={photo.width && photo.height ? `${photo.width}x${photo.height}` : "unknown"}
      />
      <Text style={styles.filePath} numberOfLines={2}>
        {photo.filePath}
      </Text>
      <View style={{ height: 12 }} />
      <Btn variant="destructive" label="Delete Photo" onPress={onDelete} />
    </Section>
  );
}

const styles = StyleSheet.create({
  photoPreview: {
    height: 240,
    borderRadius: 8,
    backgroundColor: "#0f172a",
    marginBottom: 12,
  },
  filePath: {
    color: "#64748b",
    fontSize: 11,
    fontFamily: "Courier",
    marginTop: 8,
  },
});
