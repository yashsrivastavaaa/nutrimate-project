import {
  AppCard,
  AppScreen,
  PaginationControls,
  SearchBar,
  SkeletonList,
  StatusBadge
} from "@/components/ui";
import { AuthContext } from "@/context/AuthContext";
import { authApi, donationApi } from "@/lib/api";
import { palette } from "@/lib/theme";
import { DonationStatus } from "@/lib/types";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type AdminDonation = {
  id: string;
  title: string;
  pickupAddress: string | null;
  quantity: string | null;
  imageUrl: string;
  status: DonationStatus;
};

export default function AdminDashboard() {
  const router = useRouter();
  const { ngoSession } = useContext(AuthContext);
  const PAGE_SIZE = 10;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [allDonations, setAllDonations] = useState<AdminDonation[]>([]);
  const [pendingNgoCount, setPendingNgoCount] = useState(0);
  const [stats, setStats] = useState({ users: 0, ngos: 0, volunteers: 0, donations: 0 });

  const load = useCallback(async () => {
    const [users, ngos, volunteers, donations] = await Promise.all([
      donationApi.listUsers(),
      donationApi.listNgos(),
      donationApi.listVolunteers(),
      donationApi.listAllForAdmin(),
    ]);
    setStats({
      users: users.length,
      ngos: ngos.length,
      volunteers: volunteers.length,
      donations: donations.length,
    });
    setAllDonations(donations as AdminDonation[]);

    // Get count of pending NGOs
    const pending_ngos = await authApi.getPendingNgoApprovals();
    setPendingNgoCount(pending_ngos.length);
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

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allDonations;
    return allDonations.filter((item) =>
      [item.title, item.quantity ?? "", item.pickupAddress ?? "", item.status, item.id]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [allDonations, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page, totalPages]);

  return (
    <AppScreen scroll>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>High level visibility and searchable donations feed.</Text>

      {loading ? (
        <SkeletonList count={6} />
      ) : (
        <>
          {/* NGO Approvals Card */}
          {pendingNgoCount > 0 && (
            <TouchableOpacity style={styles.ngoApprovalCard} onPress={() => router.push("/(dashboard)/ngo-approvals")}>
              <View style={styles.ngoCardContent}>
                <Text style={styles.ngoCardIcon}>📋</Text>
                <View style={styles.ngoCardText}>
                  <Text style={styles.ngoCardTitle}>NGO Approvals</Text>
                  <Text style={styles.ngoCardSubtitle}>{pendingNgoCount} pending registrations</Text>
                </View>
              </View>
              <Text style={styles.ngoCardArrow}>→</Text>
            </TouchableOpacity>
          )}

          {/* Donations FlatList */}
          <FlatList
            data={pageData}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 60, gap: 10 }}
            ListHeaderComponent={
              <View>
                <View style={styles.grid}>
                  <Metric label="Users" value={stats.users} />
                  <Metric label="NGOs" value={stats.ngos} />
                  <Metric label="Volunteers" value={stats.volunteers} />
                  <Metric label="Donations" value={stats.donations} />
                </View>
                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by id, title, status, location..."
                />
                <PaginationControls
                  page={Math.min(page, totalPages)}
                  totalPages={totalPages}
                  onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
                  onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                />
                <Text style={styles.sectionTitle}>Donations</Text>
              </View>
            }
            ListEmptyComponent={<Text style={styles.empty}>No donations matched your search.</Text>}
            renderItem={({ item }) => (
              <AppCard>
                {item.imageUrl ? (
                  <View style={styles.imageWrap}>
                    <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" />
                  </View>
                ) : null}
                <Text style={styles.donationTitle}>{item.title}</Text>
                <Text style={styles.meta}>ID: {item.id}</Text>
                <Text style={styles.meta}>{item.quantity ?? "Quantity not set"}</Text>
                <Text style={styles.meta}>{item.pickupAddress ?? "Address not set"}</Text>
                <View style={{ marginTop: 8 }}>
                  <StatusBadge status={item.status} />
                </View>
              </AppCard>
            )}
          />
        </>
      )}
    </AppScreen>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <AppCard>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: "800", color: palette.primaryDark, marginTop: 26 },
  subtitle: { color: palette.muted, marginTop: 5, marginBottom: 14 },
  grid: { gap: 10, marginBottom: 12 },
  metricValue: { fontSize: 30, fontWeight: "800", color: palette.primaryDark },
  metricLabel: { marginTop: 4, color: palette.muted, fontWeight: "600" },
  sectionTitle: { marginTop: 14, marginBottom: 8, fontSize: 16, fontWeight: "700", color: palette.text },
  ngoApprovalCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    padding: 16,
    marginBottom: 20,
  },
  ngoCardContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  ngoCardIcon: { fontSize: 28, marginRight: 12 },
  ngoCardText: { flex: 1 },
  ngoCardTitle: { fontSize: 15, fontWeight: "700", color: palette.text },
  ngoCardSubtitle: { fontSize: 13, color: "#92400E", marginTop: 4 },
  ngoCardArrow: { fontSize: 20, color: "#D97706", fontWeight: "700" },
  donationTitle: { fontSize: 16, fontWeight: "700", color: palette.text },
  meta: { marginTop: 5, color: palette.muted, fontSize: 13 },
  empty: { textAlign: "center", color: palette.muted, marginTop: 24 },
  imageWrap: { marginBottom: 10, borderRadius: 14, overflow: "hidden" },
  image: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#E8F9EE" },
});

