import { DonationStatus } from "@/lib/types";
import { StyleSheet, Text, View } from "react-native";

const COLORS: Record<DonationStatus, { bg: string; text: string }> = {
  available: { bg: "#EEF2FF", text: "#4338CA" },
  reserved: { bg: "#FEF3C7", text: "#B45309" },
  ready: { bg: "#D1FAE5", text: "#065F46" },
  pickup_assigned: { bg: "#DBEAFE", text: "#1D4ED8" },
  awaiting_volunteer_pickup: { bg: "#FED7AA", text: "#92400E" },
  awaiting_donor_handover: { bg: "#FED7AA", text: "#92400E" },
  picked: { bg: "#E0F2FE", text: "#0369A1" },
  delivered_to_ngo: { bg: "#DCFCE7", text: "#166534" },
  completed: { bg: "#D1FAE5", text: "#047857" },
};

export function StatusBadge({ status }: { status: DonationStatus }) {
  const c = COLORS[status];
  const statusLabel = status.replace(/_/g, " ").toUpperCase();
  return (
    <View
      style={[styles.badge, { backgroundColor: c.bg }]}
      accessibilityLabel={`Status: ${statusLabel}`}
      accessibilityRole="text"
    >
      <Text style={[styles.text, { color: c.text }]}>{statusLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
  },
});

