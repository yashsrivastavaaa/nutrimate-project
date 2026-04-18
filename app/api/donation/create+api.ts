import { createDonation } from "@/lib/db/queries/donation";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const result = await createDonation(body);

        return Response.json(result);
    } catch (error) {
        console.log(error);
        return Response.json({ error: "Failed to create donation" });
    }
}