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
import { donationApi } from "@/lib/api";
import { palette } from "@/lib/theme";
import { DonationStatus } from "@/lib/types";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [donations, setDonations] = useState<DonorItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [filter, setFilter] = useState<"all" | DonationStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) return;
    const [donationRows, reqRows] = await Promise.all([
      donationApi.listForDonor(user.id),
      donationApi.listRequestsForDonor(user.id),
    ]);
    setDonations(donationRows as DonorItem[]);
    setRequests(reqRows as RequestItem[]);
  }, [user?.id]);

  const onRefresh = async () => {
    try {
      setError("");
      setRefreshing(true);
      await load();
    } catch (err) {
      console.error(err);
      setError("Unable to refresh donations. Please check your connection.");
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
        setError("Unable to load donations right now.");
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

  const markHandover = async (donationId: string) => {
    await donationApi.updateStatus(donationId, "picked");
    await load();
  };

  return (
    <AppScreen scroll>
      <Text style={styles.title}>Donor Dashboard</Text>
      <Text style={styles.subtitle}>Manage your live donations and incoming NGO requests.</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.statsRow}>
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Available" value={stats.available} />
        <StatCard label="Reserved" value={stats.reserved} />
        <StatCard label="Completed" value={stats.completed} />
      </View>

      <View style={styles.filterRow}>
        {(["all", "available", "reserved", "pickup_assigned", "picked", "delivered_to_ngo", "completed"] as const).map(
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

      <Text style={styles.section}>Incoming NGO Requests</Text>
      <View style={styles.requestsBlock}>
        {!requests.length ? (
          <Text style={styles.noRequestText}>No pending requests yet.</Text>
        ) : (
          requests
            .filter((r) => r.requestStatus === "pending")
            .slice(0, 3)
            .map((r) => (
              <AppCard key={r.requestId}>
                {r.donationImageUrl ? (
                  <View style={styles.requestImageWrap}>
                    <Image source={{ uri: r.donationImageUrl }} style={styles.requestImage} contentFit="cover" />
                  </View>
                ) : null}
                <Text style={styles.reqTitle}>{r.ngoName}</Text>
                <Text style={styles.reqMeta}>
                  {r.ngoCity}, {r.ngoState} requested &quot;{r.donationTitle}&quot;
                </Text>
                <View style={styles.reqActions}>
                  <AppButton
                    label="Accept"
                    onPress={() => acceptNgoRequest(r.requestId)}
                    loading={actionLoadingId === r.requestId}
                  />
                </View>
              </AppCard>
            ))
        )}
      </View>

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
              <AppCard>
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
                {item.status === "pickup_assigned" ? (
                  <View style={styles.handoverBtn}>
                    <AppButton label="Mark Picked Up" onPress={() => markHandover(item.id)} />
                  </View>
                ) : null}
              </AppCard>
            </TouchableOpacity>
          )}
        />
      )}

      <Fab onPress={() => router.push("/(dashboard)/donation/create")} />
    </AppScreen>
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
  title: { fontSize: 30, fontWeight: "800", color: palette.primaryDark, marginTop: 26 },
  subtitle: { color: palette.muted, marginTop: 4, marginBottom: 14 },
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
});
