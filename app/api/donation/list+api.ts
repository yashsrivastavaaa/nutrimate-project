import { getUserDonations } from "@/lib/db/queries/donation";

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        const data = await getUserDonations(userId);

        return Response.json(data);
    } catch {
        return Response.json({ error: "Failed to fetch donations" });
    }
}

