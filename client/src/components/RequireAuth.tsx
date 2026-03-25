import { useEffect } from "react";
import { useLocation } from "wouter";
import { usePanelAuth } from "@/hooks/usePanelAuth";
import { Loader2, Shield } from "lucide-react";

interface RequireAuthProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function RequireAuth({ children, adminOnly = false }: RequireAuthProps) {
  const { user, isLoading, isAuthenticated, isAdmin } = usePanelAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
    if (!isLoading && isAuthenticated && adminOnly && !isAdmin) {
      setLocation("/dashboard");
    }
  }, [isLoading, isAuthenticated, adminOnly, isAdmin, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/15 border border-primary/30">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Verificando acesso...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (adminOnly && !isAdmin) return null;

  return <>{children}</>;
}
