import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/features/user/api/user.api";
import { useSession } from "@/features/auth/hooks/useSession";
export function useCurrentUser() { const { session } = useSession(); return useQuery({ queryKey: ["users", "me"], queryFn: getCurrentUser, enabled: Boolean(session) }); }
