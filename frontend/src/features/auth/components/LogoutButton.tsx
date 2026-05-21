import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/api/auth.api";
export function LogoutButton({ children = "Cerrar sesión", ...props }: ComponentProps<typeof Button>) {
  const [loading, setLoading] = useState(false); const navigate = useNavigate(); const queryClient = useQueryClient();
  async function handleLogout(event: React.MouseEvent<HTMLButtonElement>) {
    props.onClick?.(event);
    if (event.defaultPrevented) return;
    setLoading(true);
    try {
      await signOut();
      queryClient.clear();
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  }
  return <Button {...props} onClick={handleLogout} disabled={loading || props.disabled}><LogOut className="h-4 w-4" />{children}</Button>;
}
