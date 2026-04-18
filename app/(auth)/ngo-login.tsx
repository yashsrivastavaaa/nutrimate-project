import { AppButton, AppInput, AppScreen } from "@/components/ui";
import { AuthContext } from "@/context/AuthContext";
import { authApi } from "@/lib/api";
import { palette } from "@/lib/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useContext, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function NgoLoginScreen() {
  const router = useRouter();
  const { setNgoSession, setActiveRole } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("All fields are required.");
      return;
    }

    try {
      setLoading(true);

      // Keep NGO auth behavior as requested: email + password lookup.
      const response = await authApi.loginNgo(email.trim(), password);

      if (!response.success || !response.data) {
        setError(response.message);
        return;
      }

      const ngo = response.data;
      const session = {
        ngoId: ngo.ngoId,
        email: ngo.email,
        ngoName: ngo.ngoName,
        city: ngo.city,
        state: ngo.state,
      };
      setNgoSession(session);
      setActiveRole("ngo");
      await AsyncStorage.multiSet([
        ["ngoSession", JSON.stringify(session)],
        ["activeRole", "ngo"],
      ]);

      Alert.alert("Success", response.message);
      router.replace("/(dashboard)/(tabs)/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>NGO Login</Text>
        <Text style={styles.subtitle}>Access your operations dashboard</Text>
      </View>

      <View style={styles.form}>
        <AppInput
          label="NGO Email"
          placeholder="ngo@example.org"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={error}
        />
        <AppInput
          label="Password"
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={styles.footer}>
        <AppButton label="Login" onPress={onLogin} loading={loading} />
        <TouchableOpacity onPress={() => router.push("/(auth)/ngo-signup")}>
          <Text style={styles.link}>New NGO? Create account</Text>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 50, gap: 6 },
  title: { fontSize: 32, fontWeight: "800", color: palette.primaryDark },
  subtitle: { color: palette.muted },
  form: { marginTop: 24, gap: 14 },
  footer: { marginTop: 28, gap: 14 },
  link: { textAlign: "center", color: palette.primaryDark, fontWeight: "700" },
});
