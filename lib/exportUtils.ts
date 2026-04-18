import { Share } from "react-native";

export type DonationHistoryRecord = {
    id: string;
    title: string;
    status: string;
    createdAt: Date | null;
    ngoName: string | null;
};

// Convert array of donations to CSV format
export const generateCSV = (donations: DonationHistoryRecord[]): string => {
    if (donations.length === 0) {
        return "Donation ID,Title,Status,Date,NGO Name\n";
    }

    const headers = ["Donation ID", "Title", "Status", "Date", "NGO Name"];
    const rows = donations.map((donation) => {
        const date = donation.createdAt ? new Date(donation.createdAt).toLocaleDateString() : "N/A";
        return [
            `"${donation.id}"`,
            `"${donation.title.replace(/"/g, '""')}"`,
            `"${donation.status}"`,
            `"${date}"`,
            `"${(donation.ngoName || "Not assigned").replace(/"/g, '""')}"`,
        ].join(",");
    });

    return [headers.join(","), ...rows].join("\n");
};

// Export donation history as CSV file
export const exportDonationHistoryAsCSV = async (donations: DonationHistoryRecord[]): Promise<void> => {
    try {
        const csvContent = generateCSV(donations);
        const fileName = `NutriMate_Donation_History_${new Date().getTime()}.csv`;

        // Use React Native Share to share the CSV as text
        await Share.share({
            message: csvContent,
            title: fileName,
            url: undefined,
        });
    } catch (error) {
        console.error("Error exporting CSV:", error);
        throw error;
    }
};
