import PanelLayout from "@/components/PanelLayout";
import RequireAuth from "@/components/RequireAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  KeyRound, CheckCircle2, Clock, Ban, PauseCircle,
  Users, Activity, TrendingUp, AlertCircle
} from "lucide-react";
import { usePanelAuth } from "@/hooks/usePanelAuth";

function StatusBadge({ result }: { result: string }) {
  const map: Record<string, string> = {
    success: "bg-green-500/20 text-green-400",
    invalid: "bg-red-500/20 text-red-400",
    expired: "bg-gray-500/20 text-gray-400",
    banned: "bg-red-600/20 text-red-500",
    paused: "bg-blue-500/20 text-blue-400",
  };
  const labels: Record<string, string> = {
    success: "Sucesso",
    invalid: "Inválida",
    expired: "Expirada",
    banned: "Banida",
    paused: "Pausada",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[result] ?? "bg-secondary text-muted-foreground"}`}>
      {labels[result] ?? result}
    </span>
  );
}

function DashboardContent() {
  const { data, isLoading } = trpc.dashboard.stats.useQuery();
  const { isAdmin } = usePanelAuth();

  const statCards = [
    {
      label: "Total de Keys",
      value: data?.keyStats.total ?? 0,
      icon: KeyRound,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Keys Ativas",
      value: data?.keyStats.active ?? 0,
      icon: CheckCircle2,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      label: "Aguardando Ativação",
      value: data?.keyStats.pending ?? 0,
      icon: Clock,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Keys Expiradas",
      value: data?.keyStats.expired ?? 0,
      icon: AlertCircle,
      color: "text-gray-400",
      bg: "bg-gray-500/10",
    },
    {
      label: "Keys Pausadas",
      value: data?.keyStats.paused ?? 0,
      icon: PauseCircle,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Keys Banidas",
      value: data?.keyStats.banned ?? 0,
      icon: Ban,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Visão geral do sistema AuthZyon</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {isLoading ? "—" : card.value}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${card.bg}`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Admin: total users */}
      {isAdmin && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Usuários do Painel</p>
                <p className="text-xl font-bold text-foreground">{data?.totalUsers ?? "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent validations */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Últimas Validações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-4 py-6 text-center text-muted-foreground text-sm">Carregando...</div>
          ) : !data?.recentValidations?.length ? (
            <div className="px-4 py-6 text-center text-muted-foreground text-sm">
              Nenhuma validação registrada ainda
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.recentValidations.map((v) => (
                <div key={v.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-foreground bg-secondary px-2 py-0.5 rounded truncate max-w-[120px]">
                      {v.key}
                    </span>
                    <StatusBadge result={v.result} />
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                    {new Date(v.validatedAt).toLocaleString("pt-BR", {
                      day: "2-digit", month: "2-digit",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  return (
    <RequireAuth>
      <PanelLayout title="Dashboard">
        <DashboardContent />
      </PanelLayout>
    </RequireAuth>
  );
}
