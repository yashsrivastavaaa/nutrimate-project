import { ThemeContext } from "@/context/ThemeContext";
import { useContext } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
};

export function AppButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
}: Props) {
  const { palette } = useContext(ThemeContext);
  const isDisabled = disabled || loading;

  const styles = StyleSheet.create({
    base: {
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      fontSize: 15,
      fontWeight: "700",
    },
    primary: {
      backgroundColor: palette.primary,
    },
    primaryLabel: {
      color: "#fff",
    },
    ghost: {
      backgroundColor: palette.background === "#0F172A" ? palette.surface : "#E8F9EE",
      borderColor: palette.border,
      borderWidth: 1,
    },
    ghostLabel: {
      color: palette.text,
    },
    danger: {
      backgroundColor: palette.danger,
    },
    dangerLabel: {
      color: "#fff",
    },
    disabled: {
      opacity: 0.65,
    },
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityHint={loading ? "Loading..." : undefined}
      style={[
        styles.base,
        variant === "primary" && styles.primary,
        variant === "ghost" && styles.ghost,
        variant === "danger" && styles.danger,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "ghost"
              ? palette.primary
              : variant === "danger"
                ? "#fff"
                : "#fff"
          }
        />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "primary" && styles.primaryLabel,
            variant === "ghost" && styles.ghostLabel,
            variant === "danger" && styles.dangerLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

