import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthContext } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AppRole, NgoEntity, UserEntity } from "@/lib/types";
import { ClerkProvider } from "@clerk/clerk-expo";
import { Stack } from "expo-router";
import { useState } from "react";

export default function RootLayout() {
  const [userState, setUserState] = useState<UserEntity | null>(null);
  const [userRolesState, setUserRolesState] = useState<AppRole[]>([]);
  const [activeRoleState, setActiveRoleState] = useState<AppRole | null>(null);
  const [ngoSessionState, setNgoSessionState] = useState<
    Pick<NgoEntity, "ngoId" | "email" | "ngoName" | "city" | "state"> | null
  >(null);

  const setUser = (user?: UserEntity | null) => setUserState(user ?? null);
  const setUserRoles = (roles: AppRole[]) => setUserRolesState(roles);
  const setActiveRole = (role?: AppRole | null) => setActiveRoleState(role ?? null);
  const setNgoSession = (ngo?: Pick<NgoEntity, "ngoId" | "email" | "ngoName" | "city" | "state"> | null) => setNgoSessionState(ngo ?? null);

  return (
    <ThemeProvider>
      <AuthContext.Provider
        value={{
          user: userState,
          setUser,
          userRoles: userRolesState,
          setUserRoles,
          activeRole: activeRoleState,
          setActiveRole,
          ngoSession: ngoSessionState,
          setNgoSession,
        }}
      >
        <ErrorBoundary>
          <ClerkProvider publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
            <Stack screenOptions={{ headerShown: false }} />
          </ClerkProvider>
        </ErrorBoundary>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
