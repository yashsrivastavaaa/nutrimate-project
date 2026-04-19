import { AppButton, AppInput, AppScreen } from "@/components/ui";
import { AuthContext } from "@/context/AuthContext";
import { ThemeContext } from "@/context/ThemeContext";
import { authApi } from "@/lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const FIXED_STATE = "Uttar Pradesh";
const FIXED_CITY = "Greater Noida";
const SECTORS = ["Delta 1", "Alpha 1", "Alpha 2"] as const;

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, userRoles, setUser, setUserRoles, ngoSession, setNgoSession, activeRole } = useContext(AuthContext);
    const { palette } = useContext(ThemeContext);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

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
                }
            }
        } finally {
            setInitialLoading(false);
        }
    }, [isNgo, ngoSession?.ngoId, user?.id]);

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
            router.back();
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
            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Unable to update NGO profile.");
        } finally {
            setLoading(false);
        }
    };

    const getStyles = (palette: typeof import("@/lib/theme").lightPalette) =>
        StyleSheet.create({
            container: {},
            title: { fontSize: 30, fontWeight: "800", color: palette.text, marginTop: 18 },
            subtitle: { color: palette.muted, marginTop: 5 },
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

    const styles = getStyles(palette);

    return (
        <AppScreen scroll>
            <View>
                <Text style={styles.title}>Edit Profile</Text>
                <Text style={styles.subtitle}>
                    {isNgo ? "Update your NGO organization details." : "Update your personal details."}
                </Text>

                {initialLoading ? (
                    <Text style={styles.loading}>Loading profile...</Text>
                ) : (
                    <View style={styles.form}>
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
                                <Text style={styles.fieldLabel}>Sector</Text>
                                <View style={styles.chips}>
                                    {SECTORS.map((sector) => (
                                        <TouchableOpacity
                                            key={sector}
                                            style={[styles.chip, ngoForm.sector === sector && styles.chipActive]}
                                            onPress={() => setNgoForm((s) => ({ ...s, sector }))}
                                        >
                                            <Text style={[styles.chipText, ngoForm.sector === sector && styles.chipTextActive]}>
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
                                <AppButton label="Save Changes" onPress={saveNgoProfile} loading={loading} />
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
                                <Text style={styles.label}>Gender</Text>
                                <View style={styles.genderRow}>
                                    {["male", "female", "other"].map((g) => (
                                        <TouchableOpacity
                                            key={g}
                                            style={[styles.genderBtn, userForm.gender === g && styles.genderActive]}
                                            onPress={() => setUserForm((s) => ({ ...s, gender: g }))}
                                        >
                                            <Text style={[styles.genderText, userForm.gender === g && { color: "#fff" }]}>
                                                {g.charAt(0).toUpperCase() + g.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <AppButton label="Save Changes" onPress={saveUserProfile} loading={loading} />
                            </>
                        )}
                    </View>
                )}

                <View style={styles.actions}>
                    <AppButton label="Cancel" variant="ghost" onPress={() => router.back()} />
                </View>
            </View>
        </AppScreen>
    );
}
