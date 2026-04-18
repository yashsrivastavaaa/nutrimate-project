import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContextValue } from "@/context/AuthContext";

export async function clearLocalSession(
  ctx: Pick<AuthContextValue, "setUser" | "setActiveRole" | "setNgoSession" | "setUserRoles">
) {
  await AsyncStorage.multiRemove(["userData", "activeRole", "ngoSession", "userRoles"]);
  ctx.setUser(null);
  ctx.setUserRoles([]);
  ctx.setActiveRole(null);
  ctx.setNgoSession(null);
}
