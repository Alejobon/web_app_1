// User API — fetches the current user profile from /users/me.
import { apiClient } from "@/lib/api-client";
import type { InternalUser } from "@/features/user/user.types";
type BackendUser = { userId: string; authProvider?: string | null; authProviderUserId?: string | null; email?: string | null; username: string; personality: Record<string, unknown>; chats: string[] };
function mapUser(user: BackendUser): InternalUser { return { userId: user.userId, authProvider: user.authProvider, authProviderUserId: user.authProviderUserId, email: user.email, username: user.username, personality: user.personality, chats: user.chats }; }
export async function getCurrentUser() { return mapUser(await apiClient<BackendUser>("/users/me")); }
