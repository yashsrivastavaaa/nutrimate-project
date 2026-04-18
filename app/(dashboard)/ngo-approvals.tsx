import { AppCard, AppScreen, SkeletonList } from "@/components/ui";
import { authApi } from "@/lib/api";
import { palette } from "@/lib/theme";
import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function NgoApprovalsScreen() {
    const PAGE_SIZE = 10;
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [allNgos, setAllNgos] = useState<any[]>([]);
    const [approvalLoading, setApprovalLoading] = useState<number | null>(null);

    const load = useCallback(async () => {
        try {
            const pending_ngos = await authApi.getPendingNgoApprovals();
            setAllNgos(pending_ngos);
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to load pending NGOs");
        }
    }, []);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                await load();
            } finally {
                setLoading(false);
            }
        })();
    }, [load]);

    const onRefresh = async () => {
        try {
            setRefreshing(true);
            await load();
        } finally {
            setRefreshing(false);
        }
    };

    const onApproveNgo = async (ngoId: number, ngoName: string) => {
        try {
            setApprovalLoading(ngoId);
            await authApi.approveNgo(ngoId);
            Alert.alert("Success", `✓ ${ngoName} has been approved and can now login.`);
            await load();
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to approve NGO. Please try again.");
        } finally {
            setApprovalLoading(null);
        }
    };

    const onRejectNgo = async (ngoId: number, ngoName: string) => {
        Alert.alert(
            "Reject NGO",
            `Are you sure you want to reject ${ngoName}? They will not be able to login.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reject",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setApprovalLoading(ngoId);
                            await authApi.rejectNgo(ngoId);
                            Alert.alert("Success", `✗ ${ngoName} has been rejected and cannot login.`);
                            await load();
                        } catch (e) {
                            console.error(e);
                            Alert.alert("Error", "Failed to reject NGO. Please try again.");
                        } finally {
                            setApprovalLoading(null);
                        }
                    },
                },
            ]
        );
    };

    const totalPages = Math.max(1, Math.ceil(allNgos.length / PAGE_SIZE));
    const pageData = allNgos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <AppScreen>
            <FlatList
                data={pageData}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                keyExtractor={(item) => item.ngoId.toString()}
                contentContainerStyle={{ paddingBottom: 60, gap: 12, padding: 16 }}
                ListHeaderComponent={
                    <View>
                        <Text style={styles.title}>NGO Approvals</Text>
                        <Text style={styles.subtitle}>Review and approve pending NGO registrations</Text>
                        {allNgos.length > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{allNgos.length} Pending</Text>
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    loading ? (
                        <SkeletonList count={4} />
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>✓</Text>
                            <Text style={styles.emptyText}>All NGOs Approved</Text>
                            <Text style={styles.emptySubtext}>No pending NGO registrations</Text>
                        </View>
                    )
                }
                renderItem={({ item }) => (
                    <AppCard>
                        <View style={styles.ngoHeader}>
                            <View style={styles.ngoInfo}>
                                <Text style={styles.ngoName}>{item.ngoName}</Text>
                                <Text style={styles.ngoEmail}>{item.email}</Text>
                            </View>
                            <Text style={styles.statusBadge}>PENDING</Text>
                        </View>

                        <View style={styles.ngoDetails}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>📍 Location:</Text>
                                <Text style={styles.detailValue}>
                                    {item.city}, {item.state}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>🏢 Address:</Text>
                                <Text style={styles.detailValue}>{item.addressLine1}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>📅 Applied:</Text>
                                <Text style={styles.detailValue}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                            </View>
                        </View>

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.approveBtn, approvalLoading === item.ngoId && styles.buttonDisabled]}
                                onPress={() => onApproveNgo(item.ngoId, item.ngoName)}
                                disabled={approvalLoading === item.ngoId}
                            >
                                <Text style={styles.approveBtnText}>✓ Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.rejectBtn, approvalLoading === item.ngoId && styles.buttonDisabled]}
                                onPress={() => onRejectNgo(item.ngoId, item.ngoName)}
                                disabled={approvalLoading === item.ngoId}
                            >
                                <Text style={styles.rejectBtnText}>✗ Reject</Text>
                            </TouchableOpacity>
                        </View>
                    </AppCard>
                )}
                scrollEnabled={true}
            />
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    title: { fontSize: 28, fontWeight: "800", color: palette.primaryDark, marginBottom: 8 },
    subtitle: { fontSize: 14, color: palette.muted, marginBottom: 16 },
    badge: {
        backgroundColor: palette.danger,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        alignSelf: "flex-start",
        marginBottom: 16,
    },
    badgeText: { fontSize: 12, fontWeight: "700", color: "#fff" },
    emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 16, fontWeight: "700", color: palette.text },
    emptySubtext: { fontSize: 14, color: palette.muted, marginTop: 4 },
    ngoHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    ngoInfo: { flex: 1 },
    ngoName: { fontSize: 16, fontWeight: "700", color: palette.text },
    ngoEmail: { fontSize: 12, color: palette.muted, marginTop: 4 },
    statusBadge: {
        backgroundColor: "#FEF3C7",
        color: "#92400E",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 10,
        fontWeight: "700",
    },
    ngoDetails: { gap: 8, marginBottom: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: palette.border },
    detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    detailLabel: { fontSize: 13, fontWeight: "600", color: palette.text, minWidth: 80 },
    detailValue: { fontSize: 13, color: palette.muted, flex: 1 },
    actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
    approveBtn: {
        flex: 1,
        backgroundColor: palette.primary,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    approveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    rejectBtn: {
        flex: 1,
        backgroundColor: palette.danger,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    rejectBtnDisabled: { opacity: 0.6 },
    rejectBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    buttonDisabled: { opacity: 0.6 },
});
