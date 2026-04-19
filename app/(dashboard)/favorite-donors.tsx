import { FavoriteDonorsList } from "@/components/FavoriteDonorsList";
import { AppScreen } from "@/components/ui/AppScreen";
import { AuthContext } from "@/context/AuthContext";
import { ThemeContext } from "@/context/ThemeContext";
import { donationApi } from "@/lib/api/donation";
import { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";

interface FavoriteDonor {
    userId: string;
    fullName: string;
    email: string;
    donationCount: number | null;
    isVerified: number | null;
}

export default function FavoriteDonorsScreen() {
    const { palette } = useContext(ThemeContext);
    const { ngoSession } = useContext(AuthContext);
    const [donors, setDonors] = useState<FavoriteDonor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDonors = async () => {
            if (!ngoSession) return;

            try {
                setLoading(true);
                const data = await donationApi.getFavoriteDonors(ngoSession.ngoId);
                setDonors(data as FavoriteDonor[]);
            } catch (error) {
                Alert.alert("Error", "Failed to load favorite donors");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        loadDonors();
    }, [ngoSession]);

    const handleRemove = async (donorId: string) => {
        if (!ngoSession) return;

        try {
            await donationApi.toggleFavoriteDonor(ngoSession.ngoId, donorId);
            setDonors((prev) => prev.filter((d) => d.userId !== donorId));
        } catch (error) {
            throw error;
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

    const formattedDonors = donors.map((d) => ({
        userId: d.userId,
        fullName: d.fullName,
        email: d.email,
        donationCount: d.donationCount || 0,
        isVerified: (d.isVerified || 0) === 1,
    }));

    return (
        <AppScreen>
            <View style={styles.container}>
                <FavoriteDonorsList donors={formattedDonors} onRemove={handleRemove} loading={loading} />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 14,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
