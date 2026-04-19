export type AppRole = "donor" | "ngo" | "volunteer" | "admin";

export type DonationStatus =
  | "available"
  | "reserved"
  | "ready"
  | "pickup_assigned"
  | "awaiting_volunteer_pickup"
  | "awaiting_donor_handover"
  | "picked"
  | "delivered_to_ngo"
  | "completed";

export type DonationRequestStatus = "pending" | "accepted" | "rejected";

export interface UserEntity {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
  roles?: AppRole[];
  phone?: string | null;
  gender?: string | null;
  avatarType?: string | null;
  password?: string | null;
  isVerified?: number | null;
  donationCount?: number | null;
}

export interface NgoEntity {
  ngoId: number;
  email: string;
  password: string;
  ngoName: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2?: string | null;
  description?: string | null;
  contactNumber?: string | null;
  familiesServed?: number;
  donationsReceived?: number;
}

export interface AuthenticatedUser extends UserEntity {
  roles: AppRole[];
}
