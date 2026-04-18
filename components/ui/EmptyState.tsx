import { palette } from "@/lib/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.wrap}>
      <MaterialCommunityIcons name="inbox-outline" size={40} color={palette.primaryDark} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 30,
    backgroundColor: "#F0FAF3",
    borderWidth: 1,
    borderColor: "#D9EFE0",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    gap: 8,
  },
  title: {
    marginTop: 8,
    fontWeight: "700",
    color: palette.primaryDark,
  },
  subtitle: {
    fontSize: 13,
    color: palette.muted,
    textAlign: "center",
  },
});

