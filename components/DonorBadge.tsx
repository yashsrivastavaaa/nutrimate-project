import { ThemeContext } from "@/context/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";

interface DonorBadgeProps {
    isVerified?: boolean;
    donationCount?: number;
    badge?: "bronze" | "silver" | "gold" | "platinum";
    size?: "small" | "medium" | "large";
}

export function DonorBadge({ isVerified, donationCount, badge, size = "medium" }: DonorBadgeProps) {
    const { palette } = useContext(ThemeContext);

    const sizeConfig = {
        small: { iconSize: 14, textSize: 10, padding: 4 },
        medium: { iconSize: 16, textSize: 12, padding: 6 },
        large: { iconSize: 20, textSize: 14, padding: 8 },
    };

    const config = sizeConfig[size];

    const badgeColors: Record<string, string> = {
        bronze: "#CD7F32",
        silver: "#C0C0C0",
        gold: "#FFD700",
        platinum: "#E5E4E2",
    };

    return (
        <View style={styles.container}>
            {/* Verification Badge */}
            {isVerified && (
                <View style={[styles.badge, { backgroundColor: palette.primary }]}>
                    <MaterialCommunityIcons name="check-circle" size={config.iconSize} color="white" />
                </View>
            )}

            {/* Donation Count Badge */}
            {donationCount !== undefined && donationCount > 0 && (
                <View style={[styles.countBadge, { backgroundColor: palette.primaryDark }]}>
                    <MaterialCommunityIcons name="gift" size={config.iconSize - 2} color="white" />
                    <Text style={[styles.countText, { fontSize: config.textSize, color: "white" }]}>
                        {donationCount > 99 ? "99+" : donationCount}
                    </Text>
                </View>
            )}

            {/* Recognition Badge */}
            {badge && (
                <View
                    style={[
                        styles.recognitionBadge,
                        {
                            backgroundColor: badgeColors[badge],
                            borderColor: palette.border,
                        },
                    ]}
                >
                    <MaterialCommunityIcons name="star" size={config.iconSize - 2} color="white" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    badge: {
        padding: 4,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    countBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 2,
    },
    countText: {
        fontWeight: "600",
    },
    recognitionBadge: {
        padding: 4,
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
