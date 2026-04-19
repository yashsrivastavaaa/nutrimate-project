import { AppButton, AppCard, AppScreen } from "@/components/ui";
import { AuthContext } from "@/context/AuthContext";
import { clearLocalSession } from "@/lib/session";
import { palette } from "@/lib/theme";
import { useRouter } from "expo-router";
import { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const { user, userRoles, setUser, setUserRoles, setActiveRole, setNgoSession } = useContext(AuthContext);

  const onLogout = async () => {
    await clearLocalSession({ setUser, setUserRoles, setActiveRole, setNgoSession });
    router.replace("/");
  };

  const features = [
    { title: "Share Food", desc: "Post surplus donations", icon: "🍽️" },
    { title: "Help NGOs", desc: "Support food distribution", icon: "🤝" },
    { title: "Volunteer", desc: "Contribute your time", icon: "👥" },
  ];

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back! 👋</Text>
        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName ?? "User"}</Text>
            <Text style={styles.userEmail}>{user?.email ?? "N/A"}</Text>
            {userRoles.length > 0 && (
              <View style={styles.rolesContainer}>
                {userRoles.map((role) => (
                  <View key={role} style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{role}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Start</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature) => (
            <View key={feature.title} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Activities</Text>
        <AppCard>
          <View style={styles.activityRow}>
            <View>
              <Text style={styles.activityLabel}>Active Role</Text>
              <Text style={styles.activityValue}>{user?.role ?? "Donor"}</Text>
            </View>
          </View>
        </AppCard>
      </View>

      {user?.role === "donor" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discovery & Recognition</Text>
          <AppButton
            label="🏆 View Donor Leaderboard"
            onPress={() => router.push("/(dashboard)/leaderboard" as any)}
          />
          <AppButton
            label="❤️ My Favorite NGOs"
            onPress={() => router.push("/(dashboard)/favorite-ngos" as any)}
          />
        </View>
      )}

      <View style={styles.actions}>
        <AppButton
          label="Change Role"
          onPress={() => router.replace("/(onboarding)/role-select")}
        />
        <AppButton
          label="Sign Out"
          variant="danger"
          onPress={onLogout}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 20, marginBottom: 24 },
  greeting: { fontSize: 28, fontWeight: "800", color: palette.primaryDark, marginBottom: 16 },
  userCard: {
    backgroundColor: "#EAF8EE",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: palette.primary,
  },
  userInfo: { gap: 8 },
  userName: { fontSize: 18, fontWeight: "700", color: palette.primaryDark },
  userEmail: { fontSize: 14, color: palette.muted, fontWeight: "500" },
  rolesContainer: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 4 },
  roleBadge: {
    backgroundColor: palette.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  roleBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: palette.text, marginBottom: 12 },
  featuresGrid: { flexDirection: "row", gap: 10 },
  featureCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border,
  },
  featureIcon: { fontSize: 28, marginBottom: 6 },
  featureTitle: { fontSize: 13, fontWeight: "700", color: palette.text, textAlign: "center" },
  featureDesc: { fontSize: 11, color: palette.muted, textAlign: "center", marginTop: 4 },
  activityRow: { gap: 12 },
  activityLabel: { fontSize: 12, color: palette.muted, fontWeight: "700" },
  activityValue: { fontSize: 16, color: palette.text, fontWeight: "700", marginTop: 4 },
  actions: { marginTop: 20, marginBottom: 20, gap: 10 },
});
