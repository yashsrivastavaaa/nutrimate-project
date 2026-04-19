import { DonorBadge } from "@/components/DonorBadge";
import { SkeletonCard } from "@/components/SkeletonCard";
import {
  AppButton,
  AppCard,
  AppInput,
  AppScreen,
  StatusBadge,
} from "@/components/ui";
import { AuthContext } from "@/context/AuthContext";
import { authApi, donationApi } from "@/lib/api";
import { palette } from "@/lib/theme";
import { DonationStatus } from "@/lib/types";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

type DetailDonation = {
  id: string;
  userId: string;
  ngoId: number | null;
  volunteerId: number | null;
  title: string;
  description: string | null;
  quantity: string | null;
  foodType: string | null;
  pickupAddress: string | null;
  contactNumber: string | null;
  imageUrl: string;
  status: DonationStatus;
  pickupTime: Date | null;
  expiryTime: Date | null;
};

type DonorInfo = {
  fullName: string;
  email: string;
  phone?: string | null;
  isVerified?: number | null;
  donationCount?: number | null;
};

export default function DonationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, ngoSession } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [item, setItem] = useState<DetailDonation | null>(null);
  const [donorInfo, setDonorInfo] = useState<DonorInfo | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    quantity: "",
    foodType: "",
    pickupAddress: "",
    contactNumber: "",
  });

  const load = useCallback(async () => {
    if (!id) return;
    const row = await donationApi.detail(id);
    setItem(row as DetailDonation | null);
    if (row) {
      const donation = row as DetailDonation;
      setEditForm({
        title: donation.title ?? "",
        description: donation.description ?? "",
        quantity: donation.quantity ?? "",
        foodType: donation.foodType ?? "",
        pickupAddress: donation.pickupAddress ?? "",
        contactNumber: donation.contactNumber ?? "",
      });

      // Fetch donor information
      try {
        const donor = await authApi.getUserById(donation.userId);
        if (donor) {
          setDonorInfo({
            fullName: donor.fullName,
            email: donor.email,
            phone: donor.phone,
            isVerified: donor.isVerified,
            donationCount: donor.donationCount,
          });
        }
      } catch (err) {
        console.error("Failed to load donor info:", err);
      }

      // Check if NGO has favorited this donor
      if (ngoSession?.ngoId) {
        try {
          const favorite = await donationApi.isFavoriteDonor(ngoSession.ngoId, donation.userId);
          setIsFavorite(favorite as boolean);
        } catch (err) {
          console.error("Failed to check favorite status:", err);
        }
      }
    }
  }, [id, ngoSession?.ngoId]);

  useEffect(() => {
    (async () => {
      try {
        setError("");
        setLoading(true);
        await load();
      } catch (err) {
        console.error(err);
        setError("Unable to load donation details right now.");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const formatDate = (value: Date | null) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleString();
  };

  const donorAction = async () => {
    if (!item || !user?.id || item.userId !== user.id) return;
    if (item.status === "reserved") {
      setActionLoading(true);
      await donationApi.updateStatus(item.id, "pickup_assigned");
      setActionLoading(false);
      await load();
      return;
    }
    if (item.status === "pickup_assigned") {
      setActionLoading(true);
      await donationApi.updateStatus(item.id, "picked");
      setActionLoading(false);
      await load();
    }
  };

  const ngoAction = async () => {
    if (!item || !ngoSession?.ngoId) return;
    if (item.status === "delivered_to_ngo") {
      setActionLoading(true);
      await donationApi.markCompleted(item.id, ngoSession.ngoId);
      setActionLoading(false);
      await load();
    }
  };

  const toggleFavoriteDonor = async () => {
    if (!item || !ngoSession?.ngoId || !donorInfo) return;
    try {
      setActionLoading(true);
      await donationApi.toggleFavoriteDonor(ngoSession.ngoId, item.userId);
      setIsFavorite(!isFavorite);
    } catch (err) {
      Alert.alert("Error", "Failed to update favorite status");
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const saveDonationUpdates = async () => {
    if (!item || !user?.id || item.userId !== user.id) return;
    if (!editForm.title.trim()) return;

    setActionLoading(true);
    const result = await donationApi.updateDetails({
      id: item.id,
      userId: user.id,
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      quantity: editForm.quantity.trim(),
      foodType: editForm.foodType.trim(),
      pickupAddress: editForm.pickupAddress.trim(),
      contactNumber: editForm.contactNumber.trim(),
      expiryTime: item.expiryTime ?? undefined,
      pickupTime: item.pickupTime ?? undefined,
    });
    setActionLoading(false);

    if (!result.success) return;
    setEditing(false);
    await load();
  };

  if (loading) {
    return (
      <AppScreen scroll>
        <SkeletonCard />
      </AppScreen>
    );
  }

  if (!item) {
    return (
      <AppScreen scroll>
        <Text style={styles.error}>{error || "Donation not found."}</Text>
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>Donation ID: {item.id}</Text>

      <View style={{ marginTop: 12 }}>
        <StatusBadge status={item.status} />
      </View>

      {/* Donor Information Card */}
      {donorInfo && (
        <View style={styles.block}>
          <AppCard>
            <Text style={styles.sectionLabel}>Donor Information</Text>
            <View style={styles.donorHeader}>
              <View style={styles.donorInfo}>
                <Text style={styles.donorName}>{donorInfo.fullName}</Text>
                <Text style={styles.donorEmail}>{donorInfo.email}</Text>
                {donorInfo.phone && <Text style={styles.donorPhone}>{donorInfo.phone}</Text>}
              </View>
              {donorInfo.isVerified !== undefined && donorInfo.donationCount !== undefined && (
                <DonorBadge
                  isVerified={(donorInfo.isVerified as number) === 1}
                  donationCount={donorInfo.donationCount as number}
                  size="medium"
                />
              )}
            </View>
            {ngoSession?.ngoId && (
              <AppButton
                label={isFavorite ? "❤️ Remove from Favorites" : "🤍 Add to Favorites"}
                onPress={toggleFavoriteDonor}
                loading={actionLoading}
              />
            )}
          </AppCard>
        </View>
      )}

      <View style={styles.block}>
        <AppCard>
          {item.imageUrl ? (
            <View style={styles.heroWrap}>
              <Image source={{ uri: item.imageUrl }} style={styles.heroImage} contentFit="cover" />
            </View>
          ) : null}
          {editing ? (
            <View style={styles.editWrap}>
              <AppInput
                label="Title"
                placeholder="Donation title"
                value={editForm.title}
                onChangeText={(title) => setEditForm((prev) => ({ ...prev, title }))}
              />
              <AppInput
                label="Description"
                placeholder="Describe the food items"
                value={editForm.description}
                onChangeText={(description) => setEditForm((prev) => ({ ...prev, description }))}
              />
              <AppInput
                label="Quantity"
                placeholder="e.g., 5 boxes, 10 meals"
                value={editForm.quantity}
                onChangeText={(quantity) => setEditForm((prev) => ({ ...prev, quantity }))}
              />
              <AppInput
                label="Food Type"
                placeholder="e.g., veg, non-veg, packaged"
                value={editForm.foodType}
                onChangeText={(foodType) => setEditForm((prev) => ({ ...prev, foodType }))}
              />
              <AppInput
                label="Pickup Address"
                placeholder="Full address with landmark"
                value={editForm.pickupAddress}
                onChangeText={(pickupAddress) => setEditForm((prev) => ({ ...prev, pickupAddress }))}
              />
              <AppInput
                label="Contact Number"
                placeholder="+91 98XXXXXXXX"
                value={editForm.contactNumber}
                onChangeText={(contactNumber) => setEditForm((prev) => ({ ...prev, contactNumber }))}
              />
            </View>
          ) : (
            <>
              <Row label="Description" value={item.description ?? "N/A"} />
              <Row label="Quantity" value={item.quantity ?? "N/A"} />
              <Row label="Food Type" value={item.foodType ?? "N/A"} />
              <Row label="Pickup Address" value={item.pickupAddress ?? "N/A"} />
              <Row label="Contact" value={item.contactNumber ?? "N/A"} />
            </>
          )}
          <Row label="Pickup Time" value={formatDate(item.pickupTime)} />
          <Row label="Expiry Time" value={formatDate(item.expiryTime)} />
          <Row label="NGO Id" value={String(item.ngoId ?? "Not assigned")} />
          <Row label="Volunteer" value={item.volunteerId ? String(item.volunteerId) : "Not assigned"} />
        </AppCard>
      </View>

      <View style={styles.actions}>
        {user?.id === item.userId && (item.status === "reserved" || item.status === "pickup_assigned") ? (
          <AppButton
            label={item.status === "reserved" ? "Assign Pickup to Volunteers" : "Confirm Handover"}
            onPress={donorAction}
            loading={actionLoading}
          />
        ) : null}

        {ngoSession?.ngoId === item.ngoId && item.status === "delivered_to_ngo" ? (
          <AppButton label="Confirm Completion" onPress={ngoAction} loading={actionLoading} />
        ) : null}

        {user?.id === item.userId ? (
          editing ? (
            <>
              <AppButton label="Save Changes" onPress={saveDonationUpdates} loading={actionLoading} />
              <AppButton label="Cancel" variant="ghost" onPress={() => setEditing(false)} />
            </>
          ) : (
            <>
              <AppButton
                label="Edit Donation"
                variant="ghost"
                disabled={item.status !== "available"}
                onPress={() => setEditing(true)}
              />
              <AppButton
                label="Delete Donation"
                variant="danger"
                disabled={item.status !== "available"}
                onPress={() => {
                  Alert.alert(
                    "Delete Donation",
                    "Are you sure you want to delete this donation? This action cannot be undone.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                          setActionLoading(true);
                          try {
                            if (user?.id) {
                              await donationApi.delete(item.id, user.id);
                              Alert.alert("Success", "Donation deleted.");
                              router.back();
                            }
                          } catch (e) {
                            Alert.alert("Error", "Could not delete donation.");
                          } finally {
                            setActionLoading(false);
                          }
                        },
                      },
                    ]
                  );
                }}
              />
              {item.status !== "available" && (
                <Text style={styles.infoText}>
                  ℹ️ You cannot edit or delete this donation while it's {item.status.replace(/_/g, " ")}.
                </Text>
              )}
            </>
          )
        ) : null}

        <AppButton label="Back" variant="ghost" onPress={() => router.back()} />
      </View>
    </AppScreen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: "800", color: palette.primaryDark, marginTop: 20 },
  subtitle: { color: palette.muted, marginTop: 4 },
  error: { marginTop: 20, color: palette.danger, fontWeight: "700" },
  block: { marginTop: 12 },
  sectionLabel: { fontSize: 16, fontWeight: "700", color: palette.primaryDark, marginBottom: 12 },
  donorHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  donorInfo: { flex: 1 },
  donorName: { fontSize: 16, fontWeight: "700", color: palette.text },
  donorEmail: { fontSize: 14, color: palette.muted, marginTop: 2 },
  donorPhone: { fontSize: 14, color: palette.muted, marginTop: 2 },
  heroWrap: { marginBottom: 14, borderRadius: 18, overflow: "hidden" },
  heroImage: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#E8F9EE" },
  editWrap: { gap: 10, marginBottom: 8 },
  row: { marginBottom: 12 },
  rowLabel: { fontSize: 12, color: palette.muted, fontWeight: "700" },
  rowValue: { marginTop: 4, color: palette.text, fontSize: 15, lineHeight: 20 },
  actions: { marginTop: 16, gap: 10 },
  infoText: { marginTop: 12, padding: 12, backgroundColor: palette.surface, borderRadius: 8, color: palette.muted, fontSize: 14, textAlign: "center" },
});
