import { palette } from "@/lib/theme";
import { memo, useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

export const SkeletonCard = memo(function SkeletonCard() {
  const pulse = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.55,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.card, { opacity: pulse }]}>
      <View style={styles.image} />
      <View style={styles.body}>
        <View style={styles.title} />
        <View style={styles.line} />
        <View style={[styles.line, styles.lineShort]} />
        <View style={styles.badgeRow}>
          <View style={styles.badge} />
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#E6F4EA",
  },
  body: {
    padding: 14,
    gap: 10,
  },
  title: {
    width: "72%",
    height: 16,
    borderRadius: 8,
    backgroundColor: "#D9EADF",
  },
  line: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#E3F0E7",
    width: "100%",
  },
  lineShort: {
    width: "65%",
  },
  badgeRow: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  badge: {
    width: 88,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#DFF5E6",
  },
});
