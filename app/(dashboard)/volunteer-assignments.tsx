import { AppCard } from "@/components/ui/AppCard";
import { AppScreen } from "@/components/ui/AppScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { AuthContext } from "@/context/AuthContext";
import { ThemeContext } from "@/context/ThemeContext";
import { donationApi } from "@/lib/api/donation";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useContext, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ListRenderItemInfo,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface AssignedDonation {
    id: string;
    title: string;
    quantity: string | null;
    pickupAddress: string | null;
    contactNumber: string | null;
    status: string;
    ngoName?: string;
    createdAt: Date;
}

export default function VolunteerAssignmentsScreen() {
    const { palette } = useContext(ThemeContext);
    const { user } = useContext(AuthContext);
    const [donations, setDonations] = useState<AssignedDonation[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        const loadAssignments = async () => {
            if (!user?.id) return;

            try {
                setLoading(true);
                const data = await donationApi.listVolunteerAssigned(user.id);
                setDonations(data as AssignedDonation[]);
            } catch (error) {
                Alert.alert("Error", "Failed to load assignments");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        loadAssignments();
    }, [user]);

    const handlePickup = async (donationId: string, title: string) => {
        Alert.alert(
            "Confirm Pickup",
            `Mark "${title}" as picked up?`,
            [
                { text: "Cancel", onPress: () => { } },
                {
                    text: "Confirm",
                    onPress: async () => {
                        try {
                            setUpdatingId(donationId);
                            await donationApi.markPicked(donationId, user!.id);
                            setDonations((prev) =>
                                prev.map((d) =>
                                    d.id === donationId ? { ...d, status: "picked" } : d
                                )
                            );
                        } catch (error) {
                            Alert.alert("Error", "Failed to update status");
                            console.error(error);
                        } finally {
                            setUpdatingId(null);
                        }
                    },
                },
            ]
        );
    };

    const handleDeliver = async (donationId: string, title: string) => {
        Alert.alert(
            "Confirm Delivery",
            `Mark "${title}" as delivered to NGO?`,
            [
                { text: "Cancel", onPress: () => { } },
                {
                    text: "Confirm",
                    onPress: async () => {
                        try {
                            setUpdatingId(donationId);
                            await donationApi.markDeliveredToNgo(donationId, user!.id);
                            setDonations((prev) =>
                                prev.map((d) =>
                                    d.id === donationId ? { ...d, status: "delivered_to_ngo" } : d
                                )
                            );
                        } catch (error) {
                            Alert.alert("Error", "Failed to update status");
                            console.error(error);
                        } finally {
                            setUpdatingId(null);
                        }
                    },
                },
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pickup_assigned":
                return palette.primary;
            case "picked":
                return "#FF9800";
            case "delivered_to_ngo":
                return palette.primaryDark;
            default:
                return palette.muted;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "pickup_assigned":
                return "Pickup Assigned";
            case "picked":
                return "Picked Up";
            case "delivered_to_ngo":
                return "Delivered to NGO";
            default:
                return status;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "pickup_assigned":
                return "map-marker";
            case "picked":
                return "check-circle";
            case "delivered_to_ngo":
                return "hospital-box";
            default:
                return "information";
        }
    };

    const renderAssignment = ({ item }: ListRenderItemInfo<AssignedDonation>) => (
        <AppCard variant="compact">
            <View style={styles.assignmentHeader}>
                <View style={styles.titleSection}>
                    <Text style={[styles.title, { color: palette.text }]} numberOfLines={2}>
                        {item.title}
                    </Text>
                    {item.ngoName && (
                        <Text style={[styles.ngoName, { color: palette.muted }]}>{item.ngoName}</Text>
                    )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <MaterialCommunityIcons
                        name={getStatusIcon(item.status) as any}
                        size={14}
                        color="white"
                    />
                    <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                </View>
            </View>

            {item.quantity && (
                <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="package" size={16} color={palette.primary} />
                    <Text style={[styles.detailText, { color: palette.text }]}>{item.quantity}</Text>
                </View>
            )}

            {item.pickupAddress && (
                <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="map-marker" size={16} color={palette.primary} />
                    <Text style={[styles.detailText, { color: palette.text }]} numberOfLines={2}>
                        {item.pickupAddress}
                    </Text>
                </View>
            )}

            {item.contactNumber && (
                <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="phone" size={16} color={palette.primary} />
                    <Text style={[styles.detailText, { color: palette.text }]}>{item.contactNumber}</Text>
                </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
                {item.status === "pickup_assigned" && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: palette.primary }]}
                        onPress={() => handlePickup(item.id, item.title)}
                        disabled={updatingId === item.id}
                    >
                        {updatingId === item.id ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="check" size={16} color="white" />
                                <Text style={styles.actionButtonText}>Mark Picked</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {item.status === "picked" && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: palette.primaryDark }]}
                        onPress={() => handleDeliver(item.id, item.title)}
                        disabled={updatingId === item.id}
                    >
                        {updatingId === item.id ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="hospital-box" size={16} color="white" />
                                <Text style={styles.actionButtonText}>Mark Delivered</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {item.status === "delivered_to_ngo" && (
                    <View style={[styles.completedButton, { backgroundColor: palette.primaryDark }]}>
                        <MaterialCommunityIcons name="check-all" size={16} color="white" />
                        <Text style={styles.actionButtonText}>Completed</Text>
                    </View>
                )}
            </View>
        </AppCard>
    );

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
        <AppScreen>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <Text style={[styles.pageTitle, { color: palette.text }]}>My Assignments</Text>

                {donations.length === 0 ? (
                    <EmptyState
                        title="No Assignments Yet"
                        subtitle="When you're assigned a donation pickup, it will appear here. Stay tuned!"
                        icon="package-outline"
                    />
                ) : (
                    <FlatList
                        data={donations}
                        renderItem={renderAssignment}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                        contentContainerStyle={styles.listContainer}
                    />
                )}
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 14,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    pageTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 16,
    },
    listContainer: {
        gap: 10,
        paddingBottom: 20,
    },
    assignmentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 10,
        gap: 10,
    },
    titleSection: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: "600",
    },
    ngoName: {
        fontSize: 12,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    statusText: {
        color: "white",
        fontSize: 11,
        fontWeight: "600",
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    detailText: {
        fontSize: 12,
        flex: 1,
    },
    actionContainer: {
        marginTop: 12,
        gap: 8,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 6,
    },
    completedButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 6,
        opacity: 0.7,
    },
    actionButtonText: {
        color: "white",
        fontSize: 12,
        fontWeight: "600",
    },
});
