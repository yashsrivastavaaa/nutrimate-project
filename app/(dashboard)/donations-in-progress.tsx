import { SkeletonCard } from "@/components/SkeletonCard";
import { AppButton, AppCard, AppScreen, EmptyState, StatusBadge } from "@/components/ui";
import { AuthContext } from "@/context/AuthContext";
import { ThemeContext } from "@/context/ThemeContext";
import { donationApi } from "@/lib/api";
import { DonationStatus } from "@/lib/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";

type DonorItem = {
    id: string;
    title: string;
    description: string | null;
    quantity: string | null;
    pickupAddress: string | null;
    imageUrl: string;
    status: DonationStatus;
    createdAt: Date | null;
};

export default function DonationsInProgressScreen() {
    const router = useRouter();
    const { user } = useContext(AuthContext);
    const { palette } = useContext(ThemeContext);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [donations, setDonations] = useState<DonorItem[]>([]);
    const [error, setError] = useState("");
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!user?.id) return;
        const donationRows = await donationApi.listForDonor(user.id);
        const inProgress = (donationRows as DonorItem[]).filter(
            (d) => d.status === "reserved" || d.status === "ready" || d.status === "pickup_assigned" || d.status === "awaiting_volunteer_pickup" || d.status === "awaiting_donor_handover"
        );
        setDonations(inProgress);
    }, [user?.id]);

    const onRefresh = async () => {
        try {
            setError("");
            setRefreshing(true);
            await load();
        } catch (err) {
            console.error(err);
            setError("Failed to refresh. Please check your internet connection and try again.");
        } finally {
            setRefreshing(false);
        }
    };

    const updateStatus = async (donationId: string, newStatus: DonationStatus) => {
        try {
            setActionLoadingId(donationId);
            await donationApi.updateStatus(donationId, newStatus);
            await load();
        } catch (err) {
            console.error(err);
            setError("Failed to update status. Please try again.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const markAsReady = async (donationId: string) => {
        try {
            setActionLoadingId(donationId);
            if (!user?.id) return;
            const result = await donationApi.markAsReady(donationId, user.id);
            if (!result.success) {
                setError(result.message || "Failed to mark as ready");
            } else {
                await load();
            }
        } catch (err) {
            console.error(err);
            setError("Failed to mark as ready. Please try again.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const markHandover = async (donationId: string) => {
        try {
            setActionLoadingId(donationId);
            if (!user?.id) return;
            const result = await donationApi.markDonorHandover(donationId, user.id);
            if (!result.success) {
                setError(result.message || "Failed to mark handover");
            } else {
                await load();
            }
        } catch (err) {
            console.error(err);
            setError("Failed to mark handover. Please try again.");
        } finally {
            setActionLoadingId(null);
        }
    };

    useEffect(() => {
        (async () => {
            try {
                setError("");
                setLoading(true);
                await load();
            } catch (err) {
                console.error(err);
                setError("Unable to load donations. Please check your connection or try again later.");
            } finally {
                setLoading(false);
            }
        })();
    }, [load]);

    return (
        <AppScreen scroll={false}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <MaterialCommunityIcons
                        name="arrow-left"
                        size={24}
                        color={palette.text}
                        onPress={() => router.back()}
                        style={{ paddingRight: 12 }}
                    />
                    <View>
                        <Text style={{ ...styles.title, color: palette.text }}>In Progress</Text>
                        <Text style={{ ...styles.subtitle, color: palette.muted }}>
                            {donations.length} donation{donations.length === 1 ? "" : "s"}
                        </Text>
                    </View>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {loading ? (
                    <View style={{ gap: 12, paddingHorizontal: 14 }}>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </View>
                ) : (
                    <FlatList
                        data={donations}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 14, gap: 10 }}
                        ListEmptyComponent={
                            <EmptyState
                                title="No donations in progress"
                                subtitle="Your donations will appear here when they're being picked up or delivered."
                            />
                        }
                        renderItem={({ item }) => (
                            <AppCard>
                                {item.imageUrl ? (
                                    <View style={styles.cardImageWrap}>
                                        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} contentFit="cover" />
                                    </View>
                                ) : null}
                                <Text style={{ ...styles.cardTitle, color: palette.text }}>{item.title}</Text>
                                <Text style={{ ...styles.meta, color: palette.muted }}>{item.quantity ?? "Quantity not set"}</Text>
                                <Text style={{ ...styles.meta, color: palette.muted }}>
                                    {item.pickupAddress ?? "Address not set"}
                                </Text>
                                <View style={styles.statusRow}>
                                    <StatusBadge status={item.status} />
                                    <Text style={{ ...styles.statusInfo, color: palette.muted }}>
                                        {item.status === "reserved" ? "Awaiting donor approval"
                                            : item.status === "ready" ? "Ready for pickup"
                                                : item.status === "pickup_assigned" ? "Being picked up"
                                                    : item.status === "awaiting_volunteer_pickup" ? "Waiting for volunteer to confirm"
                                                        : item.status === "awaiting_donor_handover" ? "Waiting for donor to confirm"
                                                            : "In progress"}
                                    </Text>
                                </View>
                                {item.status === "reserved" && (
                                    <View style={styles.actionBtn}>
                                        <AppButton
                                            label="Mark as Ready"
                                            onPress={() => markAsReady(item.id)}
                                            loading={actionLoadingId === item.id}
                                        />
                                    </View>
                                )}
                                {item.status === "ready" && (
                                    <View style={styles.actionBtn}>
                                        <AppButton
                                            label="Mark as Handover"
                                            onPress={() => markHandover(item.id)}
                                            loading={actionLoadingId === item.id}
                                        />
                                    </View>
                                )}
                                {item.status === "pickup_assigned" && (
                                    <View style={styles.actionBtn}>
                                        <AppButton
                                            label="Mark as Handover"
                                            onPress={() => markHandover(item.id)}
                                            loading={actionLoadingId === item.id}
                                        />
                                    </View>
                                )}
                                {item.status === "awaiting_donor_handover" && (
                                    <View style={styles.actionBtn}>
                                        <AppButton
                                            label="Confirm Handover"
                                            onPress={() => markHandover(item.id)}
                                            loading={actionLoadingId === item.id}
                                        />
                                    </View>
                                )}
                            </AppCard>
                        )}
                    />
                )}
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    title: { fontSize: 22, fontWeight: "700" },
    subtitle: { fontSize: 13, marginTop: 2 },
    errorText: {
        color: "#EF4444",
        fontSize: 14,
        fontWeight: "500",
        paddingHorizontal: 14,
        marginVertical: 10,
    },
    cardImageWrap: { marginBottom: 10, borderRadius: 14, overflow: "hidden", height: 200 },
    cardImage: { width: "100%", height: "100%" },
    cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
    meta: { fontSize: 13, marginBottom: 4 },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 12,
    },
    statusInfo: {
        fontSize: 12,
        fontWeight: "600",
    },
    actionBtn: { marginTop: 12 },
});
