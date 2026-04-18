import { AppButton, AppCard, AppScreen } from "@/components/ui";
import { AuthContext } from "@/context/AuthContext";
import { authApi } from "@/lib/api";
import { palette } from "@/lib/theme";
import { AppRole } from "@/lib/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useContext, useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const roleConfig: { key: AppRole; label: string; description: string }[] = [
  { key: "donor", label: "Donor", description: "Create and manage food donations." },
  { key: "volunteer", label: "Volunteer", description: "Pickup and deliver donations." },
  { key: "admin", label: "Admin", description: "Monitor all system data." },
];

export default function SelectRoleScreen() {
  const router = useRouter();
  const { user, ngoSession, userRoles, setUserRoles, setActiveRole } = useContext(AuthContext);
  const [selected, setSelected] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      try {
        setLoadingRoles(true);
        const roles = await authApi.listUserRoles(user.id);
        const normalized = (roles.length ? roles : ["donor"]) as AppRole[];
        setUserRoles(normalized);
        await AsyncStorage.setItem("userRoles", JSON.stringify(normalized));
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingRoles(false);
      }
    })();
  }, [setUserRoles, user?.id]);

  const availableRoleCards = useMemo(
    () => roleConfig.filter((r) => userRoles.includes(r.key)),
    [userRoles]
  );

  const handleContinue = async () => {
    if (!selected) return;

    if (!user?.id) {
      Alert.alert("Not logged in", "Please login first.");
      return;
    }

    try {
      setLoading(true);
      await authApi.setUserRole(user.id, selected);
      setActiveRole(selected);
      await AsyncStorage.setItem("activeRole", selected);
      router.replace("/(dashboard)/(tabs)/dashboard");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Unable to set role.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppScreen scroll contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>Select one of your assigned roles</Text>
        </View>

        <View style={styles.list}>
          {availableRoleCards.map((role) => (
            <TouchableOpacity key={role.key} activeOpacity={0.9} onPress={() => setSelected(role.key)}>
              <AppCard>
                <View style={[styles.roleCard, selected === role.key && styles.roleCardSelected]}>
                  <Text style={[styles.roleTitle, selected === role.key && styles.roleTitleSelected]}>{role.label}</Text>
                  <Text style={styles.roleText}>{role.description}</Text>
                </View>
              </AppCard>
            </TouchableOpacity>
          ))}
          {!availableRoleCards.length && !loadingRoles ? (
            <AppCard>
              <View style={styles.roleCard}>
                <Text style={styles.roleTitle}>No role mapping found</Text>
                <Text style={styles.roleText}>Default donor role will be assigned on next refresh.</Text>
              </View>
            </AppCard>
          ) : null}
        </View>
      </AppScreen>

      <View style={styles.footer}>
        {ngoSession ? <Text style={styles.ngoHint}>NGO Session: {ngoSession.ngoName}</Text> : null}
        <AppButton
          label="Continue"
          onPress={handleContinue}
          disabled={!selected || loadingRoles}
          loading={loading || loadingRoles}
        />
        {ngoSession ? (
          <AppButton label="Continue NGO Session" onPress={() => router.replace("/(dashboard)/(tabs)/dashboard")} />
        ) : null}
        <AppButton label="Login as NGO" variant="ghost" onPress={() => router.push("/(auth)/ngo-login")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
  header: { marginTop: 24 },
  title: { fontSize: 30, fontWeight: "800", color: palette.primaryDark },
  subtitle: { marginTop: 6, color: palette.muted },
  list: { gap: 12, marginTop: 20 },
  roleCard: { gap: 4 },
  roleCardSelected: { backgroundColor: "#ECFDF3", borderRadius: 12, padding: 8 },
  roleTitle: { fontSize: 17, fontWeight: "700", color: palette.text },
  roleTitleSelected: { color: palette.primaryDark },
  roleText: { color: palette.muted, fontSize: 13 },
  footer: { gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: palette.border },
  ngoHint: { color: palette.primaryDark, textAlign: "center", fontWeight: "600", marginBottom: 8 },
});
