import { AppButton, AppInput, AppScreen } from "@/components/ui";
import { AuthContext } from "@/context/AuthContext";
import { authApi } from "@/lib/api";
import { palette } from "@/lib/theme";
import { AppRole } from "@/lib/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useContext, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const { setUser, setUserRoles, setActiveRole } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      // DB-first login flow: no Clerk check for existing app users.
      const user = await authApi.loginUser(email.trim(), password);
      if (!user) {
        setError("Invalid email or password.");
        return;
      }

      const roles = (user.roles?.length ? user.roles : ["donor"]) as AppRole[];
      setUser(user);
      setUserRoles(roles);
      setActiveRole(roles[0]);
      await AsyncStorage.multiSet([
        ["userData", JSON.stringify(user)],
        ["activeRole", roles[0]],
        ["userRoles", JSON.stringify(roles)],
      ]);

      router.replace("/(onboarding)/role-select");
    } catch (err: any) {
      const msg = err?.message ?? "Login failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Login to continue with NutriMate</Text>
      </View>

      <View style={styles.form}>
        <AppInput
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={error}
        />
        <AppInput
          label="Password"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <View style={styles.footer}>
        <AppButton label="Login" onPress={onLogin} loading={loading} />
        <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
          <Text style={styles.link}>Don&apos;t have an account? Sign up</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(auth)/ngo-login")}>
          <Text style={styles.linkSecondary}>Login as NGO</Text>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 40, gap: 6 },
  title: { fontSize: 32, fontWeight: "800", color: palette.primaryDark },
  subtitle: { color: palette.muted, fontSize: 14 },
  form: { marginTop: 26, gap: 14 },
  footer: { marginTop: 26, gap: 14 },
  link: { textAlign: "center", color: palette.muted, fontWeight: "600" },
  linkSecondary: { textAlign: "center", color: palette.primaryDark, fontWeight: "700" },
});
