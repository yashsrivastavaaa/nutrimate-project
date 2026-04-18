import { AppButton, AppInput } from "@/components/ui";
import { palette } from "@/lib/theme";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function SignupScreen() {
    const { signUp, isLoaded } = useSignUp();
    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [gender, setGender] = useState<"male" | "female" | "other" | "">("");

    const [avatarType, setAvatarType] = useState<
        "default" | "male" | "female"
    >("default");

    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState("");

    const [errors, setErrors] = useState<any>({});

    if (!isLoaded) return null;

    // 🔤 Initials Avatar
    const getInitials = () => {
        if (!fullName) return "?";
        const names = fullName.trim().split(" ");
        return names.length > 1
            ? (names[0][0] + names[1][0]).toUpperCase()
            : names[0][0].toUpperCase();
    };

    // ✅ Validation
    const validate = () => {
        let newErrors: any = {};

        if (!fullName.trim()) {
            newErrors.fullName = "Full name is required";
        }

        if (!emailAddress.includes("@")) {
            newErrors.email = "Enter a valid email";
        }

        if (password.length < 6) {
            newErrors.password = "Minimum 6 characters required";
        }

        if (phone && phone.length < 10) {
            newErrors.phone = "Invalid phone number";
        }

        if (!gender) {
            newErrors.gender = "Select gender";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 🔐 Signup
    const onSignUpPress = async () => {
        setServerError("");

        if (!validate()) return;

        setLoading(true);

        try {
            const nameParts = fullName.trim().split(" ");
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

            await signUp.create({
                emailAddress,
                password,
                firstName,
                lastName,
                unsafeMetadata: {
                    gender,
                    avatarType,
                },
            });

            await signUp.prepareEmailAddressVerification({
                strategy: "email_code",
            });

            router.push({
                pathname: "/(auth)/verify-otp",
                params: {
                    emailAddress,
                    fullName,
                    phone,
                    gender,
                    avatarType,
                    password,
                },
            });
        } catch (err: any) {
            const code = err?.errors?.[0]?.code;

            switch (code) {
                case "form_identifier_exists":
                    setServerError("This email is already registered.");
                    break;

                case "form_password_pwned":
                    setServerError("Password too weak or commonly used.");
                    break;

                case "form_password_length_too_short":
                    setServerError("Password must be at least 6 characters.");
                    break;

                case "form_identifier_invalid":
                    setServerError("Invalid email address.");
                    break;

                default:
                    setServerError("Something went wrong. Try again.");
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
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join NutriMate 🌱</Text>
                </View>

                {/* Avatar */}
                <View style={styles.avatarWrapper}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {avatarType === "default"
                                ? getInitials()
                                : avatarType === "male"
                                    ? "👨"
                                    : "👩"}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={{ color: "#fff" }}>✏️</Text>
                    </TouchableOpacity>
                </View>

                {/* 🔴 Server Error */}
                {serverError ? (
                    <View style={styles.serverErrorBox}>
                        <Text style={styles.serverErrorText}>{serverError}</Text>
                    </View>
                ) : null}

                {/* Form */}
                <View style={styles.form}>
                    <AppInput
                        label="Full Name"
                        placeholder="John Doe"
                        value={fullName}
                        onChangeText={(t) => {
                            setFullName(t);
                            setErrors({ ...errors, fullName: "" });
                        }}
                        error={errors.fullName}
                    />

                    <AppInput
                        label="Phone Number"
                        placeholder="9876543210"
                        value={phone}
                        onChangeText={(t) => {
                            setPhone(t);
                            setErrors({ ...errors, phone: "" });
                        }}
                        keyboardType="phone-pad"
                        error={errors.phone}
                    />

                    <AppInput
                        label="Email Address"
                        placeholder="you@example.com"
                        value={emailAddress}
                        onChangeText={(t) => {
                            setEmailAddress(t);
                            setErrors({ ...errors, email: "" });
                        }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        error={errors.email}
                    />

                    <AppInput
                        label="Password"
                        placeholder="Minimum 6 characters"
                        value={password}
                        secureTextEntry
                        onChangeText={(t) => {
                            setPassword(t);
                            setErrors({ ...errors, password: "" });
                        }}
                        error={errors.password}
                    />

                    {/* Gender Selection */}
                    <Text style={styles.label}>Gender</Text>
                    <View style={styles.genderRow}>
                        {["male", "female", "other"].map((g) => (
                            <TouchableOpacity
                                key={g}
                                style={[
                                    styles.genderBtn,
                                    gender === g && styles.genderActive,
                                ]}
                                onPress={() => {
                                    setGender(g as any);
                                    setErrors({ ...errors, gender: "" });
                                }}
                                accessibilityLabel={`Gender: ${g}`}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: gender === g }}
                            >
                                <Text
                                    style={[
                                        styles.genderText,
                                        gender === g && { color: "#fff" },
                                    ]}
                                >
                                    {g.charAt(0).toUpperCase() + g.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {errors.gender && (
                        <Text style={styles.errorText}>{errors.gender}</Text>
                    )}
                </View>

                {/* Button */}
                <View style={styles.buttonContainer}>
                    <AppButton
                        label={loading ? "Creating account..." : "Create Account"}
                        onPress={onSignUpPress}
                        loading={loading}
                        disabled={loading}
                    />
                </View>
            </ScrollView>

            {/* Avatar Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.bottomSheet}>
                        <Text style={styles.modalTitle}>Choose Avatar</Text>

                        <View style={styles.options}>
                            <TouchableOpacity
                                style={styles.optionCard}
                                onPress={() => {
                                    setAvatarType("male");
                                    setModalVisible(false);
                                }}
                            >
                                <Text style={styles.optionEmoji}>👨</Text>
                                <Text>Male</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.optionCard}
                                onPress={() => {
                                    setAvatarType("female");
                                    setModalVisible(false);
                                }}
                            >
                                <Text style={styles.optionEmoji}>👩</Text>
                                <Text>Female</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancel}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 24 },

    header: { marginTop: 50, alignItems: "center" },

    title: {
        fontSize: 30,
        fontWeight: "700",
        color: palette.primaryDark,
    },

    subtitle: { color: palette.muted, marginTop: 6 },

    label: {
        fontSize: 13,
        color: palette.muted,
        fontWeight: "600",
        marginBottom: 8,
    },

    avatarWrapper: { alignItems: "center", marginVertical: 30 },

    avatar: {
        width: 110,
        height: 110,
        borderRadius: 60,
        backgroundColor: "#DCFCE7",
        alignItems: "center",
        justifyContent: "center",
    },

    avatarText: { fontSize: 34, fontWeight: "700", color: "#065F46" },

    editButton: {
        position: "absolute",
        bottom: 5,
        right: 120,
        backgroundColor: "#16A34A",
        borderRadius: 20,
        padding: 8,
    },

    form: { marginTop: 18, gap: 14 },

    errorText: {
        color: palette.danger,
        fontSize: 12,
        marginBottom: 6,
    },

    genderRow: { flexDirection: "row", gap: 10, marginBottom: 8 },

    genderBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: palette.border,
        alignItems: "center",
        backgroundColor: "#fff",
    },

    genderActive: {
        backgroundColor: palette.primary,
        borderColor: palette.primary,
    },

    genderText: { color: palette.text, fontWeight: "600" },

    buttonContainer: { marginTop: 20 },

    serverErrorBox: {
        backgroundColor: "#FEF2F2",
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: palette.danger,
    },

    serverErrorText: {
        color: palette.danger,
        fontSize: 13,
        textAlign: "center",
    },

    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.3)",
    },

    bottomSheet: {
        backgroundColor: "#fff",
        padding: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 16,
    },

    options: {
        flexDirection: "row",
        justifyContent: "space-around",
    },

    optionCard: {
        alignItems: "center",
        padding: 16,
        borderRadius: 16,
        backgroundColor: "#F0FDF4",
        width: 120,
    },

    optionEmoji: { fontSize: 30, marginBottom: 6 },

    cancel: {
        textAlign: "center",
        marginTop: 20,
        color: "#6B7280",
    },
});