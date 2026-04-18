import { SkeletonCard } from "@/components/SkeletonCard";
import {
  AppButton,
  AppCard,
  AppInput,
  AppScreen,
  EmptyState,
  PaginationControls,
  SearchBar,
  StatusBadge,
} from "@/components/ui";
import { AuthContext } from "@/context/AuthContext";
import { authApi, donationApi } from "@/lib/api";
import { palette } from "@/lib/theme";
import { DonationStatus } from "@/lib/types";
import { Image } from "expo-image";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type DonationItem = {
  id: string;
  title: string;
  quantity: string | null;
  pickupAddress: string | null;
  imageUrl: string;
  status: DonationStatus;
};

export default function NgoDashboard() {
  const PAGE_SIZE = 8;
  const { ngoSession } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mainTab, setMainTab] = useState<"donations" | "volunteers">("donations");
  const [activeTab, setActiveTab] = useState<"available" | "accepted" | "completed">("available");
  const [available, setAvailable] = useState<DonationItem[]>([]);
  const [accepted, setAccepted] = useState<DonationItem[]>([]);
  const [completed, setCompleted] = useState<DonationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [volunteerEmail, setVolunteerEmail] = useState("");
  const [volunteerLoading, setVolunteerLoading] = useState(false);
  const [volunteers, setVolunteers] = useState<
    { volunteerId: number; fullName: string; email: string; phone: string | null }[]
  >([]);
  const [volunteerError, setVolunteerError] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!ngoSession?.ngoId) return;
    const [availableRows, acceptedRows, completedRows] = await Promise.all([
      donationApi.listAvailable(),
      donationApi.listNgoAccepted(ngoSession.ngoId),
      donationApi.listNgoCompleted(ngoSession.ngoId),
    ]);
    const volunteerRows = await authApi.getNgoVolunteers(ngoSession.ngoId);
    setAvailable(availableRows as DonationItem[]);
    setAccepted(acceptedRows as DonationItem[]);
    setCompleted(completedRows as DonationItem[]);
    setVolunteers(
      volunteerRows.map((v) => ({
        volunteerId: v.volunteerId,
        fullName: v.fullName,
        email: v.email,
        phone: v.phone ?? null,
      }))
    );
  }, [ngoSession?.ngoId]);

  useEffect(() => {
    (async () => {
      try {
        setError("");
        setLoading(true);
        await load();
      } catch (err) {
        console.error(err);
        setError("Unable to load NGO dashboard right now.");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

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

  const currentData = useMemo(() => {
    if (activeTab === "available") return available;
    if (activeTab === "accepted") return accepted;
    return completed;
  }, [activeTab, available, accepted, completed]);

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentData;
    return currentData.filter((item) =>
      [item.title, item.quantity ?? "", item.pickupAddress ?? "", item.status].join(" ").toLowerCase().includes(q)
    );
  }, [currentData, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const pagedData = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, page, totalPages]);

  const requestDonation = async (donationId: string) => {
    if (!ngoSession?.ngoId) return;
    try {
      setActionLoading(donationId);
      await donationApi.requestDonation(donationId, ngoSession.ngoId);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelivery = async (donationId: string) => {
    if (!ngoSession?.ngoId) return;
    try {
      setActionLoading(donationId);
      await donationApi.markCompleted(donationId, ngoSession.ngoId);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const addVolunteer = async () => {
    if (!ngoSession?.ngoId) return;
    if (!volunteerEmail.trim()) {
      setVolunteerError("Volunteer email is required.");
      return;
    }

    try {
      setVolunteerLoading(true);
      setVolunteerError("");
      const result = await authApi.addVolunteerToNgoByEmail(volunteerEmail.trim(), ngoSession.ngoId);
      if (!result.success) {
        setVolunteerError(result.message ?? "Unable to add volunteer.");
        return;
      }
      setVolunteerEmail("");
      await load();
    } finally {
      setVolunteerLoading(false);
    }
  };

  return (
    <AppScreen scroll>
      <Text style={styles.title}>NGO Dashboard</Text>
      <Text style={styles.subtitle}>
        {ngoSession ? `${ngoSession.ngoName} - ${ngoSession.city}` : "Manage requests and deliveries"}
      </Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.stats}>
        <StatCard label="Available" value={available.length} />
        <StatCard label="Accepted" value={accepted.length} />
        <StatCard label="Completed" value={completed.length} />
      </View>

      <View style={styles.mainTabs}>
        <TabButton label="Donations" active={mainTab === "donations"} onPress={() => setMainTab("donations")} />
        <TabButton label="Volunteers" active={mainTab === "volunteers"} onPress={() => setMainTab("volunteers")} />
      </View>

      {mainTab === "donations" ? (
        <>
          <View style={styles.tabs}>
            <TabButton label="Available" active={activeTab === "available"} onPress={() => setActiveTab("available")} />
            <TabButton label="Accepted" active={activeTab === "accepted"} onPress={() => setActiveTab("accepted")} />
            <TabButton label="Completed" active={activeTab === "completed"} onPress={() => setActiveTab("completed")} />
          </View>

          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by title, status, location..."
          />
        </>
      ) : (
        <AppCard>
          <Text style={styles.sectionTitle}>Manage Volunteers</Text>
          <AppInput
            label="Add volunteer by user email"
            placeholder="volunteer@example.com"
            value={volunteerEmail}
            onChangeText={setVolunteerEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            error={volunteerError}
          />
          <View style={styles.addVolunteerBtn}>
            <AppButton label="Add Volunteer" onPress={addVolunteer} loading={volunteerLoading} />
          </View>
          <View style={styles.volunteerList}>
            {!volunteers.length ? (
              <Text style={styles.emptyVolunteerText}>No volunteers linked yet.</Text>
            ) : (
              volunteers.map((v) => (
                <View key={v.volunteerId} style={styles.volunteerRow}>
                  <Text style={styles.volunteerName}>{v.fullName}</Text>
                  <Text style={styles.volunteerMeta}>{v.email}</Text>
                  <Text style={styles.volunteerMeta}>{v.phone ?? "No phone"}</Text>
                </View>
              ))
            )}
          </View>
        </AppCard>
      )}

      {mainTab === "donations" ? (
        <>
          {loading ? (
            <View style={{ gap: 12 }}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
            <FlatList
              data={pagedData}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              keyExtractor={(item) => item.id}
              initialNumToRender={4}
              windowSize={7}
              removeClippedSubviews
              contentContainerStyle={{ paddingBottom: 50, gap: 10 }}
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
                  title="No donations in this section"
                  subtitle="Pull to refresh or switch tabs to view more data."
                />
              }
              renderItem={({ item }) => (
                <AppCard>
                  {item.imageUrl ? (
                    <View style={styles.cardImageWrap}>
                      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} contentFit="cover" />
                    </View>
                  ) : null}
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.meta}>{item.quantity ?? "Quantity not set"}</Text>
                  <Text style={styles.meta}>{item.pickupAddress ?? "Address not set"}</Text>
                  <View style={styles.row}>
                    <StatusBadge status={item.status} />
                  </View>

                  {activeTab === "available" ? (
                    <View style={styles.actionWrap}>
                      <AppButton
                        label="Send Request"
                        onPress={() => requestDonation(item.id)}
                        loading={actionLoading === item.id}
                      />
                    </View>
                  ) : null}

                  {activeTab === "accepted" && item.status === "delivered_to_ngo" ? (
                    <View style={styles.actionWrap}>
                      <AppButton
                        label="Confirm Delivery"
                        onPress={() => confirmDelivery(item.id)}
                        loading={actionLoading === item.id}
                      />
                    </View>
                  ) : null}
                </AppCard>
              )}
            />
          )}
        </>
      ) : null}
    </AppScreen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: "800", color: palette.primaryDark, marginTop: 26 },
  subtitle: { color: palette.muted, marginBottom: 14, marginTop: 4 },
  stats: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    paddingVertical: 12,
  },
  statNum: { fontSize: 18, fontWeight: "800", color: palette.primaryDark },
  statLabel: { fontSize: 12, color: palette.muted },
  mainTabs: { flexDirection: "row", gap: 8, marginBottom: 12 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 12 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#E5EEE7",
  },
  tabActive: { backgroundColor: palette.primary },
  tabText: { fontSize: 12, fontWeight: "700", color: "#334155" },
  tabTextActive: { color: "#fff" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: palette.text, marginBottom: 8 },
  addVolunteerBtn: { marginTop: 8 },
  volunteerList: { marginTop: 10, gap: 8 },
  volunteerRow: { padding: 10, backgroundColor: "#F0FAF3", borderRadius: 10, borderWidth: 1, borderColor: "#DCEFE2" },
  volunteerName: { fontSize: 14, fontWeight: "700", color: palette.primaryDark },
  volunteerMeta: { fontSize: 12, color: palette.muted, marginTop: 2 },
  emptyVolunteerText: { color: palette.muted, fontSize: 13 },
  cardImageWrap: { marginBottom: 10, borderRadius: 14, overflow: "hidden" },
  cardImage: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#E8F9EE" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: palette.text },
  meta: { marginTop: 6, color: palette.muted, fontSize: 13 },
  row: { marginTop: 10 },
  actionWrap: { marginTop: 12 },
  errorText: { color: palette.danger, fontSize: 12, fontWeight: "700", marginBottom: 8 },
});

