import { SkeletonCard } from "@/components/SkeletonCard";
import {
  AppButton,
  AppCard,
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
import { useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type VolunteerDonation = {
  id: string;
  title: string;
  quantity: string | null;
  pickupAddress: string | null;
  imageUrl: string;
  status: DonationStatus;
};

export default function VolunteerDashboard() {
  const PAGE_SIZE = 8;
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"open" | "assigned" | "completed">("open");
  const [ngoId, setNgoId] = useState<number | null>(null);
  const [openPickups, setOpenPickups] = useState<VolunteerDonation[]>([]);
  const [assigned, setAssigned] = useState<VolunteerDonation[]>([]);
  const [completed, setCompleted] = useState<VolunteerDonation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (resolvedNgoId?: number | null) => {
    if (!user?.id) return;
    const localNgoId = resolvedNgoId ?? ngoId;
    if (!localNgoId) return;
    const [openRows, allAssignedRows] = await Promise.all([
      donationApi.listVolunteerOpenPickups(localNgoId),
      donationApi.listVolunteerAssigned(user.id),
    ]);
    const assignedRows = (allAssignedRows as any[]).filter((r: any) => r.status !== "completed" && r.status !== "ready");
    const completedRows = (allAssignedRows as any[]).filter((r: any) => r.status === "completed");

    setOpenPickups(openRows as VolunteerDonation[]);
    setAssigned(assignedRows as VolunteerDonation[]);
    setCompleted(completedRows as VolunteerDonation[]);
  }, [ngoId, user?.id]);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      try {
        setError("");
        setLoading(true);
        const resolvedNgoId = await authApi.getVolunteerNgoId(user.id);
        setNgoId(resolvedNgoId);
        await load(resolvedNgoId);
      } catch (err) {
        console.error(err);
        setError("Unable to load your volunteer assignments. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [load, user?.id]);

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

  const acceptPickup = async (id: string) => {
    if (!user?.id) return;
    try {
      setActionError("");
      setActionLoadingId(id);
      const result = await donationApi.acceptVolunteerPickup(id, user.id);
      if (!result.success) {
        setActionError(result.message ?? "This pickup is no longer available. Please check other pickups.");
      }
      await load();
    } finally {
      setActionLoadingId(null);
    }
  };

  const markDelivered = async (id: string) => {
    if (!user?.id) return;
    try {
      setActionLoadingId(id);
      await donationApi.markDeliveredToNgo(id, user.id);
      await load();
    } finally {
      setActionLoadingId(null);
    }
  };

  const markPicked = async (id: string) => {
    if (!user?.id) return;
    try {
      setActionLoadingId(id);
      const result = await donationApi.markVolunteerPickup(id, user.id);
      if (!result.success) {
        setActionError(result.message || "Failed to mark pickup");
      } else {
        await load();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const data = useMemo(() => {
    if (tab === "open") return openPickups;
    if (tab === "assigned") return assigned;
    return completed;
  }, [tab, openPickups, assigned, completed]);
  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data;
    return data.filter((item) =>
      [item.title, item.quantity ?? "", item.pickupAddress ?? "", item.status].join(" ").toLowerCase().includes(q)
    );
  }, [data, searchQuery]);
  useEffect(() => {
    setPage(1);
  }, [tab, searchQuery]);
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const pagedData = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, page, totalPages]);

  return (
    <AppScreen scroll>
      <Text style={styles.title}>Volunteer Dashboard</Text>
      <Text style={styles.subtitle}>Accept pickups and update delivery status.</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!ngoId ? (
        <EmptyState
          title="Volunteer is not linked to an NGO"
          subtitle="Ask admin to assign your account in volunteers table."
        />
      ) : (
        <>
          {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

          <AppButton
            label="📦 My Assignments"
            onPress={() => router.push("/(dashboard)/volunteer-assignments" as any)}
          />

          <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tab, tab === "open" && styles.tabActive]} onPress={() => setTab("open")}>
              <Text style={[styles.tabText, tab === "open" && styles.tabTextActive]}>Available Pickups</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, tab === "assigned" && styles.tabActive]} onPress={() => setTab("assigned")}>
              <Text style={[styles.tabText, tab === "assigned" && styles.tabTextActive]}>Assigned to Me</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, tab === "completed" && styles.tabActive]} onPress={() => setTab("completed")}>
              <Text style={[styles.tabText, tab === "completed" && styles.tabTextActive]}>Completed</Text>
            </TouchableOpacity>
          </View>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by title, status, pickup..."
          />

          {loading ? (
            <View style={{ gap: 12 }}>
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
                <EmptyState title="No donations here" subtitle="Try pull-to-refresh after NGO reserves donations." />
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
                  <Text style={styles.meta}>{item.pickupAddress ?? "Pickup address not set"}</Text>
                  <View style={{ marginTop: 8 }}>
                    <StatusBadge status={item.status} />
                  </View>

                  {tab === "open" ? (
                    <View style={styles.actionWrap}>
                      <AppButton
                        label="Accept"
                        onPress={() => acceptPickup(item.id)}
                        loading={actionLoadingId === item.id}
                      />
                    </View>
                  ) : tab === "assigned" ? (
                    <View style={styles.actionWrap}>
                      {item.status === "pickup_assigned" ? (
                        <AppButton
                          label="Mark Picked Up"
                          onPress={() => markPicked(item.id)}
                          loading={actionLoadingId === item.id}
                        />
                      ) : null}
                      {item.status === "awaiting_volunteer_pickup" ? (
                        <AppButton
                          label="Confirm Pickup"
                          onPress={() => markPicked(item.id)}
                          loading={actionLoadingId === item.id}
                        />
                      ) : null}
                      {item.status === "picked" ? (
                        <AppButton
                          label="Mark Delivered"
                          onPress={() => markDelivered(item.id)}
                          loading={actionLoadingId === item.id}
                        />
                      ) : null}
                    </View>
                  ) : null}
                </AppCard>
              )}
            />
          )}
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: "800", color: palette.primaryDark, marginTop: 26 },
  subtitle: { marginTop: 4, color: palette.muted, marginBottom: 12 },
  tabs: { flexDirection: "row", gap: 8, marginTop: 16, marginBottom: 10 },
  tab: { flex: 1, backgroundColor: "#E5EEE7", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  tabActive: { backgroundColor: palette.primary },
  tabText: { fontSize: 12, fontWeight: "700", color: "#334155" },
  tabTextActive: { color: "#fff" },
  cardImageWrap: { marginBottom: 10, borderRadius: 14, overflow: "hidden" },
  cardImage: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#E8F9EE" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: palette.text },
  meta: { marginTop: 6, color: palette.muted, fontSize: 13 },
  actionWrap: { marginTop: 10, gap: 8 },
  errorText: { color: palette.danger, fontSize: 12, marginBottom: 8, fontWeight: "600" },
});
