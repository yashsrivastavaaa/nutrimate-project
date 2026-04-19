import { ThemeContext } from "@/context/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useContext, useState } from "react";
import { Alert, FlatList, ListRenderItemInfo, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DonorBadge } from "./DonorBadge";
import { AppCard } from "./ui/AppCard";

interface FavoriteDonor {
    userId: string;
    fullName: string;
    email: string;
    donationCount: number;
    isVerified: boolean;
}

interface FavoriteDonorsListProps {
    donors: FavoriteDonor[];
    onRemove: (donorId: string) => Promise<void>;
    loading?: boolean;
}

export function FavoriteDonorsList({ donors, onRemove, loading }: FavoriteDonorsListProps) {
    const { palette } = useContext(ThemeContext);
    const [removing, setRemoving] = useState<string | null>(null);

    const handleRemove = async (donorId: string, donorName: string) => {
        Alert.alert(
            "Remove Favorite",
            `Are you sure you want to remove ${donorName} from your favorites?`,
            [
                { text: "Cancel", onPress: () => { } },
                {
                    text: "Remove",
                    onPress: async () => {
                        try {
                            setRemoving(donorId);
                            await onRemove(donorId);
                        } catch (error) {
                            Alert.alert("Error", "Failed to remove favorite donor");
                        } finally {
                            setRemoving(null);
                        }
                    },
                    style: "destructive",
                },
            ]
        );
    };

    const renderDonor = ({ item }: ListRenderItemInfo<FavoriteDonor>) => (
        <AppCard variant="compact">
            <View style={styles.donorContainer}>
                <View style={styles.donorHeader}>
                    <Text style={[styles.donorName, { color: palette.text }]} numberOfLines={1}>
                        {item.fullName}
                    </Text>
                    <TouchableOpacity
                        onPress={() => handleRemove(item.userId, item.fullName)}
                        disabled={removing === item.userId}
                        style={[styles.removeButton, removing === item.userId && styles.removeButtonDisabled]}
                    >
                        <MaterialCommunityIcons
                            name={removing === item.userId ? "loading" : "heart"}
                            size={18}
                            color={removing === item.userId ? palette.muted : palette.danger}
                        />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.donorEmail, { color: palette.muted }]} numberOfLines={1}>
                    {item.email}
                </Text>

                <View style={styles.donorStats}>
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="gift" size={14} color={palette.primary} />
                        <Text style={[styles.statText, { color: palette.muted }]}>
                            {item.donationCount} donations
                        </Text>
                    </View>

                    <View style={styles.badgeContainer}>
                        <DonorBadge
                            isVerified={item.isVerified}
                            donationCount={0}
                            size="small"
                        />
                    </View>
                </View>
            </View>
        </AppCard>
    );

    if (loading) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: palette.background }]}>
                <Text style={[styles.emptyText, { color: palette.muted }]}>Loading...</Text>
            </View>
        );
    }

    if (donors.length === 0) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: palette.background }]}>
                <MaterialCommunityIcons name="heart-outline" size={40} color={palette.primaryDark} />
                <Text style={[styles.emptyTitle, { color: palette.text }]}>No favorite donors yet</Text>
                <Text style={[styles.emptyText, { color: palette.muted }]}>
                    Heart donors you frequently work with to keep them in your favorites list.
                </Text>
            </View>
        );
    }

    return (
        <FlatList
            data={donors}
            renderItem={renderDonor}
            keyExtractor={(item) => item.userId}
            contentContainerStyle={styles.listContent}
            scrollEnabled={false}
        />
    );
}

const styles = StyleSheet.create({
    emptyContainer: {
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 200,
        borderRadius: 12,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginTop: 12,
    },
    emptyText: {
        fontSize: 13,
        marginTop: 6,
        textAlign: "center",
    },
    listContent: {
        gap: 10,
    },
    donorContainer: {
        gap: 8,
    },
    donorHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    donorName: {
        fontSize: 14,
        fontWeight: "600",
        flex: 1,
    },
    removeButton: {
        padding: 6,
        marginLeft: 8,
    },
    removeButtonDisabled: {
        opacity: 0.5,
    },
    donorEmail: {
        fontSize: 12,
    },
    donorStats: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 4,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    statText: {
        fontSize: 12,
    },
    badgeContainer: {
        marginLeft: 8,
    },
});
