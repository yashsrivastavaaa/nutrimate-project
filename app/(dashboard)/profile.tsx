import { AppButton, AppInput, AppScreen } from "@/components/ui";
import { AuthContext } from "@/context/AuthContext";
import { ThemeContext } from "@/context/ThemeContext";
import { authApi, donationApi } from "@/lib/api";
import { exportDonationHistoryAsCSV } from "@/lib/exportUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const FIXED_STATE = "Uttar Pradesh";
const FIXED_CITY = "Greater Noida";
const SECTORS = ["Delta 1", "Alpha 1", "Alpha 2"] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, userRoles, setUser, setUserRoles, ngoSession, setNgoSession, activeRole } = useContext(AuthContext);
  const { isDarkMode, setIsDarkMode, palette } = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [donationStats, setDonationStats] = useState(0);
  const [exportLoading, setExportLoading] = useState(false);

  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
  });

  const [ngoForm, setNgoForm] = useState({
    ngoName: "",
    email: "",
    state: FIXED_STATE,
    city: FIXED_CITY,
    sector: "",
    addressLine2: "",
  });

  const isNgo = activeRole === "ngo" && !!ngoSession?.ngoId;

  const load = useCallback(async () => {
    try {
      setInitialLoading(true);

      if (isNgo && ngoSession?.ngoId) {
        const ngo = await authApi.getNgoById(ngoSession.ngoId);
        if (ngo) {
          setNgoForm({
            ngoName: ngo.ngoName ?? "",
            email: ngo.email ?? "",
            state: ngo.state ?? FIXED_STATE,
            city: ngo.city ?? FIXED_CITY,
            sector: ngo.addressLine1 ?? "",
            addressLine2: ngo.addressLine2 ?? "",
          });
        }
        return;
      }

      if (user?.id) {
        const profile = await authApi.getUserById(user.id);
        if (profile) {
          setUserForm({
            fullName: profile.fullName ?? "",
            email: profile.email ?? "",
            phone: profile.phone ?? "",
            gender: profile.gender ?? "",
          });
          // Fetch donation success stats for donors
          if (activeRole === "donor") {
            const stats = await donationApi.getDonationSuccessStats(user.id);
            setDonationStats(stats);
          }
        }
      }
    } finally {
      setInitialLoading(false);
    }
  }, [isNgo, ngoSession?.ngoId, user?.id, activeRole]);

  useEffect(() => {
    load();
  }, [load]);

  const saveUserProfile = async () => {
    if (!user?.id) return;
    if (!userForm.fullName.trim() || !userForm.email.trim()) {
      Alert.alert("Validation", "Name and email are required.");
      return;
    }

    try {
      setLoading(true);
      const updated = await authApi.updateUserProfile({
        id: user.id,
        fullName: userForm.fullName.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim(),
        gender: userForm.gender.trim(),
        avatarType: user.avatarType ?? "",
      });
      if (updated) {
        setUser(updated);
        setUserRoles(updated.roles ?? userRoles);
        await AsyncStorage.setItem("userData", JSON.stringify(updated));
        await AsyncStorage.setItem("userRoles", JSON.stringify(updated.roles ?? userRoles));
      }
      Alert.alert("Saved", "Profile updated successfully.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Unable to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const saveNgoProfile = async () => {
    if (!ngoSession?.ngoId) return;
    if (!ngoForm.ngoName.trim() || !ngoForm.email.trim() || !ngoForm.sector.trim() || !ngoForm.addressLine2.trim()) {
      Alert.alert("Validation", "NGO name, email, sector and address line 2 are required.");
      return;
    }

    try {
      setLoading(true);
      const updated = await authApi.updateNgoProfile({
        ngoId: ngoSession.ngoId,
        ngoName: ngoForm.ngoName.trim(),
        email: ngoForm.email.trim(),
        state: ngoForm.state.trim(),
        city: ngoForm.city.trim(),
        addressLine1: ngoForm.sector.trim(),
        addressLine2: ngoForm.addressLine2.trim(),
      });
      if (updated) {
        const session = {
          ngoId: updated.ngoId,
          email: updated.email,
          ngoName: updated.ngoName,
          city: updated.city,
          state: updated.state,
        };
        setNgoSession(session);
        await AsyncStorage.setItem("ngoSession", JSON.stringify(session));
      }
      Alert.alert("Saved", "NGO profile updated successfully.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Unable to update NGO profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportDonationHistory = async () => {
    if (!user?.id) return;
    try {
      setExportLoading(true);
      const donations = await donationApi.getDonationHistoryForExport(user.id);
      if (donations.length === 0) {
        Alert.alert("No Data", "You have no donation history to export.");
        return;
      }
      await exportDonationHistoryAsCSV(donations);
      Alert.alert("Success", "Donation history exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Error", "Failed to export donation history. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <AppScreen scroll>
      <View style={getStyles(palette).container}>
        <Text style={getStyles(palette).title}>Profile</Text>
        <Text style={getStyles(palette).subtitle}>
          {isNgo ? "Update your NGO organization details." : "Update your personal details."}
        </Text>
        {!isNgo ? <Text style={getStyles(palette).rolesText}>Roles: {userRoles.join(", ") || "donor"}</Text> : null}

        {!isNgo && activeRole === "donor" && (
          <View style={getStyles(palette).statsCard}>
            <Text style={getStyles(palette).statsLabel}>Impact</Text>
            <Text style={getStyles(palette).statsValue}>
              {donationStats} {donationStats === 1 ? "family helped" : "families helped"}
            </Text>
          </View>
        )}

        {initialLoading ? (
          <Text style={getStyles(palette).loading}>Loading profile...</Text>
        ) : (
          <View style={getStyles(palette).form}>
            {isNgo ? (
              <>
                <AppInput
                  label="NGO Name"
                  value={ngoForm.ngoName}
                  onChangeText={(ngoName) => setNgoForm((s) => ({ ...s, ngoName }))}
                />
                <AppInput
                  label="Email"
                  value={ngoForm.email}
                  onChangeText={(email) => setNgoForm((s) => ({ ...s, email }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <AppInput
                  label="State (Fixed)"
                  value={ngoForm.state}
                  onChangeText={(state) => setNgoForm((s) => ({ ...s, state }))}
                  editable={false}
                />
                <AppInput
                  label="City (Fixed)"
                  value={ngoForm.city}
                  onChangeText={(city) => setNgoForm((s) => ({ ...s, city }))}
                  editable={false}
                />
                <Text style={getStyles(palette).fieldLabel}>Sector</Text>
                <View style={getStyles(palette).chips}>
                  {SECTORS.map((sector) => (
                    <TouchableOpacity
                      key={sector}
                      style={[getStyles(palette).chip, ngoForm.sector === sector && getStyles(palette).chipActive]}
                      onPress={() => setNgoForm((s) => ({ ...s, sector }))}
                    >
                      <Text style={[getStyles(palette).chipText, ngoForm.sector === sector && getStyles(palette).chipTextActive]}>
                        {sector}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <AppInput
                  label="Address Line 2"
                  value={ngoForm.addressLine2}
                  onChangeText={(addressLine2) => setNgoForm((s) => ({ ...s, addressLine2 }))}
                />
                <AppButton label="Save NGO Profile" onPress={saveNgoProfile} loading={loading} />
              </>
            ) : (
              <>
                <AppInput
                  label="Full Name"
                  placeholder="John Doe"
                  value={userForm.fullName}
                  onChangeText={(fullName) => setUserForm((s) => ({ ...s, fullName }))}
                />
                <AppInput
                  label="Email"
                  placeholder="you@example.com"
                  value={userForm.email}
                  onChangeText={(email) => setUserForm((s) => ({ ...s, email }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <AppInput
                  label="Phone"
                  placeholder="9876543210"
                  value={userForm.phone}
                  onChangeText={(phone) => setUserForm((s) => ({ ...s, phone }))}
                  keyboardType="phone-pad"
                />
                <Text style={getStyles(palette).label}>Gender</Text>
                <View style={getStyles(palette).genderRow}>
                  {["male", "female", "other"].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[getStyles(palette).genderBtn, userForm.gender === g && getStyles(palette).genderActive]}
                      onPress={() => setUserForm((s) => ({ ...s, gender: g }))}
                    >
                      <Text style={[getStyles(palette).genderText, userForm.gender === g && { color: "#fff" }]}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <AppButton label="Save Profile" onPress={saveUserProfile} loading={loading} />
              </>
            )}
          </View>
        )}

        <View style={getStyles(palette).actions}>
          {!isNgo && activeRole === "donor" && (
            <AppButton
              label="📥 Export Donation History"
              onPress={handleExportDonationHistory}
              loading={exportLoading}
            />
          )}
          <AppButton
            label="Logout"
            variant="danger"
            onPress={() => {
              Alert.alert(
                "Logout",
                "Are you sure you want to logout?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                      await AsyncStorage.multiRemove(["userData", "userRoles", "activeRole", "ngoSession"]);
                      setUser(null);
                      setUserRoles([]);
                      setNgoSession(null);
                      router.replace("/");
                    },
                  },
                ]
              );
            }}
          />
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: "800", marginTop: 18 },
  subtitle: { marginTop: 5 },
  rolesText: { marginTop: 4, fontWeight: "600" },
  statsCard: {
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
    borderLeftWidth: 4,
  },
  statsLabel: { fontSize: 12, fontWeight: "700" },
  statsValue: { fontSize: 24, fontWeight: "800", marginTop: 4 },
  loading: { marginTop: 18, fontWeight: "600", fontSize: 15, textAlign: "center" },
  form: { marginTop: 16, gap: 12 },
  fieldLabel: { fontSize: 13, fontWeight: "700" },
  chips: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipActive: {},
  chipText: { fontWeight: "600", fontSize: 12 },
  chipTextActive: {},
  actions: { marginTop: 20, gap: 10 },
  darkModeToggle: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  darkModeText: { fontSize: 14, fontWeight: "700" },
  label: { fontSize: 14, fontWeight: "600", marginTop: 8, marginBottom: 6 },
  genderRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  genderActive: {},
  genderText: { fontSize: 13, fontWeight: "600" },
  container: {},
});

const getStyles = (palette: typeof import("@/lib/theme").lightPalette) =>
  StyleSheet.create({
    container: {},
    title: { fontSize: 30, fontWeight: "800", color: palette.text, marginTop: 18 },
    subtitle: { color: palette.muted, marginTop: 5 },
    rolesText: { color: palette.primaryDark, marginTop: 4, fontWeight: "600" },
    statsCard: {
      backgroundColor: palette.background === "#0F172A" ? "#1E3A1F" : "#EAF8EE",
      borderRadius: 10,
      padding: 14,
      marginTop: 14,
      borderLeftWidth: 4,
      borderLeftColor: palette.primary,
    },
    statsLabel: { fontSize: 12, fontWeight: "700", color: palette.muted },
    statsValue: { fontSize: 24, fontWeight: "800", color: palette.primary, marginTop: 4 },
    loading: { marginTop: 18, color: palette.muted, fontWeight: "600", fontSize: 15, textAlign: "center" },
    form: { marginTop: 16, gap: 12 },
    fieldLabel: { fontSize: 13, color: palette.muted, fontWeight: "700" },
    chips: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 8 },
    chip: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: palette.surface,
    },
    chipActive: { borderColor: palette.primary, backgroundColor: palette.background === "#0F172A" ? "#1E3A1F" : "#EAF8EE" },
    chipText: { color: palette.background === "#0F172A" ? palette.muted : "#334155", fontWeight: "600", fontSize: 12 },
    chipTextActive: { color: palette.primaryDark },
    actions: { marginTop: 20, gap: 10 },
    darkModeToggle: {
      backgroundColor: palette.surface,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 8,
      alignItems: "center",
      borderWidth: 1,
      borderColor: palette.border,
    },
    darkModeText: { fontSize: 14, fontWeight: "700", color: palette.text },
    label: { fontSize: 14, fontWeight: "600", color: palette.text, marginTop: 8, marginBottom: 6 },
    genderRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
    genderBtn: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
      alignItems: "center",
    },
    genderActive: { backgroundColor: palette.primary, borderColor: palette.primary },
    genderText: { fontSize: 13, fontWeight: "600", color: palette.text },
  });
