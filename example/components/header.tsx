import { Feather } from "@expo/vector-icons";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

const DOCS_URL = "https://wearables.developer.meta.com/docs/develop/";
const GITHUB_URL = "https://github.com/circus-kitchens/expo-meta-wearables-dat";

export function Header() {
  return (
    <View style={styles.container}>
      <Text style={styles.packageName}>expo-meta-wearables-dat</Text>
      <Text style={styles.title}>EMWDAT Example</Text>
      <View style={styles.linkRow}>
        <Pressable onPress={() => Linking.openURL(GITHUB_URL)} style={styles.link}>
          <Feather name="github" size={14} color="#3b82f6" />
          <Text style={styles.linkText}>GitHub</Text>
        </Pressable>
        <Text style={styles.separator}>|</Text>
        <Pressable onPress={() => Linking.openURL(DOCS_URL)} style={styles.link}>
          <Feather name="external-link" size={13} color="#3b82f6" />
          <Text style={styles.linkText}>MWDAT Docs</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  packageName: {
    fontSize: 12,
    fontFamily: "Courier",
    color: "#64748b",
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  linkText: {
    fontSize: 13,
    color: "#3b82f6",
    fontWeight: "500",
  },
  separator: {
    color: "#cbd5e1",
    fontSize: 13,
  },
});
