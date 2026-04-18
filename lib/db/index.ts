import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.EXPO_PUBLIC_DB_API!);

export const db = drizzle(sql);