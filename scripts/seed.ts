import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import {
    donations,
    ngo,
    userRoles,
    users,
    volunteers
} from "../lib/db/schema";

const sql = neon(process.env.EXPO_PUBLIC_DB_API!);
const db = drizzle(sql);

async function seed() {
    try {
        console.log("🌱 Starting seed...");

        // Clear existing data (be careful with production!)
        // await db.delete(donationRequests);
        // await db.delete(donations);
        // await db.delete(volunteers);
        // await db.delete(userRoles);
        // await db.delete(users);
        // await db.delete(ngo);

        // Create test donor users
        console.log("📝 Creating donor users...");
        const donor1 = await db
            .insert(users)
            .values({
                id: "donor_user_1",
                fullName: "Raj Kumar",
                email: "donor1@test.com",
                role: "donor",
                phone: "9876543210",
                gender: "male",
                avatarType: "male",
                password: "password123", // Plain text for testing - hash in production!
            })
            .onConflictDoNothing();

        const donor2 = await db
            .insert(users)
            .values({
                id: "donor_user_2",
                fullName: "Priya Sharma",
                email: "donor2@test.com",
                role: "donor",
                phone: "9876543211",
                gender: "female",
                avatarType: "female",
                password: "password123",
            })
            .onConflictDoNothing();

        const admin = await db
            .insert(users)
            .values({
                id: "admin_user_1",
                fullName: "Admin User",
                email: "admin@test.com",
                role: "admin",
                phone: "9876543212",
                password: "admin123",
            })
            .onConflictDoNothing();

        const volunteer = await db
            .insert(users)
            .values({
                id: "volunteer_user_1",
                fullName: "Amit Patel",
                email: "volunteer1@test.com",
                role: "volunteer",
                phone: "9876543213",
                gender: "male",
                avatarType: "male",
                password: "password123",
            })
            .onConflictDoNothing();

        // Create test NGOs
        console.log("🏢 Creating NGOs...");
        const ngoResult = await db
            .insert(ngo)
            .values([
                {
                    email: "ngo1@test.com",
                    password: "ngo_pass123", // Plain text for testing
                    ngoName: "Hope Kitchen Foundation",
                    state: "Uttar Pradesh",
                    city: "Greater Noida",
                    addressLine1: "Delta 1",
                    addressLine2: "Plot 123, Block A",
                },
                {
                    email: "ngo2@test.com",
                    password: "ngo_pass123",
                    ngoName: "Smile NGO Trust",
                    state: "Uttar Pradesh",
                    city: "Greater Noida",
                    addressLine1: "Alpha 1",
                    addressLine2: "Community Center",
                },
            ])
            .onConflictDoNothing()
            .returning({ ngoId: ngo.ngoId });

        const ngoIds = ngoResult.map((r) => r.ngoId);
        console.log("✅ NGO IDs created:", ngoIds);

        // Link volunteer to NGO
        if (ngoIds.length > 0) {
            console.log("🤝 Linking volunteer to NGO...");
            await db
                .insert(volunteers)
                .values({
                    userId: "volunteer_user_1",
                    ngoId: ngoIds[0],
                })
                .onConflictDoNothing();
        }

        // Create user roles
        console.log("👥 Creating user roles...");
        await db
            .insert(userRoles)
            .values([
                { userId: "donor_user_1", role: "donor" },
                { userId: "donor_user_2", role: "donor" },
                { userId: "admin_user_1", role: "admin" },
                { userId: "volunteer_user_1", role: "volunteer" },
            ])
            .onConflictDoNothing();

        // Create test donations
        console.log("🍱 Creating donations...");
        const now = new Date();
        const expiryTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now
        const pickupTime = new Date(now.getTime() + 20 * 60 * 1000); // 20 minutes from now

        const donations_data = [
            {
                id: "don_001",
                userId: "donor_user_1",
                ngoId: null,
                volunteerId: null,
                title: "Fresh Cooked Rice & Dal",
                description: "Homemade rice and dal prepared today, good for 20-25 people",
                quantity: "20 packs",
                foodType: "cooked",
                pickupAddress: "Delta 1, Plot 123, Greater Noida, Uttar Pradesh",
                contactNumber: "9876543210",
                imageUrl:
                    "https://via.placeholder.com/400x300?text=Cooked+Rice+Dal",
                expiryTime,
                pickupTime,
                status: "available" as const,
            },
            {
                id: "don_002",
                userId: "donor_user_2",
                ngoId: null,
                volunteerId: null,
                title: "Fresh Vegetables",
                description: "Seasonal vegetables - tomato, onion, potatoes",
                quantity: "15 kg",
                foodType: "veg",
                pickupAddress: "Alpha 1, Community Center, Greater Noida, Uttar Pradesh",
                contactNumber: "9876543211",
                imageUrl:
                    "https://via.placeholder.com/400x300?text=Fresh+Vegetables",
                expiryTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
                pickupTime: new Date(now.getTime() + 30 * 60 * 1000), // 30 mins
                status: "available" as const,
            },
            {
                id: "don_003",
                userId: "donor_user_1",
                ngoId: ngoIds.length > 0 ? ngoIds[0] : null,
                volunteerId: null,
                title: "Packaged Snacks",
                description: "Biscuits and snack packs, unopened",
                quantity: "50 packs",
                foodType: "packaged",
                pickupAddress: "Delta 1, Plot 123, Greater Noida, Uttar Pradesh",
                contactNumber: "9876543210",
                imageUrl:
                    "https://via.placeholder.com/400x300?text=Packaged+Snacks",
                expiryTime: new Date(now.getTime() + 72 * 60 * 60 * 1000), // 72 hours
                pickupTime: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour
                status: "reserved" as const,
            },
        ];

        await db
            .insert(donations)
            .values(donations_data)
            .onConflictDoNothing();

        console.log("\n✨ Seed completed successfully!\n");
        console.log("📧 Test Credentials:\n");
        console.log("=== DONOR USER 1 ===");
        console.log("Email: donor1@test.com");
        console.log("Password: password123\n");

        console.log("=== DONOR USER 2 ===");
        console.log("Email: donor2@test.com");
        console.log("Password: password123\n");

        console.log("=== ADMIN USER ===");
        console.log("Email: admin@test.com");
        console.log("Password: admin123\n");

        console.log("=== VOLUNTEER USER ===");
        console.log("Email: volunteer1@test.com");
        console.log("Password: password123\n");

        console.log("=== NGO 1 ===");
        console.log("Email: ngo1@test.com");
        console.log("Password: ngo_pass123");
        console.log("Name: Hope Kitchen Foundation\n");

        console.log("=== NGO 2 ===");
        console.log("Email: ngo2@test.com");
        console.log("Password: ngo_pass123");
        console.log("Name: Smile NGO Trust\n");

        console.log("🎯 Features to test:");
        console.log("- Login with donor1@test.com to create/view donations");
        console.log("- Login with volunteer1@test.com to join as volunteer");
        console.log("- Login with ngo1@test.com to request donations");
        console.log("- 3 test donations are pre-created");
        console.log("- One donation is already reserved for NGO 1\n");
    } catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    }
}

seed();
