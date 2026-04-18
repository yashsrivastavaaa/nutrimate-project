import { AppRole, AuthenticatedUser } from "@/lib/types";
import { and, eq } from "drizzle-orm";
import { db } from "../index";
import { ngo, userRoles, users, volunteers } from "../schema";

type CreateUserInput = {
  id: string;
  fullName: string;
  email: string;
  role?: AppRole;
  phone?: string;
  gender?: string;
  avatarType?: string;
  password?: string;
};

const getRolesByUserId = async (userId: string): Promise<AppRole[]> => {
  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));
  return rows.map((r) => r.role as AppRole);
};

const ensureDefaultRole = async (userId: string): Promise<AppRole[]> => {
  const roles = await getRolesByUserId(userId);
  if (roles.length > 0) return roles;

  await db.insert(userRoles).values({
    userId,
    role: "donor",
    createdAt: new Date(),
  });
  await db.update(users).set({ role: "donor" }).where(eq(users.id, userId));
  return ["donor"];
};

const attachRoles = async (user: typeof users.$inferSelect): Promise<AuthenticatedUser> => {
  const roles = await ensureDefaultRole(user.id);
  return { ...user, roles };
};

export const createUserQuery = async (userData: CreateUserInput) => {
  const existing = await db.select().from(users).where(eq(users.id, userData.id)).limit(1);

  if (!existing[0]) {
    await db.insert(users).values({
      id: userData.id,
      fullName: userData.fullName,
      email: userData.email,
      role: userData.role ?? "donor",
      phone: userData.phone,
      gender: userData.gender,
      avatarType: userData.avatarType,
      password: userData.password,
    });
  }

  const existingRoles = await getRolesByUserId(userData.id);
  if (!existingRoles.includes("donor")) {
    await db.insert(userRoles).values({
      userId: userData.id,
      role: "donor",
      createdAt: new Date(),
    });
  }

  return { success: true };
};

export const getUserById = async (id: string) => {
  const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user[0]) return null;
  return attachRoles(user[0]);
};

export const loginUserByCredentials = async (email: string, password: string) => {
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.password, password)))
    .limit(1);

  if (!rows[0]) return null;
  return attachRoles(rows[0]);
};

export const listUserRoles = async (userId: string) => {
  return ensureDefaultRole(userId);
};

export const setUserSelectedRole = async (id: string, role: AppRole) => {
  const existing = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, id), eq(userRoles.role, role)))
    .limit(1);

  if (!existing[0]) {
    await db.insert(userRoles).values({
      userId: id,
      role,
      createdAt: new Date(),
    });
  }

  await db.update(users).set({ role }).where(eq(users.id, id));
  return { success: true };
};

export const addRoleToUser = async (id: string, role: AppRole) => {
  const existing = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, id), eq(userRoles.role, role)))
    .limit(1);

  if (!existing[0]) {
    await db.insert(userRoles).values({
      userId: id,
      role,
      createdAt: new Date(),
    });
  }

  return { success: true };
};

export const getUserByEmail = async (email: string) => {
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] ?? null;
};

type CreateNgoInput = {
  email: string;
  password: string;
  ngoName: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
};

export const createNgoAccount = async (payload: CreateNgoInput) => {
  const existing = await db.select().from(ngo).where(eq(ngo.email, payload.email)).limit(1);
  if (existing[0]) {
    return { success: false, message: "NGO email already exists" };
  }

  const created = await db
    .insert(ngo)
    .values({
      email: payload.email,
      password: payload.password,
      ngoName: payload.ngoName,
      state: payload.state,
      city: payload.city,
      addressLine1: payload.addressLine1,
      addressLine2: payload.addressLine2,
      createdAt: new Date(),
    })
    .returning();

  return { success: true, data: created[0] };
};

export const loginNgoByCredentials = async (email: string, password: string) => {
  const result = await db
    .select()
    .from(ngo)
    .where(and(eq(ngo.email, email), eq(ngo.password, password)))
    .limit(1);

  if (!result[0]) {
    return { success: false, message: "Invalid email or password.", data: null };
  }

  // Check if NGO is approved
  if (result[0].status !== "approved") {
    return {
      success: false,
      message: `Your account is ${result[0].status}. Please wait for admin approval.`,
      data: null,
    };
  }

  return { success: true, message: "Login successful.", data: result[0] };
};

export const assignVolunteerToNgo = async (userId: string, ngoId: number) => {
  const existing = await db
    .select()
    .from(volunteers)
    .where(eq(volunteers.userId, userId))
    .limit(1);

  if (existing[0]) {
    await db.update(volunteers).set({ ngoId }).where(eq(volunteers.userId, userId));
  } else {
    await db.insert(volunteers).values({ userId, ngoId, createdAt: new Date() });
  }

  await addRoleToUser(userId, "volunteer");
  return { success: true };
};

export const addVolunteerToNgoByEmail = async (email: string, ngoId: number) => {
  const user = await getUserByEmail(email);
  if (!user) {
    return { success: false, message: "No user found with this email." };
  }

  await assignVolunteerToNgo(user.id, ngoId);
  return { success: true };
};

export const getNgoVolunteers = async (ngoId: number) => {
  return db
    .select({
      volunteerId: volunteers.id,
      userId: volunteers.userId,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      createdAt: volunteers.createdAt,
    })
    .from(volunteers)
    .innerJoin(users, eq(volunteers.userId, users.id))
    .where(eq(volunteers.ngoId, ngoId));
};

export const getVolunteerNgoId = async (userId: string) => {
  const rows = await db
    .select({ ngoId: volunteers.ngoId })
    .from(volunteers)
    .where(eq(volunteers.userId, userId))
    .limit(1);
  return rows[0]?.ngoId ?? null;
};

export const getVolunteerRecordByUser = async (userId: string) => {
  const rows = await db.select().from(volunteers).where(eq(volunteers.userId, userId)).limit(1);
  return rows[0] ?? null;
};

export const getNgoById = async (ngoId: number) => {
  const rows = await db.select().from(ngo).where(eq(ngo.ngoId, ngoId)).limit(1);
  return rows[0] ?? null;
};

type UpdateUserProfileInput = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  gender?: string;
  avatarType?: string;
};

export const updateUserProfile = async (payload: UpdateUserProfileInput) => {
  const updated = await db
    .update(users)
    .set({
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      gender: payload.gender,
      avatarType: payload.avatarType,
    })
    .where(eq(users.id, payload.id))
    .returning();

  if (!updated[0]) return null;
  return attachRoles(updated[0]);
};

type UpdateNgoProfileInput = {
  ngoId: number;
  email: string;
  ngoName: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
};

export const updateNgoProfile = async (payload: UpdateNgoProfileInput) => {
  const updated = await db
    .update(ngo)
    .set({
      email: payload.email,
      ngoName: payload.ngoName,
      state: payload.state,
      city: payload.city,
      addressLine1: payload.addressLine1,
      addressLine2: payload.addressLine2,
    })
    .where(eq(ngo.ngoId, payload.ngoId))
    .returning();

  return updated[0] ?? null;
};

export const getPendingVolunteerApprovals = async (ngoId: number) => {
  return db
    .select({
      volunteerId: volunteers.id,
      userId: volunteers.userId,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      approvalStatus: volunteers.approvalStatus,
      createdAt: volunteers.createdAt,
    })
    .from(volunteers)
    .innerJoin(users, eq(volunteers.userId, users.id))
    .where(and(eq(volunteers.ngoId, ngoId), eq(volunteers.approvalStatus, "pending")));
};

export const approveVolunteer = async (volunteerId: number) => {
  const result = await db
    .update(volunteers)
    .set({ approvalStatus: "approved" })
    .where(eq(volunteers.id, volunteerId))
    .returning({ id: volunteers.id });

  return result[0] ? { success: true } : { success: false };
};

export const rejectVolunteer = async (volunteerId: number) => {
  const result = await db
    .update(volunteers)
    .set({ approvalStatus: "rejected" })
    .where(eq(volunteers.id, volunteerId))
    .returning({ id: volunteers.id });

  return result[0] ? { success: true } : { success: false };
};

export const getApprovedVolunteersByNgo = async (ngoId: number) => {
  return db
    .select({
      volunteerId: volunteers.id,
      userId: volunteers.userId,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      createdAt: volunteers.createdAt,
    })
    .from(volunteers)
    .innerJoin(users, eq(volunteers.userId, users.id))
    .where(and(eq(volunteers.ngoId, ngoId), eq(volunteers.approvalStatus, "approved")));
};

export const getPendingNgoApprovals = async () => {
  return db
    .select({
      ngoId: ngo.ngoId,
      ngoName: ngo.ngoName,
      email: ngo.email,
      city: ngo.city,
      state: ngo.state,
      addressLine1: ngo.addressLine1,
      createdAt: ngo.createdAt,
    })
    .from(ngo)
    .where(eq(ngo.status, "pending"));
};

export const approveNgo = async (ngoId: number) => {
  const result = await db
    .update(ngo)
    .set({ status: "approved" })
    .where(eq(ngo.ngoId, ngoId))
    .returning({ ngoId: ngo.ngoId });

  return result[0] ? { success: true } : { success: false };
};

export const rejectNgo = async (ngoId: number) => {
  const result = await db
    .update(ngo)
    .set({ status: "rejected" })
    .where(eq(ngo.ngoId, ngoId))
    .returning({ ngoId: ngo.ngoId });

  return result[0] ? { success: true } : { success: false };
};

