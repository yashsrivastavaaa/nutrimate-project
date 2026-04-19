import { AppButton, AppCard, AppScreen } from "@/components/ui";
import { AuthContext } from "@/context/AuthContext";
import { ThemeContext } from "@/context/ThemeContext";
import { authApi, donationApi } from "@/lib/api";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useContext, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  gender?: string | null;
  roles: string[];
};

type NgoProfile = {
  ngoId: number;
  ngoName: string;
  email: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2: string;
  description?: string;
  contactNumber?: string;
  familiesServed?: number;
  donationsReceived?: number;
  status: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, userRoles, setUser, setUserRoles, ngoSession, setNgoSession, activeRole } = useContext(AuthContext);
  const { palette } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [donationStats, setDonationStats] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [ngoProfile, setNgoProfile] = useState<NgoProfile | null>(null);
  const [ngoCompletedCount, setNgoCompletedCount] = useState(0);

  const isNgo = activeRole === "ngo" && !!ngoSession?.ngoId;

  const load = useCallback(async () => {
    try {
      setLoading(true);

      if (isNgo && ngoSession?.ngoId) {
        const ngo = await authApi.getNgoById(ngoSession.ngoId);
        if (ngo) {
          setNgoProfile(ngo as NgoProfile);
        }
        // Fetch completed donations count for NGO
        try {
          const completedDonations = await donationApi.listNgoCompleted(ngoSession.ngoId);
          setNgoCompletedCount((completedDonations as any[]).length);
        } catch (err) {
          console.error("Failed to fetch completed donations:", err);
        }
        return;
      }

      if (user?.id) {
        const profile = await authApi.getUserById(user.id);
        if (profile) {
          setUserProfile({
            id: profile.id,
            fullName: profile.fullName,
            email: profile.email,
            phone: profile.phone,
            gender: profile.gender,
            roles: profile.roles ?? userRoles,
          });
          // Fetch donation success stats for donors
          if (activeRole === "donor") {
            const stats = await donationApi.getDonationSuccessStats(user.id);
            setDonationStats(stats);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isNgo, ngoSession?.ngoId, user?.id, activeRole, userRoles]);

  // Refresh profile when screen is focused
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Helper to get avatar based on gender
  const getAvatar = () => {
    if (isNgo) return "🏢";
    if (userProfile?.gender === "male") return "👨";
    if (userProfile?.gender === "female") return "👩";

    // Get initials as fallback
    if (!userProfile?.fullName) return "?";
    const names = userProfile.fullName.trim().split(" ");
    return names.length > 1
      ? (names[0][0] + names[1][0]).toUpperCase()
      : names[0][0].toUpperCase();
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
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
    ]);
  };

  if (loading) {
    return (
      <AppScreen scroll>
        <Text style={{ ...styles.loading, color: palette.muted }}>Loading profile...</Text>
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        {/* Header */}
        <Text style={{ ...styles.title, color: palette.text }}>Profile</Text>
        <Text style={{ ...styles.subtitle, color: palette.muted }}>
          {isNgo ? "NGO Organization Details" : "Your Personal Profile"}
        </Text>

        {/* Avatar Card */}
        <View style={{ ...styles.avatarCard, backgroundColor: palette.surface }}>
          <View
            style={{
              ...styles.avatar,
              backgroundColor: palette.primary,
            }}
          >
            <Text style={styles.avatarText}>{getAvatar()}</Text>
          </View>
          <View style={styles.avatarInfo}>
            <Text style={{ ...styles.avatarName, color: palette.text }}>
              {isNgo ? ngoProfile?.ngoName : userProfile?.fullName}
            </Text>
            <Text style={{ ...styles.avatarEmail, color: palette.muted }}>
              {isNgo ? ngoProfile?.email : userProfile?.email}
            </Text>
          </View>
        </View>

        {/* User Profile Section */}
        {!isNgo && userProfile && (
          <>
            {/* Roles Badge */}
            <View style={styles.section}>
              <Text style={{ ...styles.sectionLabel, color: palette.muted }}>Roles</Text>
              <View style={styles.rolesContainer}>
                {userProfile.roles.map((role) => (
                  <View
                    key={role}
                    style={{
                      ...styles.roleBadge,
                      backgroundColor: palette.primary,
                    }}
                  >
                    <Text style={styles.roleBadgeText}>{role}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Stats */}
            {activeRole === "donor" && (
              <View
                style={{
                  ...styles.statsCard,
                  backgroundColor: palette.background === "#0F172A" ? "#1E3A1F" : "#EAF8EE",
                  borderLeftColor: palette.primary,
                }}
              >
                <Text style={{ ...styles.statsLabel, color: palette.muted }}>Impact</Text>
                <Text style={{ ...styles.statsValue, color: palette.primary }}>
                  {donationStats} {donationStats === 1 ? "family helped" : "families helped"}
                </Text>
              </View>
            )}

            {/* Personal Details */}
            <View style={styles.section}>
              <Text style={{ ...styles.sectionLabel, color: palette.muted }}>Personal Details</Text>
              <AppCard>
                <DetailRow
                  icon="phone"
                  label="Phone"
                  value={userProfile.phone ?? "Not provided"}
                  palette={palette}
                />
                <DetailRow
                  icon="venus-mars"
                  label="Gender"
                  value={userProfile.gender ? userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1) : "Not specified"}
                  palette={palette}
                />
              </AppCard>
            </View>
          </>
        )}

        {/* NGO Profile Section */}
        {isNgo && ngoProfile && (
          <>
            <View style={styles.section}>
              <Text style={{ ...styles.sectionLabel, color: palette.muted }}>Organization Details</Text>
              <AppCard>
                <DetailRow icon="domain" label="State" value={ngoProfile.state} palette={palette} />
                <DetailRow icon="city" label="City" value={ngoProfile.city} palette={palette} />
                <DetailRow icon="map-marker" label="Sector" value={ngoProfile.addressLine1} palette={palette} />
                <DetailRow icon="home" label="Address" value={ngoProfile.addressLine2} palette={palette} />
              </AppCard>
            </View>

            {ngoProfile.description && (
              <View style={styles.section}>
                <Text style={{ ...styles.sectionLabel, color: palette.muted }}>About</Text>
                <AppCard>
                  <Text style={{ ...styles.descriptionText, color: palette.text }}>
                    {ngoProfile.description}
                  </Text>
                </AppCard>
              </View>
            )}

            <View style={styles.section}>
              <Text style={{ ...styles.sectionLabel, color: palette.muted }}>Statistics</Text>
              <View style={styles.statsRow}>
                <View
                  style={{
                    ...styles.statItem,
                    backgroundColor: palette.surface,
                  }}
                >
                  <MaterialCommunityIcons name="account-multiple" size={24} color={palette.primary} />
                  <Text style={{ ...styles.statItemLabel, color: palette.muted }}>Families Served</Text>
                  <Text style={{ ...styles.statItemValue, color: palette.text }}>
                    {ngoCompletedCount}
                  </Text>
                </View>
                <View
                  style={{
                    ...styles.statItem,
                    backgroundColor: palette.surface,
                  }}
                >
                  <MaterialCommunityIcons name="gift" size={24} color={palette.primary} />
                  <Text style={{ ...styles.statItemLabel, color: palette.muted }}>Donations Received</Text>
                  <Text style={{ ...styles.statItemValue, color: palette.text }}>
                    {ngoCompletedCount}
                  </Text>
                </View>
              </View>
            </View>

            {ngoProfile.contactNumber && (
              <View style={styles.section}>
                <AppCard>
                  <DetailRow
                    icon="phone"
                    label="Contact Number"
                    value={ngoProfile.contactNumber}
                    palette={palette}
                  />
                </AppCard>
              </View>
            )}
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <AppButton
            label="✏️ Edit Profile"
            onPress={() => router.push("/(dashboard)/edit-profile" as any)}
          />

          {!isNgo && activeRole === "donor" && (
            <AppButton
              label="🏆 View Donor Leaderboard"
              onPress={() => router.push("/(dashboard)/leaderboard" as any)}
            />
          )}

          {activeRole === "volunteer" && (
            <AppButton
              label="📦 My Assignments"
              onPress={() => router.push("/(dashboard)/volunteer-assignments" as any)}
            />
          )}

          <AppButton label="Logout" variant="danger" onPress={handleLogout} />
        </View>
      </View>
    </AppScreen>
  );
}

function DetailRow({
  icon,
  label,
  value,
  palette,
}: {
  icon: string;
  label: string;
  value: string | null | undefined;
  palette: any;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailRowLeft}>
        <MaterialCommunityIcons name={icon as any} size={18} color={palette.muted} />
        <Text style={{ ...styles.detailLabel, color: palette.muted }}>{label}</Text>
      </View>
      <Text style={{ ...styles.detailValue, color: palette.text }}>{value ?? "N/A"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 20 },
  title: { fontSize: 30, fontWeight: "800", marginTop: 18 },
  subtitle: { marginTop: 5, fontSize: 14 },
  loading: { marginTop: 18, fontWeight: "600", fontSize: 15, textAlign: "center" },

  // Avatar Card
  avatarCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 40, fontWeight: "700" },
  avatarInfo: { flex: 1 },
  avatarName: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  avatarEmail: { fontSize: 13, marginBottom: 4 },

  // Roles
  rolesContainer: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 8 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  roleBadgeText: { color: "#fff", fontWeight: "600", fontSize: 12 },

  // Sections
  section: { marginTop: 16 },
  sectionLabel: { fontSize: 12, fontWeight: "700", marginBottom: 8, textTransform: "uppercase" },

  // Stats
  statsCard: {
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
    borderLeftWidth: 4,
  },
  statsLabel: { fontSize: 12, fontWeight: "700" },
  statsValue: { fontSize: 28, fontWeight: "800", marginTop: 6 },

  statsRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  statItem: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    gap: 8,
  },
  statItemLabel: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  statItemValue: { fontSize: 20, fontWeight: "800" },

  // Detail Row
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  detailRowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailLabel: { fontSize: 13, fontWeight: "600" },
  detailValue: { fontSize: 14, fontWeight: "700" },

  descriptionText: { fontSize: 14, lineHeight: 20 },

  // Actions
  actions: { marginTop: 20, gap: 10 },
});
