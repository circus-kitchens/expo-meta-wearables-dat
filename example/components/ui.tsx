import { Pressable, StyleSheet, Text, View } from "react-native";

// =============================================================================
// Section
// =============================================================================

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

// =============================================================================
// Row
// =============================================================================

export function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

// =============================================================================
// OptionRow
// =============================================================================

export function OptionRow({
  options,
  selected,
  onSelect,
  disabled,
}: {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.optionRow}>
      {options.map((opt) => {
        const active = opt.value === selected;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            disabled={disabled}
            style={[
              styles.optionChip,
              active && styles.optionChipActive,
              disabled && styles.optionChipDisabled,
            ]}
          >
            <Text
              style={[
                styles.optionChipText,
                active && styles.optionChipTextActive,
                disabled && styles.optionChipTextDisabled,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// =============================================================================
// Btn
// =============================================================================

export function Btn({
  label,
  onPress,
  disabled,
  variant,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive" | "success";
  icon?: React.ReactNode;
}) {
  const isDestructive = variant === "destructive";
  const isSuccess = variant === "success";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        isDestructive && styles.btnDestructive,
        isSuccess && styles.btnSuccess,
        disabled && styles.btnDisabled,
        pressed &&
          !disabled &&
          (isDestructive
            ? styles.btnDestructivePressed
            : isSuccess
              ? styles.btnSuccessPressed
              : styles.btnPressed),
      ]}
    >
      <View style={styles.btnContent}>
        {icon}
        <Text style={[styles.btnText, disabled && styles.btnTextDisabled]}>{label}</Text>
      </View>
    </Pressable>
  );
}

// =============================================================================
// StatusRow
// =============================================================================

export function StatusRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={[styles.statusValue, color ? { color } : undefined]}>{value}</Text>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  optionChip: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  optionChipActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  optionChipDisabled: {
    opacity: 0.5,
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#334155",
    textAlign: "center",
  },
  optionChipTextActive: {
    color: "#ffffff",
  },
  optionChipTextDisabled: {
    color: "#94a3b8",
  },
  btn: {
    flex: 1,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  btnDestructive: {
    backgroundColor: "#ef4444",
  },
  btnPressed: {
    backgroundColor: "#2563eb",
  },
  btnSuccess: {
    backgroundColor: "#22c55e",
  },
  btnSuccessPressed: {
    backgroundColor: "#16a34a",
  },
  btnDestructivePressed: {
    backgroundColor: "#dc2626",
  },
  btnDisabled: {
    backgroundColor: "#e2e8f0",
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  btnTextDisabled: {
    color: "#94a3b8",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  statusLabel: {
    color: "#64748b",
    fontSize: 14,
  },
  statusValue: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "500",
  },
});
