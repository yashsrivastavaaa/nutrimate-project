import { AuthContext } from "@/context/AuthContext";
import { clearLocalSession } from "@/lib/session";
import { palette } from "@/lib/theme";
import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useContext, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function AppHeaderActions() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { setUser, setUserRoles, setActiveRole, setNgoSession } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    try {
      setLoading(true);
      // Sign out Clerk session when available; ignore when NGO-only session is active.
      await signOut();
    } catch {
      // noop
    } finally {
      await clearLocalSession({ setUser, setUserRoles, setActiveRole, setNgoSession });
      setLoading(false);
      router.replace("/");
    }
  };

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: onLogout },
    ]);
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.push("/(dashboard)/(tabs)/profile")}
        accessibilityLabel="View Profile"
        accessibilityRole="button"
      >
        <Text style={styles.btnText}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.push("/(onboarding)/role-select")}
        accessibilityLabel="Switch Roles"
        accessibilityRole="button"
      >
        <Text style={styles.btnText}>Roles</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, styles.logoutBtn, loading && { opacity: 0.6 }]}
        onPress={confirmLogout}
        disabled={loading}
        accessibilityLabel="Logout"
        accessibilityRole="button"
        accessibilityState={{ disabled: loading, busy: loading }}
      >
        <Text style={styles.logoutText}>{loading ? "..." : "Logout"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#E8F7ED",
    borderColor: "#D7F0DF",
    borderWidth: 1,
  },
  btnText: {
    fontSize: 12,
    color: palette.primaryDark,
    fontWeight: "700",
  },
  logoutBtn: {
    backgroundColor: "#FEECEC",
    borderColor: "#FCD2D2",
  },
  logoutText: {
    fontSize: 12,
    color: palette.danger,
    fontWeight: "700",
  },
});
