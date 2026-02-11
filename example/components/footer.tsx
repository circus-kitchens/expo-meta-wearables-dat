import { StyleSheet, Text } from "react-native";

export function Footer() {
  return <Text style={styles.footer}>This project is not affiliated with Meta.</Text>;
}

const styles = StyleSheet.create({
  footer: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 16,
    marginBottom: 8,
  },
});
