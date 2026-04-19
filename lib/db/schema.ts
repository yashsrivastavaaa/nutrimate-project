import {
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "donor",
  "ngo",
  "volunteer",
  "admin",
]);

export const donationStatusEnum = pgEnum("donation_status", [
  "available",
  "reserved",
  "ready",
  "pickup_assigned",
  "awaiting_volunteer_pickup",
  "awaiting_donor_handover",
  "picked",
  "delivered_to_ngo",
  "completed",
]);

export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "accepted",
  "rejected",
]);

export const volunteerApprovalStatusEnum = pgEnum("volunteer_approval_status", [
  "pending",
  "approved",
  "rejected",
]);

export const ngoStatusEnum = pgEnum("ngo_status", [
  "pending",
  "approved",
  "rejected",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user id
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default("donor"),
  phone: text("phone"),
  gender: text("gender"),
  avatarType: text("avatar_type"),
  password: text("password"),
  isVerified: integer("is_verified").default(0), // 0 = unverified, 1 = verified
  donationCount: integer("donation_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ngo = pgTable("ngo", {
  ngoId: serial("ngo_id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  ngoName: varchar("ngo_name", { length: 255 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  description: text("description"),
  contactNumber: text("contact_number"),
  familiesServed: integer("families_served").default(0),
  donationsReceived: integer("donations_received").default(0),
  status: ngoStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    role: userRoleEnum("role").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    uniqueUserRole: uniqueIndex("user_roles_user_id_role_unique").on(table.userId, table.role),
  })
);

export const volunteers = pgTable(
  "volunteers",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    ngoId: integer("ngo_id")
      .notNull()
      .references(() => ngo.ngoId),
    approvalStatus: volunteerApprovalStatusEnum("approval_status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    uniqueVolunteerUser: uniqueIndex("volunteers_user_id_unique").on(table.userId),
  })
);

export const donations = pgTable("donations", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  ngoId: integer("ngo_id").references(() => ngo.ngoId),
  volunteerId: integer("volunteer_id").references(() => volunteers.id),
  title: text("title").notNull(),
  description: text("description"),
  quantity: text("quantity"),
  foodType: text("food_type"),
  pickupAddress: text("pickup_address"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  contactNumber: text("contact_number"),
  imageUrl: text("image_url").notNull(),
  expiryTime: timestamp("expiry_time"),
  pickupTime: timestamp("pickup_time"),
  status: donationStatusEnum("status").notNull().default("available"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const donationRequests = pgTable("donation_requests", {
  id: serial("id").primaryKey(),
  donationId: text("donation_id")
    .notNull()
    .references(() => donations.id),
  ngoId: integer("ngo_id")
    .notNull()
    .references(() => ngo.ngoId),
  status: requestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const favoriteNgos = pgTable(
  "favorite_ngos",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    ngoId: integer("ngo_id")
      .notNull()
      .references(() => ngo.ngoId),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    uniqueFavorite: uniqueIndex("favorite_ngos_user_id_ngo_id_unique").on(table.userId, table.ngoId),
  })
);

export const favoriteDonors = pgTable(
  "favorite_donors",
  {
    id: serial("id").primaryKey(),
    ngoId: integer("ngo_id")
      .notNull()
      .references(() => ngo.ngoId),
    donorId: text("donor_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    uniqueFavoriteDonor: uniqueIndex("favorite_donors_ngo_id_donor_id_unique").on(table.ngoId, table.donorId),
  })
);
