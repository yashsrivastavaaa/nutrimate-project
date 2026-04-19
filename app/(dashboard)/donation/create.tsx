import { CameraCapture } from "@/components/CameraCapture";
import { AppButton, AppInput, AppScreen } from "@/components/ui";
import { AuthContext } from "@/context/AuthContext";
import { donationApi } from "@/lib/api";
import { uploadImage } from "@/lib/api/uploadImage";
import { palette } from "@/lib/theme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useContext, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const foodTypes = ["veg", "non-veg", "packaged", "cooked"];
const FIXED_STATE = "Uttar Pradesh";
const FIXED_CITY = "Greater Noida";
const SECTORS = ["Delta 1", "Alpha 1", "Alpha 2"] as const;

export default function CreateDonationScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    quantity: "",
    foodType: "veg",
    state: FIXED_STATE,
    city: FIXED_CITY,
    sector: "",
    addressLine2: "",
    contactNumber: "",
    expiryHours: "4",
    pickupInMins: "20",
  });

  const canSubmit = useMemo(
    () =>
      !!user?.id &&
      !!form.title.trim() &&
      !!form.quantity.trim() &&
      !!form.sector.trim() &&
      !!form.addressLine2.trim() &&
      !!form.contactNumber.trim() &&
      !!selectedImageUri,
    [selectedImageUri, user?.id, form]
  );

  const handleCameraConfirm = async (uri: string) => {
    setSelectedImageUri(uri);
    setError("");
    setCameraOpen(false);
  };

  const onSubmit = async () => {
    setError("");
    if (!canSubmit || !user?.id) {
      setError(!selectedImageUri ? "Image is required" : "Please complete all required fields.");
      return;
    }

    // Validate numeric fields
    const expiryHours = parseInt(form.expiryHours, 10);
    const pickupInMins = parseInt(form.pickupInMins, 10);

    if (isNaN(expiryHours) || expiryHours <= 0 || expiryHours > 72) {
      setError("Expiry hours must be a number between 1 and 72");
      return;
    }

    if (isNaN(pickupInMins) || pickupInMins <= 0 || pickupInMins > 1440) {
      setError("Pickup time must be a number between 1 and 1440 minutes");
      return;
    }

    // Validate phone number (basic check)
    if (!/^\d{10,}$/.test(form.contactNumber.replace(/\D/g, ""))) {
      setError("Contact number must be at least 10 digits");
      return;
    }

    try {
      setLoading(true);
      const imageUri = selectedImageUri;
      if (!imageUri) {
        setError("Image is required");
        return;
      }
      const now = new Date();
      const expiryTime = new Date(now.getTime() + expiryHours * 60 * 60 * 1000);
      const pickupTime = new Date(now.getTime() + pickupInMins * 60 * 1000);
      const pickupAddress = `${form.sector}, ${form.addressLine2.trim()}, ${FIXED_CITY}, ${FIXED_STATE}`;
      const imageUrl = await uploadImage(imageUri);
      await donationApi.create({
        id: `don_${Date.now()}`,
        userId: user.id,
        title: form.title.trim(),
        imageUrl,
        description: form.description.trim(),
        quantity: form.quantity.trim(),
        foodType: form.foodType,
        pickupAddress,
        contactNumber: form.contactNumber.trim(),
        expiryTime,
        pickupTime,
      });
      Alert.alert("Success", "Donation created.");
      router.replace("/(dashboard)/(tabs)/dashboard");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Unable to create donation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen scroll>
      <Text style={styles.title}>Create Donation</Text>
      <Text style={styles.subtitle}>Share surplus food with verified NGOs.</Text>
      {error && error !== "Image is required" ? <Text style={styles.formError}>{error}</Text> : null}

      <View style={styles.form}>
        <View style={styles.imageSection}>
          <Text style={styles.label}>Donation Photo*</Text>
          {selectedImageUri ? (
            <View style={styles.previewCard}>
              <Image source={{ uri: selectedImageUri }} style={styles.previewImage} contentFit="cover" />
              <View style={styles.previewFooter}>
                <Text style={styles.previewText}>Photo captured and ready for upload.</Text>
                <TouchableOpacity onPress={() => setCameraOpen(true)} style={styles.retakeButton}>
                  <Text style={styles.retakeButtonText}>Retake</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.captureButton} onPress={() => setCameraOpen(true)}>
              <Text style={styles.captureButtonText}>Open Camera</Text>
              <Text style={styles.captureHint}>Camera only. Gallery selection is disabled.</Text>
            </TouchableOpacity>
          )}
          {error === "Image is required" ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <AppInput
          label="Title*"
          placeholder="Fresh cooked rice and dal"
          value={form.title}
          onChangeText={(title) => setForm((s) => ({ ...s, title }))}
          error={error}
        />
        <AppInput
          label="Description"
          placeholder="Good for 20-25 people"
          value={form.description}
          onChangeText={(description) => setForm((s) => ({ ...s, description }))}
          multiline
        />
        <AppInput
          label="Quantity*"
          placeholder="20 packs"
          value={form.quantity}
          onChangeText={(quantity) => setForm((s) => ({ ...s, quantity }))}
        />

        <Text style={styles.label}>Food Type</Text>
        <View style={styles.chips}>
          {foodTypes.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setForm((s) => ({ ...s, foodType: type }))}
              style={[styles.chip, form.foodType === type && styles.chipActive]}
            >
              <Text style={[styles.chipText, form.foodType === type && styles.chipTextActive]}>
                {type.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <AppInput
          label="State (Fixed)"
          value={form.state}
          onChangeText={(state) => setForm((s) => ({ ...s, state }))}
          editable={false}
        />
        <AppInput
          label="City (Fixed)"
          value={form.city}
          onChangeText={(city) => setForm((s) => ({ ...s, city }))}
          editable={false}
        />

        <Text style={styles.label}>Sector*</Text>
        <View style={styles.chips}>
          {SECTORS.map((sector) => (
            <TouchableOpacity
              key={sector}
              onPress={() => setForm((s) => ({ ...s, sector }))}
              style={[styles.chip, form.sector === sector && styles.chipActive]}
            >
              <Text style={[styles.chipText, form.sector === sector && styles.chipTextActive]}>{sector}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <AppInput
          label="Address Line 2*"
          placeholder="House / building / landmark"
          value={form.addressLine2}
          onChangeText={(addressLine2) => setForm((s) => ({ ...s, addressLine2 }))}
        />
        <AppInput
          label="Contact Number*"
          placeholder="+91 98XXXXXXXX"
          keyboardType="phone-pad"
          value={form.contactNumber}
          onChangeText={(contactNumber) => setForm((s) => ({ ...s, contactNumber }))}
        />
        <AppInput
          label="Expiry in hours (1-72)"
          placeholder="4"
          value={form.expiryHours}
          onChangeText={(expiryHours) => setForm((s) => ({ ...s, expiryHours }))}
          keyboardType="number-pad"
          maxLength={2}
        />
        <AppInput
          label="Pickup in minutes (1-1440)"
          placeholder="20"
          value={form.pickupInMins}
          onChangeText={(pickupInMins) => setForm((s) => ({ ...s, pickupInMins }))}
          keyboardType="number-pad"
          maxLength={4}
        />
      </View>

      <View style={styles.footer}>
        <AppButton
          label={loading ? "Creating donation..." : "Create Donation"}
          onPress={onSubmit}
          loading={loading}
          disabled={!canSubmit}
        />
        <AppButton
          label="Cancel"
          variant="ghost"
          onPress={() => router.back()}
        />
      </View>

      <CameraCapture
        visible={cameraOpen}
        loading={loading}
        onCancel={() => setCameraOpen(false)}
        onConfirm={handleCameraConfirm}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: "800", color: palette.primaryDark, marginTop: 20 },
  subtitle: { color: palette.muted, marginTop: 5 },
  form: { marginTop: 18, gap: 14 },
  label: { fontSize: 13, color: palette.muted, fontWeight: "700" },
  imageSection: { gap: 10 },
  captureButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#F0FAF3",
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  captureButtonText: { color: palette.primaryDark, fontWeight: "800", fontSize: 15 },
  captureHint: { color: palette.muted, fontSize: 12, marginTop: 4, textAlign: "center" },
  previewCard: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  previewImage: { width: "100%", aspectRatio: 16 / 9 },
  previewFooter: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  previewText: { color: palette.muted, fontSize: 12, flex: 1 },
  retakeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#E8F9EE",
  },
  retakeButtonText: { color: palette.primaryDark, fontWeight: "800", fontSize: 12 },
  errorText: { color: palette.danger, fontSize: 12, fontWeight: "700" },
  formError: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    color: palette.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  chipText: { fontSize: 12, fontWeight: "700", color: "#334155" },
  chipTextActive: { color: "#fff" },
  footer: { marginTop: 20, gap: 10 },
});
