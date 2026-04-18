import { AuthContext } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useContext, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { palette } from "@/lib/theme";
import { AppRole, NgoEntity, UserEntity } from "@/lib/types";

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, ngoSession, setUser, setUserRoles, setActiveRole, setNgoSession } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedUser, storedRole, storedNgo, storedRoles] = await AsyncStorage.multiGet([
          "userData",
          "activeRole",
          "ngoSession",
          "userRoles",
        ]);

        if (storedUser?.[1]) {
          const parsedUser = JSON.parse(storedUser[1]) as UserEntity;
          setUser(parsedUser);
          if (parsedUser.roles?.length) {
            setUserRoles(parsedUser.roles);
          }
        }
        if (storedRole?.[1]) setActiveRole(storedRole[1] as AppRole);
        if (storedRoles?.[1]) setUserRoles(JSON.parse(storedRoles[1]) as AppRole[]);
        if (storedNgo?.[1]) {
          setNgoSession(
            JSON.parse(storedNgo[1]) as Pick<NgoEntity, "ngoId" | "email" | "ngoName" | "city" | "state">
          );
        }
      } catch (e) {
        console.error("Failed to restore session:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [setActiveRole, setNgoSession, setUser, setUserRoles]);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  if (user || ngoSession) {
    return <Redirect href="/(onboarding)/role-select" />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>NutriMate</Text>
        <Text style={styles.subtitle}>Food rescue network for donors, NGOs, and volunteers.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardText}>Share food quickly, track every stage, and reduce waste.</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/(auth)/signup")}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/(auth)/login")}>
          <Text style={styles.secondaryButtonText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: palette.background },
  container: { flex: 1, backgroundColor: palette.background, paddingHorizontal: 24, paddingTop: 90, paddingBottom: 40 },
  header: { alignItems: "center" },
  title: { fontSize: 44, fontWeight: "800", color: palette.primaryDark },
  subtitle: { fontSize: 15, color: palette.muted, marginTop: 8, textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 28,
    marginTop: 70,
  },
  cardText: { color: palette.primaryDark, fontSize: 20, fontWeight: "700", lineHeight: 30, textAlign: "center" },
  footer: { marginTop: "auto", gap: 12 },
  primaryButton: { backgroundColor: palette.primary, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryButton: { borderWidth: 1, borderColor: palette.border, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  secondaryButtonText: { color: "#374151", fontWeight: "600" },
});
