import { AppRole, NgoEntity, UserEntity } from "@/lib/types";
import { createContext } from "react";

export type AuthContextValue = {
  user?: UserEntity | null;
  setUser: (user?: UserEntity | null) => void;
  userRoles: AppRole[];
  setUserRoles: (roles: AppRole[]) => void;
  ngoSession?: Pick<NgoEntity, "ngoId" | "email" | "ngoName" | "city" | "state"> | null;
  setNgoSession: (
    ngo?: Pick<NgoEntity, "ngoId" | "email" | "ngoName" | "city" | "state"> | null
  ) => void;
  activeRole?: AppRole | null;
  setActiveRole: (role?: AppRole | null) => void;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  setUser: () => undefined,
  userRoles: [],
  setUserRoles: () => undefined,
  ngoSession: null,
  setNgoSession: () => undefined,
  activeRole: null,
  setActiveRole: () => undefined,
});
