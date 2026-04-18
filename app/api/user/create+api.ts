import { createUserQuery } from "@/lib/db/queries/user";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const result = await createUserQuery(body);

        return Response.json(result);
    } catch (error) {
        console.log(error);
        return Response.json({ error: "Failed to create user" });
    }
}