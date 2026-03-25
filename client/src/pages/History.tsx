import PanelLayout from "@/components/PanelLayout";
import RequireAuth from "@/components/RequireAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History as HistoryIcon, CheckCircle2, XCircle, Clock, Ban, PauseCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const RESULT_CONFIG = {
  success: { label: "Sucesso", className: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle2 },
  invalid: { label: "Inválida", className: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
  expired: { label: "Expirada", className: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: Clock },
  banned: { label: "Banida", className: "bg-red-600/20 text-red-500 border-red-600/30", icon: Ban },
  paused: { label: "Pausada", className: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: PauseCircle },
};

function HistoryContent() {
  const { data: history, isLoading } = trpc.history.list.useQuery({ limit: 200 });

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Histórico de Validações</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Todas as tentativas de validação de keys
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-primary" />
            Registros ({history?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !history?.length ? (
            <div className="text-center py-12">
              <HistoryIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Nenhum registro ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {history.map(v => {
                const cfg = RESULT_CONFIG[v.result] ?? RESULT_CONFIG.invalid;
                const Icon = cfg.icon;
                return (
                  <div key={v.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-sm text-foreground tracking-wider">{v.key}</span>
                      <span className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0",
                        cfg.className
                      )}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{new Date(v.validatedAt).toLocaleString("pt-BR", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit", second: "2-digit"
                      })}</span>
                      {v.ipAddress && <span>IP: {v.ipAddress}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function History() {
  return (
    <RequireAuth>
      <PanelLayout title="Histórico">
        <HistoryContent />
      </PanelLayout>
    </RequireAuth>
  );
}
