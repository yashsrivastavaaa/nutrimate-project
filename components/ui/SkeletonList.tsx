import { StyleSheet, View } from "react-native";
import { SkeletonCard } from "@/components/SkeletonCard";

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    marginTop: 8,
  },
});
