export type AppRole = "donor" | "ngo" | "volunteer" | "admin";

export type DonationStatus =
  | "available"
  | "reserved"
  | "pickup_assigned"
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
}

export interface AuthenticatedUser extends UserEntity {
  roles: AppRole[];
}
