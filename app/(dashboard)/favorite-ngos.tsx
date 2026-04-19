import { AppButton, AppCard, AppScreen } from "@/components/ui";
import { AuthContext } from "@/context/AuthContext";
import { ThemeContext } from "@/context/ThemeContext";
import { donationApi } from "@/lib/api/donation";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface FavoriteNgo {
    ngoId: number;
    ngoName: string;
    email: string;
    city: string;
    state: string;
    familiesServed: number;
    donationsReceived: number;
    status: string;
}

export default function FavoriteNgosScreen() {
    const router = useRouter();
    const { palette } = useContext(ThemeContext);
    const { user } = useContext(AuthContext);

    const [ngos, setNgos] = useState<FavoriteNgo[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadFavoriteNgos = useCallback(async () => {
        if (!user?.id) return;

        try {
            setError("");
            const data = await donationApi.getFavoriteNgos(user.id);
            setNgos(data as FavoriteNgo[]);
        } catch (err) {
            console.error(err);
            setError("Failed to load favorite NGOs. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            await loadFavoriteNgos();
        })();
    }, [loadFavoriteNgos]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadFavoriteNgos();
        setRefreshing(false);
    };

    const handleRemoveFavorite = (ngoId: number) => {
        Alert.alert(
            "Remove Favorite",
            "Are you sure you want to remove this NGO from favorites?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            if (user?.id) {
                                await donationApi.toggleFavoriteNgo(user.id, ngoId);
                                setNgos((prev) => prev.filter((ngo) => ngo.ngoId !== ngoId));
                            }
                        } catch (err) {
                            Alert.alert("Error", "Failed to remove favorite");
                            console.error(err);
                        }
                    },
                },
            ]
        );
    };

    const handleViewNgoProfile = (ngoId: number) => {
        router.push({ pathname: "/(dashboard)/ngo-profile", params: { ngoId } } as any);
    };

    if (loading) {
        return (
            <AppScreen>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={palette.primary} />
                </View>
            </AppScreen>
        );
    }

    return (
        <AppScreen scroll={false}>
            <Text style={[styles.title, { color: palette.primaryDark }]}>Favorite NGOs</Text>
            <Text style={[styles.subtitle, { color: palette.muted }]}>NGOs you follow and support</Text>

            {error && <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>}

            <FlatList
                data={ngos}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                keyExtractor={(item) => String(item.ngoId)}
                contentContainerStyle={{ paddingBottom: 20, gap: 12 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="heart-outline" size={48} color={palette.muted} />
                        <Text style={[styles.emptyTitle, { color: palette.text }]}>No favorite NGOs yet</Text>
                        <Text style={[styles.emptySubtitle, { color: palette.muted }]}>
                            Add NGOs to your favorites while browsing donations
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <AppCard>
                        <View style={styles.ngoHeader}>
                            <View style={styles.ngoInfo}>
                                <Text style={[styles.ngoName, { color: palette.text }]}>{item.ngoName}</Text>
                                <Text style={[styles.ngoEmail, { color: palette.muted }]}>{item.email}</Text>
                                <Text style={[styles.ngoLocation, { color: palette.muted }]}>
                                    {item.city}, {item.state}
                                </Text>
                            </View>
                            <View style={styles.ngoBadge}>
                                {item.status === "approved" && (
                                    <MaterialCommunityIcons name="check-circle" size={24} color={palette.primary} />
                                )}
                            </View>
                        </View>

                        <View style={[styles.statsRow, { borderTopColor: palette.border, borderTopWidth: 1 }]}>
                            <View style={styles.statItem}>
                                <MaterialCommunityIcons name="home-heart" size={16} color={palette.primary} />
                                <Text style={[styles.statValue, { color: palette.text }]}>{item.familiesServed}</Text>
                                <Text style={[styles.statLabel, { color: palette.muted }]}>Families</Text>
                            </View>
                            <View style={styles.statItem}>
                                <MaterialCommunityIcons name="gift" size={16} color={palette.primary} />
                                <Text style={[styles.statValue, { color: palette.text }]}>{item.donationsReceived}</Text>
                                <Text style={[styles.statLabel, { color: palette.muted }]}>Donations</Text>
                            </View>
                        </View>

                        <View style={styles.actionRow}>
                            <AppButton
                                label="View Profile"
                                onPress={() => handleViewNgoProfile(item.ngoId)}
                            />
                            <TouchableOpacity
                                style={[styles.removeButton, { backgroundColor: palette.danger }]}
                                onPress={() => handleRemoveFavorite(item.ngoId)}
                            >
                                <MaterialCommunityIcons name="heart-minus" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </AppCard>
                )}
            />
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    title: { fontSize: 28, fontWeight: "800", marginBottom: 4 },
    subtitle: { fontSize: 14, marginBottom: 16 },
    errorText: { fontSize: 12, fontWeight: "600", marginBottom: 12 },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    emptyContainer: { alignItems: "center", justifyContent: "center", marginTop: 60, paddingHorizontal: 20 },
    emptyTitle: { fontSize: 16, fontWeight: "700", marginTop: 12 },
    emptySubtitle: { fontSize: 13, marginTop: 6, textAlign: "center" },
    ngoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
    ngoInfo: { flex: 1 },
    ngoName: { fontSize: 16, fontWeight: "700" },
    ngoEmail: { fontSize: 12, marginTop: 4 },
    ngoLocation: { fontSize: 12, marginTop: 2 },
    ngoOutline: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1 },
    ngoStatusText: { fontSize: 10, fontWeight: "700" },
    ngoStatus: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
    ngoStatusText2: { fontSize: 10, fontWeight: "700", color: "white" },
    ngoText: { fontSize: 12, fontWeight: "700" },
    ngoId: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
    ngoIdText: { fontSize: 10, fontWeight: "700" },
    ngoIdText2: { fontSize: 10, fontWeight: "700", color: "white" },
    ngoNo: { fontSize: 10 },
    ngoIdNo: { fontSize: 10, color: "white" },
    ngoPhone: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
    ngoPhoneText: { fontSize: 10, fontWeight: "700", color: "white" },
    ngoCheck: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1 },
    ngoCheckText: { fontSize: 11, fontWeight: "700" },
    ngoBadge: { marginLeft: 8 },
    statsRow: { marginVertical: 12, paddingTop: 12, flexDirection: "row", gap: 12 },
    statItem: { flex: 1, alignItems: "center" },
    statValue: { fontSize: 14, fontWeight: "700", marginTop: 4 },
    statLabel: { fontSize: 11, marginTop: 2 },
    actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
    removeButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, justifyContent: "center", alignItems: "center" },
});
