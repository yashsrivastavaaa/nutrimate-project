import { DonorBadge } from "@/components/DonorBadge";
import { SkeletonCard } from "@/components/SkeletonCard";
import {
  AppButton,
  AppCard,
  AppScreen,
  EmptyState,
  Fab,
  PaginationControls,
  SearchBar,
  StatusBadge,
} from "@/components/ui";
import { AuthContext } from "@/context/AuthContext";
import { ThemeContext } from "@/context/ThemeContext";
import { donationApi } from "@/lib/api";
import { palette } from "@/lib/theme";
import { DonationStatus } from "@/lib/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
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

export default function DonorDashboard() {
  const PAGE_SIZE = 8;
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { palette } = useContext(ThemeContext);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [donations, setDonations] = useState<DonorItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [allNgos, setAllNgos] = useState<any[]>([]);
  const [favoriteNgoIds, setFavoriteNgoIds] = useState<number[]>([]);
  const [filter, setFilter] = useState<"all" | DonationStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"donations" | "ngos">("donations");
  const [inProgressIndex, setInProgressIndex] = useState(0);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const [donationRows, reqRows, ngosData, favNgos] = await Promise.all([
      donationApi.listForDonor(user.id),
      donationApi.listRequestsForDonor(user.id),
      donationApi.getAllApprovedNgosWithCompletedCounts(),
      donationApi.getFavoriteNgos(user.id),
    ]);
    setDonations(donationRows as DonorItem[]);
    setRequests(reqRows as RequestItem[]);
    setAllNgos(ngosData as any[]);
    setFavoriteNgoIds((favNgos as any[]).map((ngo: any) => ngo.ngoId));
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

  const filteredData = useMemo(() => {
    const byStatus = filter === "all" ? donations : donations.filter((d) => d.status === filter);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter((d) =>
      [d.title, d.description ?? "", d.quantity ?? "", d.pickupAddress ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [donations, filter, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [filter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const data = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, page, totalPages]);

  const stats = useMemo(
    () => ({
      total: donations.length,
      available: donations.filter((d) => d.status === "available").length,
      reserved: donations.filter((d) => d.status === "reserved").length,
      completed: donations.filter((d) => d.status === "completed").length,
    }),
    [donations]
  );

  const inProgressDonations = useMemo(
    () => donations.filter((d) => d.status === "reserved" || d.status === "ready" || d.status === "pickup_assigned" || d.status === "awaiting_volunteer_pickup" || d.status === "awaiting_donor_handover"),
    [donations]
  );

  const pendingRequests = useMemo(
    () => requests.filter((r) => r.requestStatus === "pending"),
    [requests]
  );

  const acceptNgoRequest = async (requestId: number) => {
    if (!user?.id) return;
    try {
      setActionLoadingId(requestId);
      await donationApi.acceptNgoRequest(requestId, user.id);
      await load();
    } finally {
      setActionLoadingId(null);
    }
  };

  const markAsReady = async (donationId: string) => {
    if (!user?.id) return;
    try {
      setActionLoadingId(donationId);
      const result = await donationApi.markAsReady(donationId, user.id);
      if (!result.success) {
        setError(result.message || "Failed to mark as ready");
      } else {
        await load();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const markHandover = async (donationId: string) => {
    if (!user?.id) return;
    try {
      setActionLoadingId(donationId);
      const result = await donationApi.markDonorHandover(donationId, user.id);
      if (!result.success) {
        setError(result.message || "Failed to mark handover");
      } else {
        await load();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const toggleFavoriteNgo = async (ngoId: number) => {
    if (!user?.id) return;
    try {
      setActionLoadingId(ngoId);
      await donationApi.toggleFavoriteNgo(user.id, ngoId);
      setFavoriteNgoIds((prev) =>
        prev.includes(ngoId) ? prev.filter((id) => id !== ngoId) : [...prev, ngoId]
      );
    } catch (err) {
      Alert.alert("Error", "Failed to update favorite status");
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <AppScreen scroll={activeTab === "donations"}>
        <Text style={styles.title}>Donor Dashboard</Text>
        <Text style={styles.subtitle}>Manage your live donations and incoming NGO requests.</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {pendingRequests.length > 0 ? (
          <View style={[styles.alertBox, { backgroundColor: palette.primary + "20", borderColor: palette.primary }]}>
            <MaterialCommunityIcons name="bell-alert" size={24} color={palette.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ ...styles.alertTitle, color: palette.primary, fontWeight: "700" }}>
                You have {pendingRequests.length} pending {pendingRequests.length === 1 ? "request" : "requests"}!
              </Text>
              <Text style={{ ...styles.alertSubtitle, color: palette.muted }}>
                NGOs are waiting for your response
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(dashboard)/donation-requests" as any)}
              style={[styles.viewBtn, { backgroundColor: palette.primary }]}
            >
              <Text style={styles.viewBtnText}>View</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {inProgressDonations.length > 0 ? (
          <View style={[styles.alertBox, { backgroundColor: "#FFA50020", borderColor: "#FFA500" }]}>
            <MaterialCommunityIcons name="progress-clock" size={24} color="#FFA500" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ ...styles.alertTitle, color: "#FFA500", fontWeight: "700" }}>
                {inProgressDonations.length} donation{inProgressDonations.length === 1 ? "" : "s"} in progress!
              </Text>
              <Text style={{ ...styles.alertSubtitle, color: palette.muted }}>
                Being picked up or delivered
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(dashboard)/donations-in-progress" as any)}
              style={[styles.viewBtn, { backgroundColor: "#FFA500" }]}
            >
              <Text style={styles.viewBtnText}>View</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.buttonRow}>
          <View style={{ flex: 1 }}>
            <AppButton
              label="🏆 View Leaderboard"
              onPress={() => router.push("/(dashboard)/leaderboard" as any)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppButton
              label={`📋 View Requests (${pendingRequests.length})`}
              onPress={() => router.push("/(dashboard)/donation-requests" as any)}
            />
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={{ ...styles.tabContainer, borderBottomColor: palette.border }}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "donations" && styles.tabActive]}
            onPress={() => setActiveTab("donations")}
          >
            <MaterialCommunityIcons
              name="gift"
              size={20}
              color={activeTab === "donations" ? palette.primary : palette.muted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "donations" && { color: palette.primary, fontWeight: "700" },
              ]}
            >
              My Donations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "ngos" && styles.tabActive]}
            onPress={() => setActiveTab("ngos")}
          >
            <MaterialCommunityIcons
              name="domain"
              size={20}
              color={activeTab === "ngos" ? palette.primary : palette.muted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "ngos" && { color: palette.primary, fontWeight: "700" },
              ]}
            >
              Discover NGOs
            </Text>
          </TouchableOpacity>
        </View>

        {/* Donations Tab Content */}
        {activeTab === "donations" && (
          <>
            <View style={styles.statsRow}>
              <StatCard label="Total" value={stats.total} />
              <StatCard label="Available" value={stats.available} />
              <StatCard label="Reserved" value={stats.reserved} />
              <StatCard label="Completed" value={stats.completed} />
            </View>

            <View style={styles.filterRow}>
              {(["all", "available", "reserved", "ready", "pickup_assigned", "awaiting_volunteer_pickup", "awaiting_donor_handover", "picked", "delivered_to_ngo", "completed"] as const).map(
                (f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterChip, filter === f && styles.filterChipActive]}
                    onPress={() => setFilter(f)}
                  >
                    <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search title, quantity, address..."
            />

            <Text style={styles.section}>All Donations</Text>

            {loading ? (
              <View style={{ gap: 12 }}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            ) : (
              <FlatList
                data={data}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                keyExtractor={(item) => item.id}
                initialNumToRender={4}
                windowSize={7}
                removeClippedSubviews
                contentContainerStyle={{ paddingBottom: 120, gap: 10 }}
                ListHeaderComponent={
                  <PaginationControls
                    page={Math.min(page, totalPages)}
                    totalPages={totalPages}
                    onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
                    onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  />
                }
                ListEmptyComponent={
                  <EmptyState
                    title="No donations found"
                    subtitle="Create your first donation from the + button."
                  />
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => router.push({ pathname: "/(dashboard)/donation/[id]", params: { id: item.id } })}
                  >
                    <AppCard
                      badge={
                        user ? (
                          <DonorBadge
                            isVerified={(user.isVerified as number) === 1}
                            donationCount={user.donationCount as number}
                            size="small"
                          />
                        ) : null
                      }
                    >
                      {item.imageUrl ? (
                        <View style={styles.cardImageWrap}>
                          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} contentFit="cover" />
                        </View>
                      ) : null}
                      <View style={styles.cardTop}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <StatusBadge status={item.status} />
                      </View>
                      <Text style={styles.cardMeta}>{item.quantity ?? "Quantity not set"}</Text>
                      <Text style={styles.cardMeta}>{item.pickupAddress ?? "Address not set"}</Text>
                      {item.status === "reserved" ? (
                        <View style={styles.handoverBtn}>
                          <AppButton
                            label="Mark as Ready"
                            onPress={() => markAsReady(item.id)}
                            loading={actionLoadingId === item.id}
                          />
                        </View>
                      ) : item.status === "ready" ? (
                        <View style={styles.handoverBtn}>
                          <AppButton
                            label="Mark as Handover"
                            onPress={() => markHandover(item.id)}
                            loading={actionLoadingId === item.id}
                          />
                        </View>
                      ) : item.status === "pickup_assigned" ? (
                        <View style={styles.handoverBtn}>
                          <AppButton
                            label="Mark as Handover"
                            onPress={() => markHandover(item.id)}
                            loading={actionLoadingId === item.id}
                          />
                        </View>
                      ) : item.status === "awaiting_donor_handover" ? (
                        <View style={styles.handoverBtn}>
                          <AppButton
                            label="Confirm Handover"
                            onPress={() => markHandover(item.id)}
                            loading={actionLoadingId === item.id}
                          />
                        </View>
                      ) : null}
                    </AppCard>
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        )}

        {/* NGOs Tab Content */}
        {activeTab === "ngos" && (
          <>
            {loading ? (
              <View style={{ gap: 12, marginTop: 16 }}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            ) : allNgos.length === 0 ? (
              <EmptyState title="No NGOs found" subtitle="Check back soon for available NGOs." />
            ) : (
              <FlatList
                scrollEnabled
                data={allNgos}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                keyExtractor={(item) => String(item.ngoId)}
                contentContainerStyle={{ paddingBottom: 120, gap: 10, marginTop: 12 }}
                ListEmptyComponent={
                  <EmptyState title="No NGOs found" subtitle="Check back soon for available NGOs." />
                }
                renderItem={({ item }) => (
                  <AppCard>
                    <View style={styles.ngoCardHeader}>
                      <View style={styles.ngoNameSection}>
                        <Text style={[styles.ngoName, { color: palette.text }]}>{item.ngoName}</Text>
                        {item.status === "approved" && (
                          <MaterialCommunityIcons name="check-circle" size={18} color={palette.primary} />
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => toggleFavoriteNgo(item.ngoId)}
                        disabled={actionLoadingId === item.ngoId}
                      >
                        <MaterialCommunityIcons
                          name={favoriteNgoIds.includes(item.ngoId) ? "heart" : "heart-outline"}
                          size={24}
                          color={favoriteNgoIds.includes(item.ngoId) ? palette.danger : palette.muted}
                        />
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.ngoMeta, { color: palette.muted }]}>{item.email}</Text>
                    <Text style={[styles.ngoMeta, { color: palette.muted }]}>
                      {item.city}, {item.state}
                    </Text>

                    {item.description && (
                      <Text style={[styles.ngoDescription, { color: palette.text }]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}

                    <View style={styles.ngoStats}>
                      <View style={[styles.ngoStatItem, { backgroundColor: palette.surface }]}>
                        <MaterialCommunityIcons name="account-multiple" size={16} color={palette.primary} />
                        <Text style={[styles.ngoStatText, { color: palette.muted }]}>Families: {item.completedCount || 0}</Text>
                      </View>
                      <View style={[styles.ngoStatItem, { backgroundColor: palette.surface }]}>
                        <MaterialCommunityIcons name="gift" size={16} color={palette.primary} />
                        <Text style={[styles.ngoStatText, { color: palette.muted }]}>Completed: {item.completedCount || 0}</Text>
                      </View>
                    </View>

                    <AppButton
                      label="View Profile"
                      onPress={() => router.push({ pathname: "/(dashboard)/ngo-profile", params: { ngoId: item.ngoId } } as any)}
                    />
                  </AppCard>
                )}
              />
            )}
          </>
        )}
      </AppScreen>

      <View style={styles.fabContainer}>
        <Fab onPress={() => router.push("/(dashboard)/donation/create")} />
      </View>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, position: "relative" },
  title: { fontSize: 30, fontWeight: "800", color: palette.primaryDark, marginTop: 26 },
  subtitle: { color: palette.muted, marginTop: 4, marginBottom: 14 },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 2,
    padding: 14,
    marginBottom: 14,
  },
  alertTitle: {
    fontSize: 14,
  },
  alertSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  viewBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
  },
  buttonRow: { flexDirection: "row", gap: 8, marginBottom: 12, width: "100%" },
  fabContainer: { position: "absolute", bottom: 20, right: 14, zIndex: 999, width: 56, height: 56 },
  statsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  statCard: {
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 10,
    alignItems: "center",
    flex: 1,
    minWidth: "47%",
  },
  statNumber: { fontSize: 18, fontWeight: "800", color: palette.primaryDark },
  statLabel: { color: palette.muted, fontSize: 12, marginTop: 2 },
  filterRow: { flexDirection: "row", gap: 7, flexWrap: "wrap", marginBottom: 12 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#E9EFEA" },
  filterChipActive: { backgroundColor: palette.primary },
  filterText: { fontSize: 11, color: "#334155", fontWeight: "600" },
  filterTextActive: { color: "#fff" },
  section: { fontSize: 15, fontWeight: "700", color: palette.text, marginTop: 2, marginBottom: 8 },
  requestsBlock: { gap: 8, marginBottom: 8 },
  noRequestText: { color: palette.muted, fontSize: 13 },
  reqTitle: { fontSize: 16, fontWeight: "700", color: palette.text },
  reqMeta: { marginTop: 4, color: palette.muted, fontSize: 13 },
  reqActions: { marginTop: 10 },
  requestImageWrap: { marginBottom: 10, borderRadius: 14, overflow: "hidden" },
  requestImage: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#E8F9EE" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: palette.text, flex: 1 },
  cardMeta: { marginTop: 6, color: palette.muted, fontSize: 13 },
  handoverBtn: { marginTop: 10 },
  cardImageWrap: { marginBottom: 10, borderRadius: 14, overflow: "hidden" },
  cardImage: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#E8F9EE" },
  errorText: { color: palette.danger, fontSize: 12, fontWeight: "700", marginBottom: 10 },
  // Tab Styles
  tabContainer: { flexDirection: "row", borderBottomWidth: 1, marginBottom: 14, marginTop: 12 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, gap: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: palette.primary },
  tabText: { fontSize: 14, color: palette.muted, fontWeight: "600" },
  // NGO Card Styles
  ngoCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  ngoNameSection: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  ngoName: { fontSize: 16, fontWeight: "700" },
  ngoMeta: { fontSize: 13, marginTop: 4 },
  ngoDescription: { fontSize: 13, marginTop: 8, lineHeight: 18 },
  ngoStats: { flexDirection: "row", gap: 8, marginVertical: 10 },
  ngoStatItem: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, gap: 6 },
  ngoStatText: { fontSize: 12, fontWeight: "600" },
});
