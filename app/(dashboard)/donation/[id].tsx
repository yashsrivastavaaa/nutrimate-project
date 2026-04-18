import { SkeletonCard } from "@/components/SkeletonCard";
import {
  AppButton,
  AppCard,
  AppInput,
  AppScreen,
  StatusBadge,
} from "@/components/ui";
import { AuthContext } from "@/context/AuthContext";
import { donationApi } from "@/lib/api";
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

export default function DonationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, ngoSession } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [item, setItem] = useState<DetailDonation | null>(null);
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
    }
  }, [id]);

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
              <AppButton label="Edit Donation" variant="ghost" onPress={() => setEditing(true)} />
              <AppButton label="Delete Donation" variant="danger" onPress={() => {
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
              }} />
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
  heroWrap: { marginBottom: 14, borderRadius: 18, overflow: "hidden" },
  heroImage: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#E8F9EE" },
  editWrap: { gap: 10, marginBottom: 8 },
  row: { marginBottom: 12 },
  rowLabel: { fontSize: 12, color: palette.muted, fontWeight: "700" },
  rowValue: { marginTop: 4, color: palette.text, fontSize: 15, lineHeight: 20 },
  actions: { marginTop: 16, gap: 10 },
});
