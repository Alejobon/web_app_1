export type InternalUser = {
  userId: string;
  authProvider?: string | null;
  authProviderUserId?: string | null;
  email?: string | null;
  username: string;
  personality: Record<string, unknown>;
  chats: string[];
  avatarUrl?: string | null; // frontend-only, not returned by backend
};
