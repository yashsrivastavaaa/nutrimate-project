import { AppButton, AppInput, AppScreen } from "@/components/ui";
import { authApi } from "@/lib/api";
import { palette } from "@/lib/theme";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const FIXED_STATE = "Uttar Pradesh";
const FIXED_CITY = "Greater Noida";
const SECTORS = ["Delta 1", "Alpha 1", "Alpha 2"] as const;

export default function NgoSignupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    ngoName: "",
    email: "",
    password: "",
    state: FIXED_STATE,
    city: FIXED_CITY,
    addressLine1: "",
    addressLine2: "",
  });

  const onSubmit = async () => {
    setError("");
    if (
      !form.ngoName ||
      !form.email ||
      !form.password ||
      !form.state ||
      !form.city ||
      !form.addressLine1 ||
      !form.addressLine2
    ) {
      setError("All fields are required.");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Validate password strength
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    // Validate NGO name
    if (form.ngoName.trim().length < 3) {
      setError("NGO name must be at least 3 characters long.");
      return;
    }

    try {
      setLoading(true);
      const result = await authApi.createNgo(form);
      if (!result.success) {
        setError(result.message ?? "Unable to create NGO.");
        return;
      }
      Alert.alert("Success", "NGO account created. Please wait for admin approval before logging in.");
      router.replace("/(auth)/ngo-login");
    } catch (e) {
      console.error(e);
      setError("Something went wrong while creating account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>NGO Sign Up</Text>
        <Text style={styles.subtitle}>Create your organization account</Text>
      </View>

      <View style={styles.form}>
        <AppInput
          label="NGO Name"
          placeholder="Hope Kitchen Foundation"
          value={form.ngoName}
          onChangeText={(ngoName) => setForm((s) => ({ ...s, ngoName }))}
          error={error}
        />
        <AppInput
          label="Email"
          placeholder="ngo@example.org"
          value={form.email}
          onChangeText={(email) => setForm((s) => ({ ...s, email }))}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <AppInput
          label="Password"
          placeholder="Create password"
          value={form.password}
          onChangeText={(password) => setForm((s) => ({ ...s, password }))}
          secureTextEntry
        />
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
        <Text style={styles.label}>Sector</Text>
        <View style={styles.chips}>
          {SECTORS.map((sector) => (
            <TouchableOpacity
              key={sector}
              style={[styles.chip, form.addressLine1 === sector && styles.chipActive]}
              onPress={() => setForm((s) => ({ ...s, addressLine1: sector }))}
            >
              <Text style={[styles.chipText, form.addressLine1 === sector && styles.chipTextActive]}>
                {sector}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <AppInput
          label="Address Line 2"
          placeholder="Building, block, landmark"
          value={form.addressLine2}
          onChangeText={(addressLine2) => setForm((s) => ({ ...s, addressLine2 }))}
        />
      </View>

      <View style={styles.footer}>
        <AppButton label="Create NGO Account" onPress={onSubmit} loading={loading} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 30, gap: 6 },
  title: { fontSize: 32, fontWeight: "800", color: palette.primaryDark },
  subtitle: { color: palette.muted },
  form: { marginTop: 20, gap: 14 },
  footer: { marginTop: 24 },
  label: { fontSize: 13, color: palette.muted, fontWeight: "700" },
  chips: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  chipActive: { borderColor: palette.primary, backgroundColor: "#EAF8EE" },
  chipText: { color: "#334155", fontWeight: "600", fontSize: 12 },
  chipTextActive: { color: palette.primaryDark },
});
