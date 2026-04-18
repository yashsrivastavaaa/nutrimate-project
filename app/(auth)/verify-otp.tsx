import { authApi } from "@/lib/api";
import { useSignUp } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function VerifyOtpScreen() {
    const { signUp, setActive, isLoaded } = useSignUp();
    const router = useRouter();

    // ✅ FIX: keep your existing emailAddress but ALSO add params object
    const params = useLocalSearchParams();
    const { emailAddress } = params;

    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(""); // inline validation
    const [serverError, setServerError] = useState(""); // clerk errors

    if (!isLoaded) return null;

    // ✅ Validate OTP
    const validate = () => {
        if (code.length !== 6) {
            setError("Enter a valid 6-digit OTP");
            return false;
        }
        setError("");
        return true;
    };

    const onVerify = async () => {
        if (!signUp || !setActive) return;

        setServerError("");

        if (!validate()) return;

        setLoading(true);

        try {
            const result = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });

                // 🔥 CLEAN DB SYNC (NO RAW FETCH)
                try {
                    await authApi.createUser({
                        id: result.createdUserId || "", // ✅ ensure we have an ID
                        fullName: (Array.isArray(params?.fullName) ? params.fullName[0] : params?.fullName) || "",
                        email: (Array.isArray(params?.emailAddress) ? params.emailAddress[0] : params?.emailAddress) || "",
                        phone: (Array.isArray(params?.phone) ? params.phone[0] : params?.phone) || "",
                        gender: (Array.isArray(params?.gender) ? params.gender[0] : params?.gender) || "",
                        avatarType: (Array.isArray(params?.avatarType) ? params.avatarType[0] : params?.avatarType) || "default",
                        password: (Array.isArray(params?.password) ? params.password[0] : params?.password) || "",
                        role: "donor",
                    });
                } catch (e) {
                    console.log("DB sync error:", e);
                }

                router.replace("/(dashboard)/doner");
            }
        } catch (err: any) {
            const codeErr = err?.errors?.[0]?.code;

            switch (codeErr) {
                case "form_code_incorrect":
                    setServerError("Incorrect OTP. Please try again.");
                    break;

                case "form_code_expired":
                    setServerError("OTP expired. Please request a new one.");
                    break;

                case "form_code_missing":
                    setServerError("Please enter the OTP.");
                    break;

                default:
                    setServerError("Verification failed. Try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const onResend = async () => {
        if (!signUp) return;

        try {
            setLoading(true);
            setServerError("");
            setCode("");

            await signUp.prepareEmailAddressVerification({
                strategy: "email_code",
            });

            setServerError(""); // Clear any previous error
            // Show success message by temporarily setting code state or via toast
        } catch (err: any) {
            const codeErr = err?.errors?.[0]?.code;
            switch (codeErr) {
                case "rate_limit":
                    setServerError("Too many attempts. Please try again in a few minutes.");
                    break;
                default:
                    setServerError("Failed to resend code. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: "#F8FAFC" }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView contentContainerStyle={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Verify Email</Text>
                    <Text style={styles.subtitle}>
                        Enter the 6-digit code sent to{" "}
                        <Text style={styles.email}>
                            {emailAddress || "your email"} {/* ✅ small fix */}
                        </Text>
                    </Text>
                </View>

                {/* 🔴 Server Error */}
                {serverError ? (
                    <View style={styles.serverErrorBox}>
                        <Text style={styles.serverErrorText}>{serverError}</Text>
                    </View>
                ) : null}

                {/* OTP Input */}
                <View style={styles.form}>
                    <TextInput
                        style={[
                            styles.input,
                            (error || serverError) && styles.inputError,
                        ]}
                        value={code}
                        onChangeText={(text) => {
                            setCode(text);
                            setError("");
                            setServerError("");
                        }}
                        keyboardType="number-pad"
                        placeholder="Enter OTP"
                        placeholderTextColor="#9CA3AF"
                        maxLength={6}
                    />

                    {/* Inline Error */}
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </View>

                {/* Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            (loading || code.length < 6) && { opacity: 0.6 },
                        ]}
                        onPress={onVerify}
                        disabled={loading || code.length < 6}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Verify</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onResend} disabled={loading}>
                        <Text style={styles.resend}>
                            Didn't receive code?{" "}
                            <Text style={[styles.resendLink, loading && { opacity: 0.6 }]}>Resend</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: "space-between",
        padding: 24,
    },

    header: {
        marginTop: 60,
    },

    title: {
        fontSize: 30,
        fontWeight: "700",
        color: "#065F46",
    },

    subtitle: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 8,
        lineHeight: 20,
    },

    email: {
        color: "#16A34A",
        fontWeight: "600",
    },

    form: {
        marginTop: 40,
    },

    input: {
        backgroundColor: "#FFFFFF",
        padding: 18,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        fontSize: 18,
        textAlign: "center",
        letterSpacing: 8,
    },

    inputError: {
        borderColor: "#EF4444",
    },

    errorText: {
        color: "#EF4444",
        fontSize: 12,
        marginTop: 6,
    },

    footer: {
        marginTop: 40,
        gap: 16,
    },

    button: {
        backgroundColor: "#16A34A",
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: "center",
    },

    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },

    resend: {
        textAlign: "center",
        color: "#6B7280",
    },

    resendLink: {
        color: "#16A34A",
        fontWeight: "600",
    },

    // 🔥 Error UI
    serverErrorBox: {
        backgroundColor: "#FEF2F2",
        padding: 12,
        borderRadius: 10,
        marginTop: 20,
        borderWidth: 1,
        borderColor: "#FECACA",
    },

    serverErrorText: {
        color: "#DC2626",
        fontSize: 13,
        textAlign: "center",
    },
});
