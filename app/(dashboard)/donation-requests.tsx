import { SkeletonCard } from "@/components/SkeletonCard";
import { AppButton, AppCard, AppScreen, EmptyState, StatusBadge } from "@/components/ui";
import { AuthContext } from "@/context/AuthContext";
import { ThemeContext } from "@/context/ThemeContext";
import { donationApi } from "@/lib/api";
import { palette } from "@/lib/theme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View
} from "react-native";

type RequestItem = {
    requestId: number;
    requestStatus: "pending" | "accepted" | "rejected";
    donationId: string;
    donationTitle: string;
    donationImageUrl: string;
    ngoId: number;
    ngoName: string;
    ngoCity: string;
    ngoState: string;
};

export default function DonationRequestsScreen() {
    const router = useRouter();
    const { user } = useContext(AuthContext);
    const { palette: themePalette } = useContext(ThemeContext);

    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    const load = useCallback(async () => {
        if (!user?.id) return;
        try {
            setError("");
            setLoading(true);
            const rows = await donationApi.listRequestsForDonor(user.id);
            setRequests(rows as RequestItem[]);
        } catch (err) {
            console.error(err);
            setError("Failed to load donation requests.");
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    useEffect(() => {
        load();
    }, [load]);

    const acceptRequest = async (requestId: number) => {
        if (!user?.id) return;
        try {
            setActionLoadingId(requestId);
            await donationApi.acceptNgoRequest(requestId, user.id);
            await load();
            Alert.alert("Success", "Request accepted!");
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to accept request.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const rejectRequest = async (requestId: number) => {
        try {
            setActionLoadingId(requestId);
            Alert.alert(
                "Reject Request",
                "Are you sure you want to reject this request?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Reject",
                        style: "destructive",
                        onPress: async () => {
                            try {
                                // Call API to reject the request (if available)
                                // For now, we'll just remove it from the list
                                setRequests((prev) => prev.filter((r) => r.requestId !== requestId));
                                Alert.alert("Success", "Request rejected.");
                            } finally {
                                setActionLoadingId(null);
                            }
                        },
                    },
                ]
            );
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to reject request.");
            setActionLoadingId(null);
        }
    };

    // Filter pending requests only
    const pendingRequests = requests.filter((r) => r.requestStatus === "pending");

    const renderRequest = (item: RequestItem, status: "pending" | "accepted" | "rejected") => (
        <AppCard key={item.requestId}>
            {item.donationImageUrl ? (
                <View style={styles.imageWrap}>
                    <Image source={{ uri: item.donationImageUrl }} style={styles.image} contentFit="cover" />
                </View>
            ) : null}

            <View style={styles.header}>
                <View style={styles.info}>
                    <Text style={[styles.title, { color: themePalette.text }]}>{item.donationTitle}</Text>
                    <Text style={[styles.ngoName, { color: themePalette.muted }]}>{item.ngoName}</Text>
                    <Text style={[styles.location, { color: themePalette.muted }]}>
                        {item.ngoCity}, {item.ngoState}
                    </Text>
                </View>
                <View style={styles.badge}>
                    <StatusBadge
                        status={
                            status === "pending"
                                ? "available"
                                : status === "accepted"
                                    ? "reserved"
                                    : "delivered_to_ngo"
                        }
                    />
                </View>
            </View>

            {status === "pending" && (
                <View style={styles.actions}>
                    <AppButton
                        label="Accept"
                        onPress={() => acceptRequest(item.requestId)}
                        loading={actionLoadingId === item.requestId}
                    />
                    <AppButton
                        label="Reject"
                        variant="ghost"
                        onPress={() => rejectRequest(item.requestId)}
                        loading={actionLoadingId === item.requestId}
                    />
                </View>
            )}

            {status === "accepted" && (
                <View style={[styles.statusLabel, { backgroundColor: themePalette.surface }]}>
                    <Text style={[styles.statusText, { color: themePalette.primary }]}>
                        ✓ Accepted & Awaiting Pickup
                    </Text>
                </View>
            )}

            {status === "rejected" && (
                <View style={[styles.statusLabel, { backgroundColor: themePalette.surface }]}>
                    <Text style={[styles.statusText, { color: themePalette.danger }]}>✕ Rejected</Text>
                </View>
            )}

            <AppButton
                label="View Donation"
                variant="ghost"
                onPress={() =>
                    router.push({ pathname: "/(dashboard)/donation/[id]", params: { id: item.donationId } })
                }
            />
        </AppCard>
    );

    if (loading) {
        return (
            <AppScreen scroll>
                <Text style={[styles.pageTitle, { color: palette.text }]}>Donation Requests</Text>
                <View style={{ gap: 12, marginTop: 16 }}>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </View>
            </AppScreen>
        );
    }

    return (
        <AppScreen scroll={false}>
            <Text style={[styles.pageTitle, { color: palette.text }]}>Donation Requests</Text>

            {error && <Text style={[styles.error, { color: palette.danger }]}>{error}</Text>}

            {pendingRequests.length === 0 ? (
                <EmptyState
                    title="No pending requests"
                    subtitle="All your donation requests have been reviewed."
                />
            ) : (
                <FlatList
                    data={pendingRequests}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    keyExtractor={(item) => String(item.requestId)}
                    contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 20, gap: 12 }}
                    ListHeaderComponent={
                        <View style={styles.requestSummary}>
                            <View style={[styles.summaryCard, { backgroundColor: palette.surface }]}>
                                <Text style={[styles.summaryLabel, { color: palette.muted }]}>Pending</Text>
                                <Text style={[styles.summaryValue, { color: palette.primary }]}>{pendingRequests.length}</Text>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <EmptyState
                            title="No pending requests"
                            subtitle="All your donation requests have been reviewed."
                        />
                    }
                    renderItem={({ item }) => renderRequest(item, "pending")}
                />
            )}
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    pageTitle: {
        fontSize: 28,
        fontWeight: "800",
        marginTop: 20,
        marginBottom: 16,
        marginHorizontal: 14,
    },
    error: {
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 10,
        marginHorizontal: 14,
    },
    requestSummary: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 16,
    },
    summaryCard: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        alignItems: "center",
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 6,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: "800",
    },
    imageWrap: {
        marginBottom: 12,
        borderRadius: 12,
        overflow: "hidden",
    },
    image: {
        width: "100%",
        aspectRatio: 16 / 9,
        backgroundColor: "#E8F9EE",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
        gap: 10,
    },
    info: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 4,
    },
    ngoName: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 2,
    },
    location: {
        fontSize: 12,
    },
    badge: {
        marginTop: 2,
    },
    actions: {
        gap: 8,
        marginBottom: 12,
    },
    statusLabel: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: "center",
    },
    statusText: {
        fontSize: 13,
        fontWeight: "600",
    },
});
