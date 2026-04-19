import { ThemeContext } from "@/context/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface EmptyStateProps {
  title: string;
  subtitle: string;
  icon?: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ title, subtitle, icon = "inbox-outline", actionText, onAction }: EmptyStateProps) {
  const { palette } = useContext(ThemeContext);

  return (
    <View style={[styles.wrap, { backgroundColor: palette.background, borderColor: palette.border }]}>
      <MaterialCommunityIcons name={icon as any} size={48} color={palette.primaryDark} />
      <Text style={[styles.title, { color: palette.primaryDark }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: palette.muted }]}>{subtitle}</Text>
      {actionText && onAction && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: palette.primary }]}
          onPress={onAction}
        >
          <Text style={[styles.actionText, { color: palette.background }]}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 30,
    borderWidth: 1,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  title: {
    marginTop: 8,
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionText: {
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
});

