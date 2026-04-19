import { DonorLeaderboard } from "@/components/DonorLeaderboard";
import { AppCard } from "@/components/ui/AppCard";
import { AppScreen } from "@/components/ui/AppScreen";
import { ThemeContext } from "@/context/ThemeContext";
import { donationApi } from "@/lib/api/donation";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";

interface LeaderboardDonor {
    userId: string;
    fullName: string;
    donationCount: number;
    isVerified: boolean;
    badge: "bronze" | "silver" | "gold" | "platinum";
}

export default function DonorLeaderboardScreen() {
    const { palette } = useContext(ThemeContext);
    const [donors, setDonors] = useState<LeaderboardDonor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadLeaderboard = async () => {
            try {
                setLoading(true);
                const allUsers = await donationApi.listUsers();

                // Process users to add donation data and badges
                const processedDonors = await Promise.all(
                    allUsers.map(async (user: any) => {
                        // Fetch all donations and count only completed ones
                        const userDonations = await donationApi.listForDonor(user.id);
                        const completedCount = (userDonations as any[]).filter(
                            (d: any) => d.status === "completed"
                        ).length;

                        let badge: "bronze" | "silver" | "gold" | "platinum" = "bronze";

                        if (completedCount >= 100) {
                            badge = "platinum";
                        } else if (completedCount >= 50) {
                            badge = "gold";
                        } else if (completedCount >= 20) {
                            badge = "silver";
                        }

                        return {
                            userId: user.id,
                            fullName: user.fullName,
                            donationCount: completedCount,
                            isVerified: user.isVerified === 1,
                            badge,
                        };
                    })
                );

                // Sort by donation count descending
                const sorted = processedDonors
                    .filter((d) => d.donationCount > 0)
                    .sort((a, b) => b.donationCount - a.donationCount);

                setDonors(sorted);
            } catch (error) {
                Alert.alert("Error", "Failed to load leaderboard");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        loadLeaderboard();
    }, []);

    const topDonor = donors[0];
    const userCount = donors.length;
    const totalDonations = donors.reduce((sum, donor) => sum + donor.donationCount, 0);

    return (
        <AppScreen>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <MaterialCommunityIcons name="trophy" size={40} color={palette.primary} />
                    <Text style={[styles.title, { color: palette.text }]}>Donor Leaderboard</Text>
                    <Text style={[styles.subtitle, { color: palette.muted }]}>
                        Recognizing our most generous donors
                    </Text>
                </View>

                {/* Stats */}
                <AppCard variant="compact">
                    <View style={styles.statsRow}>
                        <View style={styles.statCol}>
                            <MaterialCommunityIcons name="medal" size={24} color="#FFD700" />
                            <Text style={[styles.statValue, { color: palette.text }]}>{userCount}</Text>
                            <Text style={[styles.statLabel, { color: palette.muted }]}>Top Donors</Text>
                        </View>

                        <View style={[styles.divider, { backgroundColor: palette.border }]} />

                        <View style={styles.statCol}>
                            <MaterialCommunityIcons name="gift" size={24} color={palette.primary} />
                            <Text style={[styles.statValue, { color: palette.text }]}>{totalDonations}</Text>
                            <Text style={[styles.statLabel, { color: palette.muted }]}>Total Donations</Text>
                        </View>

                        {topDonor && (
                            <>
                                <View style={[styles.divider, { backgroundColor: palette.border }]} />
                                <View style={styles.statCol}>
                                    <MaterialCommunityIcons
                                        name="star"
                                        size={24}
                                        color="#FFD700"
                                    />
                                    <Text
                                        style={[styles.statValue, { color: palette.text }]}
                                        numberOfLines={1}
                                    >
                                        {topDonor.fullName.split(" ")[0]}
                                    </Text>
                                    <Text style={[styles.statLabel, { color: palette.muted }]}>Top Donor</Text>
                                </View>
                            </>
                        )}
                    </View>
                </AppCard>

                {/* Leaderboard */}
                <View style={styles.leaderboardContainer}>
                    <Text style={[styles.sectionTitle, { color: palette.text }]}>Rankings</Text>
                    {loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color={palette.primary} />
                        </View>
                    ) : donors.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="inbox-outline" size={40} color={palette.primaryDark} />
                            <Text style={[styles.emptyText, { color: palette.text }]}>No donors yet</Text>
                        </View>
                    ) : (
                        <DonorLeaderboard donors={donors} loading={loading} />
                    )}
                </View>

                {/* Info Card */}
                <AppCard>
                    <MaterialCommunityIcons name="information" size={20} color={palette.primary} />
                    <Text style={[styles.infoText, { color: palette.muted }]}>
                        Badges are earned based on donation count: Bronze (10+), Silver (20+), Gold (50+),
                        Platinum (100+)
                    </Text>
                </AppCard>
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 14,
    },
    headerContainer: {
        alignItems: "center",
        marginBottom: 20,
        gap: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
    },
    subtitle: {
        fontSize: 13,
        textAlign: "center",
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
    },
    statCol: {
        alignItems: "center",
        flex: 1,
        gap: 6,
    },
    statValue: {
        fontSize: 16,
        fontWeight: "700",
    },
    statLabel: {
        fontSize: 11,
        textAlign: "center",
    },
    divider: {
        width: 1,
        height: 50,
    },
    leaderboardContainer: {
        marginVertical: 16,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        paddingHorizontal: 4,
    },
    centerContainer: {
        justifyContent: "center",
        alignItems: "center",
        minHeight: 200,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        minHeight: 200,
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: "500",
    },
    infoText: {
        fontSize: 13,
        lineHeight: 18,
    },
});
