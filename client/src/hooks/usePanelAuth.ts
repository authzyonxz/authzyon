import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export function usePanelAuth() {
  const { data: user, isLoading, error } = trpc.panel.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const [, setLocation] = useLocation();

  const logoutMutation = trpc.panel.logout.useMutation({
    onSuccess: () => {
      setLocation("/login");
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    logout: () => logoutMutation.mutate(),
    isAdmin: user?.role === "admin",
  };
}
