import { ThemeContext } from "@/context/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useContext } from "react";
import { FlatList, ListRenderItemInfo, StyleSheet, Text, View } from "react-native";
import { DonorBadge } from "./DonorBadge";

interface LeaderboardDonor {
    userId: string;
    fullName: string;
    donationCount: number;
    isVerified: boolean;
    badge: "bronze" | "silver" | "gold" | "platinum";
}

interface DonorLeaderboardProps {
    donors: LeaderboardDonor[];
    loading?: boolean;
}

export function DonorLeaderboard({ donors, loading }: DonorLeaderboardProps) {
    const { palette } = useContext(ThemeContext);

    const getMedalColor = (rank: number) => {
        switch (rank) {
            case 0:
                return "#FFD700"; // Gold
            case 1:
                return "#C0C0C0"; // Silver
            case 2:
                return "#CD7F32"; // Bronze
            default:
                return palette.muted;
        }
    };

    const getMedalIcon = (rank: number) => {
        switch (rank) {
            case 0:
                return "medal";
            case 1:
                return "medal";
            case 2:
                return "medal";
            default:
                return "circle";
        }
    };

    const renderDonor = ({ item, index }: ListRenderItemInfo<LeaderboardDonor>) => (
        <View style={[styles.donorRow, { borderBottomColor: palette.border }]}>
            <View style={styles.rankSection}>
                <MaterialCommunityIcons
                    name={getMedalIcon(index) as any}
                    size={24}
                    color={getMedalColor(index)}
                />
                <Text style={[styles.rankText, { color: palette.text }]}>{index + 1}</Text>
            </View>

            <View style={styles.donorInfo}>
                <Text style={[styles.donorName, { color: palette.text }]}>{item.fullName}</Text>
                <Text style={[styles.donationCount, { color: palette.muted }]}>
                    {item.donationCount} donations
                </Text>
            </View>

            <View style={styles.badgeSection}>
                <DonorBadge
                    badge={item.badge}
                    donationCount={0}
                    size="small"
                />
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: palette.background }]}>
                <Text style={[styles.loadingText, { color: palette.muted }]}>Loading...</Text>
            </View>
        );
    }

    if (donors.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: palette.background }]}>
                <Text style={[styles.emptyText, { color: palette.muted }]}>No donors yet</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={donors}
            renderItem={renderDonor}
            keyExtractor={(item) => item.userId}
            scrollEnabled={false}
            style={[styles.list, { backgroundColor: palette.surface }]}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        fontSize: 14,
        fontWeight: "500",
    },
    emptyText: {
        fontSize: 14,
        fontWeight: "500",
    },
    list: {
        borderRadius: 12,
        overflow: "hidden",
    },
    donorRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
    },
    rankSection: {
        alignItems: "center",
        justifyContent: "center",
        width: 50,
        marginRight: 12,
    },
    rankText: {
        fontSize: 12,
        fontWeight: "600",
        marginTop: 4,
    },
    donorInfo: {
        flex: 1,
    },
    donorName: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 4,
    },
    donationCount: {
        fontSize: 12,
    },
    badgeSection: {
        marginLeft: 8,
    },
});
