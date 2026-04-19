import { DonorBadge } from "@/components/DonorBadge";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppScreen } from "@/components/ui/AppScreen";
import { AuthContext } from "@/context/AuthContext";
import { ThemeContext } from "@/context/ThemeContext";
import { donationApi } from "@/lib/api/donation";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useContext, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

interface NgoProfile {
    ngoId: number;
    ngoName: string;
    email: string;
    description: string | null;
    contactNumber: string | null;
    state: string;
    city: string;
    addressLine1: string;
    familiesServed: number;
    donationsReceived: number;
    status: string;
}

export default function PublicNgoProfileScreen() {
    const { palette } = useContext(ThemeContext);
    const { user } = useContext(AuthContext);
    const route = useRoute();
    const navigation = useNavigation();
    const { ngoId } = route.params as { ngoId: number };

    const [profile, setProfile] = useState<NgoProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [completedCount, setCompletedCount] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                const data = await donationApi.getNgoProfilePublic(ngoId);
                if (data[0]) {
                    setProfile(data[0] as NgoProfile);

                    // Fetch completed donations count
                    try {
                        const completedDonations = await donationApi.listNgoCompleted(ngoId);
                        setCompletedCount((completedDonations as any[]).length);
                    } catch (err) {
                        console.error("Failed to fetch completed donations:", err);
                    }

                    // Check if favorite
                    if (user?.id) {
                        try {
                            const favorite = await donationApi.isFavoriteNgo(user.id, ngoId);
                            setIsFavorite(favorite);
                        } catch (err) {
                            console.error("Failed to fetch favorite status:", err);
                        }
                    }
                } else {
                    Alert.alert("Error", "NGO profile not found");
                    navigation.goBack();
                }
            } catch (error) {
                Alert.alert("Error", "Failed to load NGO profile");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [ngoId, user?.id]);

    const handleToggleFavorite = async () => {
        if (!user?.id) {
            Alert.alert("Error", "Please log in to add favorites");
            return;
        }

        try {
            setFavoriteLoading(true);
            await donationApi.toggleFavoriteNgo(user.id, ngoId);
            setIsFavorite(!isFavorite);
        } catch (error) {
            Alert.alert("Error", "Failed to update favorite status");
            console.error(error);
        } finally {
            setFavoriteLoading(false);
        }
    };

    if (loading) {
        return (
            <AppScreen>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={palette.primary} />
                </View>
            </AppScreen>
        );
    }

    if (!profile) {
        return (
            <AppScreen>
                <View style={styles.centerContainer}>
                    <Text style={[styles.errorText, { color: palette.text }]}>Profile not found</Text>
                </View>
            </AppScreen>
        );
    }

    const isVerified = profile.status === "approved";

    return (
        <AppScreen>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: palette.primary }]}>
                    <MaterialCommunityIcons name="hospital-box" size={48} color="white" />
                    <View style={styles.headerContent}>
                        <View style={styles.nameSection}>
                            <Text style={styles.ngoName} numberOfLines={2}>
                                {profile.ngoName}
                            </Text>
                        </View>
                        <Text style={styles.location}>
                            {profile.city}, {profile.state}
                        </Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <AppCard variant="compact">
                        <View style={styles.statRow}>
                            <View style={styles.statItem}>
                                <MaterialCommunityIcons name="home-heart" size={24} color={palette.primary} />
                                <Text style={[styles.statNumber, { color: palette.text }]}>
                                    {completedCount}
                                </Text>
                                <Text style={[styles.statLabel, { color: palette.muted }]}>Families Served</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.statItem}>
                                <MaterialCommunityIcons name="gift" size={24} color={palette.primary} />
                                <Text style={[styles.statNumber, { color: palette.text }]}>
                                    {completedCount}
                                </Text>
                                <Text style={[styles.statLabel, { color: palette.muted }]}>Donations Received</Text>
                            </View>
                        </View>
                    </AppCard>
                </View>

                {/* Description */}
                {profile.description && (
                    <AppCard>
                        <Text style={[styles.sectionTitle, { color: palette.text }]}>About</Text>
                        <Text style={[styles.description, { color: palette.text }]}>{profile.description}</Text>
                    </AppCard>
                )}

                {/* Contact Information */}
                <AppCard>
                    <Text style={[styles.sectionTitle, { color: palette.text }]}>Contact Information</Text>

                    <View style={styles.contactItem}>
                        <MaterialCommunityIcons name="email" size={18} color={palette.primary} />
                        <Text style={[styles.contactText, { color: palette.text }]}>{profile.email}</Text>
                    </View>

                    {profile.contactNumber && (
                        <View style={styles.contactItem}>
                            <MaterialCommunityIcons name="phone" size={18} color={palette.primary} />
                            <Text style={[styles.contactText, { color: palette.text }]}>
                                {profile.contactNumber}
                            </Text>
                        </View>
                    )}

                    <View style={styles.contactItem}>
                        <MaterialCommunityIcons name="map-marker" size={18} color={palette.primary} />
                        <Text style={[styles.contactText, { color: palette.text }]}>
                            {profile.addressLine1}, {profile.city}, {profile.state}
                        </Text>
                    </View>
                </AppCard>

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.backBox, { backgroundColor: palette.primary }]}
                    >
                        <Text style={styles.backBoxText}>Back</Text>
                    </TouchableOpacity>

                    <AppButton
                        label={isFavorite ? "❤️ Remove from Favorites" : "🤍 Add to Favorites"}
                        onPress={handleToggleFavorite}
                        disabled={favoriteLoading}
                    />
                </View>

            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 14,
        gap: 14,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorText: {
        fontSize: 16,
        fontWeight: "500",
    },
    header: {
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },
    headerContent: {
        flex: 1,
        justifyContent: "center",
    },
    nameSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    ngoName: {
        fontSize: 18,
        fontWeight: "700",
        color: "white",
        flex: 1,
    },
    location: {
        fontSize: 13,
        color: "rgba(255,255,255,0.8)",
    },
    statsContainer: {
        marginVertical: 8,
    },
    statRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
    },
    statItem: {
        alignItems: "center",
        gap: 4,
        flex: 1,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: "700",
    },
    statLabel: {
        fontSize: 11,
        textAlign: "center",
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: "#E0E0E0",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
    },
    contactItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    contactText: {
        fontSize: 14,
        flex: 1,
    },
    actionContainer: {
        marginTop: 12,
        marginBottom: 20,
        gap: 10,
    },
    backBox: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    backBoxText: {
        fontSize: 16,
        fontWeight: "600",
        color: "white",
    },
});
