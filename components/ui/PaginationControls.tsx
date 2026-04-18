import { palette } from "@/lib/theme";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
};

export function PaginationControls({ page, totalPages, onPrev, onNext }: Props) {
  if (totalPages <= 1) return null;

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={[styles.button, page <= 1 && styles.disabled]}
        onPress={onPrev}
        disabled={page <= 1}
      >
        <Text style={styles.buttonText}>Previous</Text>
      </TouchableOpacity>
      <Text style={styles.pageText}>
        Page {page} / {totalPages}
      </Text>
      <TouchableOpacity
        style={[styles.button, page >= totalPages && styles.disabled]}
        onPress={onNext}
        disabled={page >= totalPages}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: palette.primary,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  pageText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.45,
  },
});

