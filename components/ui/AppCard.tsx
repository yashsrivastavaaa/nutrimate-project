import { ThemeContext } from "@/context/ThemeContext";
import { ReactNode, useContext } from "react";
import { StyleSheet, View } from "react-native";

interface AppCardProps {
  children: ReactNode;
  onPress?: () => void;
  badge?: ReactNode;
  variant?: "default" | "compact" | "elevated";
}

export function AppCard({ children, badge, variant = "default" }: AppCardProps) {
  const { palette } = useContext(ThemeContext);

  const variantStyles = {
    default: {
      padding: 14,
      borderRadius: 16,
      elevation: 2,
    },
    compact: {
      padding: 10,
      borderRadius: 12,
      elevation: 1,
    },
    elevated: {
      padding: 16,
      borderRadius: 16,
      elevation: 4,
    },
  };

  const variantConfig = variantStyles[variant];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          ...variantConfig,
        },
      ]}
    >
      {badge && <View style={styles.badge}>{badge}</View>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
});

