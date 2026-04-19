import { DonationStatus } from "@/lib/types";
import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../index";
import { donationRequests, donations, favoriteDonors, favoriteNgos, ngo, users, volunteers } from "../schema";

type CreateDonationInput = {
  id: string;
  userId: string;
  title: string;
  imageUrl: string;
  description?: string;
  quantity?: string;
  foodType?: string;
  pickupAddress?: string;
  latitude?: number;
  longitude?: number;
  contactNumber?: string;
  expiryTime?: Date;
  pickupTime?: Date;
};

type UpdateDonationInput = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  quantity?: string;
  foodType?: string;
  pickupAddress?: string;
  contactNumber?: string;
  expiryTime?: Date;
  pickupTime?: Date;
};

export const createDonation = async (data: CreateDonationInput) => {
  await db.insert(donations).values({
    ...data,
    status: "available",
    createdAt: new Date(),
  });

  return { success: true };
};

export const getDonationById = async (id: string) => {
  const rows = await db.select().from(donations).where(eq(donations.id, id)).limit(1);
  return rows[0] ?? null;
};

export const getUserDonations = async (userId: string) => {
  return db
    .select()
    .from(donations)
    .where(eq(donations.userId, userId))
    .orderBy(desc(donations.createdAt));
};

export const getAvailableDonations = async () => {
  return db
    .select({
      id: donations.id,
      title: donations.title,
      quantity: donations.quantity,
      pickupAddress: donations.pickupAddress,
      imageUrl: donations.imageUrl,
      status: donations.status,
      donorIsVerified: users.isVerified,
      donorDonationCount: users.donationCount,
    })
    .from(donations)
    .innerJoin(users, eq(donations.userId, users.id))
    .where(eq(donations.status, "available"))
    .orderBy(desc(donations.createdAt));
};

export const getNgoAcceptedDonations = async (ngoId: number) => {
  return db
    .select({
      id: donations.id,
      title: donations.title,
      quantity: donations.quantity,
      pickupAddress: donations.pickupAddress,
      imageUrl: donations.imageUrl,
      status: donations.status,
      donorIsVerified: users.isVerified,
      donorDonationCount: users.donationCount,
    })
    .from(donations)
    .innerJoin(users, eq(donations.userId, users.id))
    .where(and(eq(donations.ngoId, ngoId), inArray(donations.status, ["reserved", "pickup_assigned", "picked", "delivered_to_ngo"])))
    .orderBy(desc(donations.createdAt));
};

export const getNgoCompletedDonations = async (ngoId: number) => {
  return db
    .select({
      id: donations.id,
      title: donations.title,
      quantity: donations.quantity,
      pickupAddress: donations.pickupAddress,
      imageUrl: donations.imageUrl,
      status: donations.status,
      donorIsVerified: users.isVerified,
      donorDonationCount: users.donationCount,
    })
    .from(donations)
    .innerJoin(users, eq(donations.userId, users.id))
    .where(and(eq(donations.ngoId, ngoId), eq(donations.status, "completed")))
    .orderBy(desc(donations.createdAt));
};

export const getVolunteerAssignedDonations = async (volunteerUserId: string) => {
  const volunteer = await db
    .select({ id: volunteers.id })
    .from(volunteers)
    .where(eq(volunteers.userId, volunteerUserId))
    .limit(1);

  if (!volunteer[0]) return [];

  return db
    .select()
    .from(donations)
    .where(eq(donations.volunteerId, volunteer[0].id))
    .orderBy(desc(donations.createdAt));
};

export const getVolunteerOpenPickups = async (ngoId: number) => {
  return db
    .select()
    .from(donations)
    .where(
      and(
        eq(donations.ngoId, ngoId),
        eq(donations.status, "ready"),
        isNull(donations.volunteerId)
      )
    )
    .orderBy(desc(donations.createdAt));
};

export const getAllDonationsForAdmin = async () => {
  return db.select().from(donations).orderBy(desc(donations.createdAt));
};

export const updateDonationStatus = async (id: string, status: DonationStatus) => {
  await db.update(donations).set({ status }).where(eq(donations.id, id));
  return { success: true };
};

export const updateDonationDetails = async (payload: UpdateDonationInput) => {
  const updated = await db
    .update(donations)
    .set({
      title: payload.title,
      description: payload.description,
      quantity: payload.quantity,
      foodType: payload.foodType,
      pickupAddress: payload.pickupAddress,
      contactNumber: payload.contactNumber,
      expiryTime: payload.expiryTime,
      pickupTime: payload.pickupTime,
    })
    .where(
      and(
        eq(donations.id, payload.id),
        eq(donations.userId, payload.userId),
        eq(donations.status, "available")
      )
    )
    .returning();

  if (!updated[0]) {
    return { success: false, message: "Donation not found, access denied, or cannot edit a reserved donation" };
  }

  return { success: true, data: updated[0] };
};

export const markDonationPicked = async (id: string, volunteerUserId: string) => {
  const volunteer = await db
    .select({ id: volunteers.id })
    .from(volunteers)
    .where(eq(volunteers.userId, volunteerUserId))
    .limit(1);

  if (!volunteer[0]) return { success: false, message: "Volunteer mapping not found" };

  await db
    .update(donations)
    .set({ status: "picked", volunteerId: volunteer[0].id })
    .where(and(eq(donations.id, id), eq(donations.volunteerId, volunteer[0].id)));
  return { success: true };
};

export const markDonationDeliveredToNgo = async (id: string, volunteerUserId: string) => {
  const volunteer = await db
    .select({ id: volunteers.id })
    .from(volunteers)
    .where(eq(volunteers.userId, volunteerUserId))
    .limit(1);

  if (!volunteer[0]) return { success: false, message: "Volunteer mapping not found" };

  await db
    .update(donations)
    .set({ status: "delivered_to_ngo", volunteerId: volunteer[0].id })
    .where(and(eq(donations.id, id), eq(donations.volunteerId, volunteer[0].id)));
  return { success: true };
};

export const confirmDonationCompleted = async (id: string, ngoId: number) => {
  await db
    .update(donations)
    .set({ status: "completed" })
    .where(and(eq(donations.id, id), eq(donations.ngoId, ngoId)));
  return { success: true };
};

export const markDonationAsReady = async (id: string, userId: string) => {
  const updated = await db
    .update(donations)
    .set({ status: "ready", volunteerId: null })
    .where(
      and(
        eq(donations.id, id),
        eq(donations.userId, userId),
        eq(donations.status, "reserved")
      )
    )
    .returning({ id: donations.id });

  if (!updated[0]) {
    return { success: false, message: "Donation not found, access denied, or not reserved." };
  }

  return { success: true };
};

export const acceptVolunteerPickup = async (id: string, volunteerUserId: string) => {
  const volunteer = await db
    .select({ id: volunteers.id, ngoId: volunteers.ngoId })
    .from(volunteers)
    .where(eq(volunteers.userId, volunteerUserId))
    .limit(1);

  if (!volunteer[0]) {
    return { success: false, message: "Volunteer mapping not found" };
  }

  const updated = await db
    .update(donations)
    .set({ status: "pickup_assigned", volunteerId: volunteer[0].id })
    .where(
      and(
        eq(donations.id, id),
        eq(donations.ngoId, volunteer[0].ngoId),
        eq(donations.status, "ready"),
        isNull(donations.volunteerId)
      )
    )
    .returning({ id: donations.id });

  if (!updated[0]) {
    return { success: false, message: "Pickup already assigned or no longer ready." };
  }

  return { success: true };
};

export const markDonorHandover = async (id: string, userId: string) => {
  const donation = await db
    .select({ status: donations.status })
    .from(donations)
    .where(eq(donations.id, id))
    .limit(1);

  if (!donation[0]) {
    return { success: false, message: "Donation not found" };
  }

  let nextStatus: DonationStatus;
  if (donation[0].status === "awaiting_donor_handover") {
    // Volunteer already marked picked, transition to picked
    nextStatus = "picked";
  } else {
    // Donor marks first, transition to awaiting_volunteer_pickup
    nextStatus = "awaiting_volunteer_pickup";
  }

  const updated = await db
    .update(donations)
    .set({ status: nextStatus })
    .where(
      and(
        eq(donations.id, id),
        eq(donations.userId, userId),
        inArray(donations.status, ["pickup_assigned", "awaiting_donor_handover"])
      )
    )
    .returning({ id: donations.id });

  if (!updated[0]) {
    return { success: false, message: "Cannot mark handover - donation not in the correct state or access denied." };
  }

  return { success: true };
};

export const markVolunteerPickup = async (id: string, volunteerUserId: string) => {
  const volunteer = await db
    .select({ id: volunteers.id })
    .from(volunteers)
    .where(eq(volunteers.userId, volunteerUserId))
    .limit(1);

  if (!volunteer[0]) {
    return { success: false, message: "Volunteer mapping not found" };
  }

  const donation = await db
    .select({ status: donations.status })
    .from(donations)
    .where(eq(donations.id, id))
    .limit(1);

  if (!donation[0]) {
    return { success: false, message: "Donation not found" };
  }

  let nextStatus: DonationStatus;
  if (donation[0].status === "awaiting_volunteer_pickup") {
    // Donor already marked handover, transition to picked
    nextStatus = "picked";
  } else {
    // Volunteer marks first, transition to awaiting_donor_handover
    nextStatus = "awaiting_donor_handover";
  }

  const updated = await db
    .update(donations)
    .set({ status: nextStatus, volunteerId: volunteer[0].id })
    .where(
      and(
        eq(donations.id, id),
        eq(donations.volunteerId, volunteer[0].id),
        inArray(donations.status, ["pickup_assigned", "awaiting_volunteer_pickup"])
      )
    )
    .returning({ id: donations.id });

  if (!updated[0]) {
    return { success: false, message: "Cannot mark pickup - donation not in the correct state or access denied." };
  }

  return { success: true };
};

export const createNgoRequest = async (donationId: string, ngoId: number) => {
  const existing = await db
    .select()
    .from(donationRequests)
    .where(
      and(
        eq(donationRequests.donationId, donationId),
        eq(donationRequests.ngoId, ngoId)
      )
    )
    .limit(1);

  if (existing[0]) {
    return { success: false, message: "Request already exists" };
  }

  await db.insert(donationRequests).values({
    donationId,
    ngoId,
    status: "pending",
    createdAt: new Date(),
  });

  return { success: true };
};

export const getDonationRequestsForDonor = async (donorId: string) => {
  const donorDonations = await db
    .select({ id: donations.id })
    .from(donations)
    .where(eq(donations.userId, donorId));

  const donationIds = donorDonations.map((d) => d.id);
  if (!donationIds.length) return [];

  return db
    .select({
      requestId: donationRequests.id,
      requestStatus: donationRequests.status,
      donationId: donations.id,
      donationTitle: donations.title,
      donationImageUrl: donations.imageUrl,
      donationStatus: donations.status,
      ngoId: ngo.ngoId,
      ngoName: ngo.ngoName,
      ngoCity: ngo.city,
      ngoState: ngo.state,
    })
    .from(donationRequests)
    .innerJoin(donations, eq(donationRequests.donationId, donations.id))
    .innerJoin(ngo, eq(donationRequests.ngoId, ngo.ngoId))
    .where(inArray(donationRequests.donationId, donationIds))
    .orderBy(desc(donationRequests.createdAt));
};

export const getNgoPendingRequestIds = async (ngoId: number) => {
  const pendingRequests = await db
    .select({ donationId: donationRequests.donationId })
    .from(donationRequests)
    .where(
      and(
        eq(donationRequests.ngoId, ngoId),
        eq(donationRequests.status, "pending")
      )
    );

  return pendingRequests.map((r) => r.donationId);
};

export const acceptNgoRequest = async (
  requestId: number,
  donorId: string
) => {
  const req = await db
    .select({
      requestId: donationRequests.id,
      donationId: donationRequests.donationId,
      ngoId: donationRequests.ngoId,
      ownerId: donations.userId,
    })
    .from(donationRequests)
    .innerJoin(donations, eq(donationRequests.donationId, donations.id))
    .where(eq(donationRequests.id, requestId))
    .limit(1);

  if (!req[0] || req[0].ownerId !== donorId) {
    return { success: false, message: "Request not found" };
  }

  const donationId = req[0].donationId;
  const ngoId = req[0].ngoId;

  await db
    .update(donationRequests)
    .set({ status: "accepted" })
    .where(eq(donationRequests.id, requestId));

  await db
    .update(donationRequests)
    .set({ status: "rejected" })
    .where(
      and(
        eq(donationRequests.donationId, donationId),
        inArray(donationRequests.status, ["pending", "rejected"])
      )
    );

  await db
    .update(donations)
    .set({ status: "reserved", ngoId, volunteerId: null })
    .where(and(eq(donations.id, donationId), eq(donations.userId, donorId)));

  return { success: true };
};

export const rejectNgoRequest = async (requestId: number, donorId: string) => {
  const req = await db
    .select({
      requestId: donationRequests.id,
      ownerId: donations.userId,
    })
    .from(donationRequests)
    .innerJoin(donations, eq(donationRequests.donationId, donations.id))
    .where(eq(donationRequests.id, requestId))
    .limit(1);

  if (!req[0] || req[0].ownerId !== donorId) {
    return { success: false, message: "Request not found" };
  }

  await db
    .update(donationRequests)
    .set({ status: "rejected" })
    .where(eq(donationRequests.id, requestId));

  return { success: true };
};

export const listUsers = async () => {
  return db.select().from(users);
};

export const listNgos = async () => {
  return db.select().from(ngo);
};

export const listVolunteers = async () => {
  return db
    .select({
      volunteerId: volunteers.id,
      userId: volunteers.userId,
      fullName: users.fullName,
      email: users.email,
      ngoId: volunteers.ngoId,
      ngoName: ngo.ngoName,
    })
    .from(volunteers)
    .innerJoin(users, eq(volunteers.userId, users.id))
    .innerJoin(ngo, eq(volunteers.ngoId, ngo.ngoId));
};

export const deleteDonation = async (donationId: string, userId: string) => {
  const result = await db
    .delete(donations)
    .where(
      and(
        eq(donations.id, donationId),
        eq(donations.userId, userId),
        eq(donations.status, "available")
      )
    )
    .returning({ id: donations.id });

  if (!result[0]) {
    return { success: false, message: "Donation not found, access denied, or cannot delete a reserved donation" };
  }

  return { success: true };
};

export const getDonationSuccessStats = async (userId: string) => {
  const result = await db
    .select({ count: count() })
    .from(donations)
    .where(and(eq(donations.userId, userId), eq(donations.status, "completed")));

  return result[0]?.count ?? 0;
};

export const getFavoriteNgos = async (userId: string) => {
  return db
    .select({
      ngoId: ngo.ngoId,
      ngoName: ngo.ngoName,
      city: ngo.city,
      state: ngo.state,
    })
    .from(favoriteNgos)
    .innerJoin(ngo, eq(favoriteNgos.ngoId, ngo.ngoId))
    .where(eq(favoriteNgos.userId, userId))
    .orderBy(desc(favoriteNgos.createdAt));
};

export const toggleFavoriteNgo = async (userId: string, ngoId: number) => {
  const existing = await db
    .select()
    .from(favoriteNgos)
    .where(and(eq(favoriteNgos.userId, userId), eq(favoriteNgos.ngoId, ngoId)))
    .limit(1);

  if (existing[0]) {
    await db
      .delete(favoriteNgos)
      .where(and(eq(favoriteNgos.userId, userId), eq(favoriteNgos.ngoId, ngoId)));
    return { success: true, action: "removed" };
  } else {
    await db.insert(favoriteNgos).values({
      userId,
      ngoId,
      createdAt: new Date(),
    });
    return { success: true, action: "added" };
  }
};

export const isFavoriteNgo = async (userId: string, ngoId: number) => {
  const result = await db
    .select()
    .from(favoriteNgos)
    .where(and(eq(favoriteNgos.userId, userId), eq(favoriteNgos.ngoId, ngoId)))
    .limit(1);

  return !!result[0];
};

export const getDonationHistoryForExport = async (userId: string) => {
  return db
    .select({
      id: donations.id,
      title: donations.title,
      status: donations.status,
      createdAt: donations.createdAt,
      ngoName: ngo.ngoName,
    })
    .from(donations)
    .leftJoin(ngo, eq(donations.ngoId, ngo.ngoId))
    .where(eq(donations.userId, userId))
    .orderBy(desc(donations.createdAt));
};

// Feature: Favorite Donors for NGOs
export const toggleFavoriteDonor = async (ngoId: number, donorId: string) => {
  const existing = await db
    .select()
    .from(favoriteDonors)
    .where(and(eq(favoriteDonors.ngoId, ngoId), eq(favoriteDonors.donorId, donorId)))
    .limit(1);

  if (existing[0]) {
    await db
      .delete(favoriteDonors)
      .where(and(eq(favoriteDonors.ngoId, ngoId), eq(favoriteDonors.donorId, donorId)));
    return { success: true, action: "removed" };
  } else {
    await db.insert(favoriteDonors).values({
      ngoId,
      donorId,
      createdAt: new Date(),
    });
    return { success: true, action: "added" };
  }
};

export const getFavoriteDonors = async (ngoId: number) => {
  return db
    .select({
      userId: users.id,
      fullName: users.fullName,
      email: users.email,
      donationCount: users.donationCount,
      isVerified: users.isVerified,
    })
    .from(favoriteDonors)
    .innerJoin(users, eq(favoriteDonors.donorId, users.id))
    .where(eq(favoriteDonors.ngoId, ngoId))
    .orderBy(desc(favoriteDonors.createdAt));
};

export const isFavoriteDonor = async (ngoId: number, donorId: string) => {
  const result = await db
    .select()
    .from(favoriteDonors)
    .where(and(eq(favoriteDonors.ngoId, ngoId), eq(favoriteDonors.donorId, donorId)))
    .limit(1);

  return !!result[0];
};

// Feature: NGO Public Profile
export const getNgoProfilePublic = async (ngoId: number) => {
  return db
    .select({
      ngoId: ngo.ngoId,
      ngoName: ngo.ngoName,
      email: ngo.email,
      description: ngo.description,
      contactNumber: ngo.contactNumber,
      state: ngo.state,
      city: ngo.city,
      addressLine1: ngo.addressLine1,
      familiesServed: ngo.familiesServed,
      donationsReceived: ngo.donationsReceived,
      status: ngo.status,
    })
    .from(ngo)
    .where(eq(ngo.ngoId, ngoId))
    .limit(1);
};

export const getAllApprovedNgos = async () => {
  return db
    .select({
      ngoId: ngo.ngoId,
      ngoName: ngo.ngoName,
      email: ngo.email,
      description: ngo.description,
      contactNumber: ngo.contactNumber,
      state: ngo.state,
      city: ngo.city,
      addressLine1: ngo.addressLine1,
      familiesServed: ngo.familiesServed,
      donationsReceived: ngo.donationsReceived,
      status: ngo.status,
    })
    .from(ngo)
    .where(eq(ngo.status, "approved"))
    .orderBy(desc(ngo.donationsReceived));
};

export const getAllApprovedNgosWithCompletedCounts = async () => {
  const ngos = await db
    .select({
      ngoId: ngo.ngoId,
      ngoName: ngo.ngoName,
      email: ngo.email,
      description: ngo.description,
      contactNumber: ngo.contactNumber,
      state: ngo.state,
      city: ngo.city,
      addressLine1: ngo.addressLine1,
      familiesServed: ngo.familiesServed,
      donationsReceived: ngo.donationsReceived,
      status: ngo.status,
    })
    .from(ngo)
    .where(eq(ngo.status, "approved"))
    .orderBy(desc(ngo.donationsReceived));

  // Get completed donation counts for each NGO
  const completedCounts = await Promise.all(
    ngos.map(async (n) => {
      const result = await db
        .select({ count: count() })
        .from(donations)
        .where(and(eq(donations.ngoId, n.ngoId), eq(donations.status, "completed")));
      return {
        ngoId: n.ngoId,
        completedCount: result[0]?.count ?? 0,
      };
    })
  );

  // Merge completed counts with NGO data
  const countMap = new Map(completedCounts.map((c) => [c.ngoId, c.completedCount]));
  return ngos.map((n) => ({
    ...n,
    completedCount: countMap.get(n.ngoId) ?? 0,
  }));
};

// Feature: Donor Recognition Badge
export const getDonorRecognitionBadge = async (userId: string) => {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user[0]) return null;

  const donationCount = user[0].donationCount || 0;
  let badge = "bronze";

  if (donationCount >= 100) {
    badge = "platinum";
  } else if (donationCount >= 50) {
    badge = "gold";
  } else if (donationCount >= 20) {
    badge = "silver";
  }

  return {
    badge,
    donationCount,
    nextMilestone: badge === "platinum" ? null : [20, 50, 100][["bronze", "silver", "gold"].indexOf(badge)] || 20,
  };
};

// Feature: Update Donor Verification
export const updateDonorVerification = async (userId: string, isVerified: boolean) => {
  await db.update(users).set({ isVerified: isVerified ? 1 : 0 }).where(eq(users.id, userId));
  return { success: true };
};

// Feature: Increment Donation Count
export const incrementDonationCount = async (userId: string) => {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const newCount = (user[0]?.donationCount || 0) + 1;
  await db.update(users).set({ donationCount: newCount }).where(eq(users.id, userId));
  return newCount;
};
