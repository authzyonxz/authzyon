import { useState } from "react";
import PanelLayout from "@/components/PanelLayout";
import RequireAuth from "@/components/RequireAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  List, Search, PauseCircle, Play, Ban, CalendarPlus,
  Loader2, KeyRound, Clock, CheckCircle2, AlertCircle, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

type KeyStatus = "pending" | "active" | "paused" | "banned" | "expired";

const STATUS_CONFIG: Record<KeyStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: "Aguardando", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  active: { label: "Ativa", className: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle2 },
  paused: { label: "Pausada", className: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: PauseCircle },
  banned: { label: "Banida", className: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
  expired: { label: "Expirada", className: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: AlertCircle },
};

function AddDaysDialog({
  keyId, keyValue, open, onClose
}: { keyId: number; keyValue: string; open: boolean; onClose: () => void }) {
  const [days, setDays] = useState(1);
  const utils = trpc.useUtils();
  const addDaysMutation = trpc.keys.addDays.useMutation({
    onSuccess: () => {
      toast.success(`${days} dia(s) adicionado(s) à key ${keyValue}`);
      utils.keys.list.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-primary" />
            Adicionar Dias
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Key: <span className="font-mono text-foreground">{keyValue}</span>
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Dias a adicionar</label>
            <Input
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={e => setDays(Math.max(1, parseInt(e.target.value) || 1))}
              className="bg-input border-border text-foreground"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">Cancelar</Button>
          <Button
            onClick={() => addDaysMutation.mutate({ id: keyId, days })}
            disabled={addDaysMutation.isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {addDaysMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManageKeysContent() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<KeyStatus | "all">("all");
  const [addDaysTarget, setAddDaysTarget] = useState<{ id: number; key: string } | null>(null);

  const { data: keys, isLoading } = trpc.keys.list.useQuery();
  const utils = trpc.useUtils();

  const pauseMutation = trpc.keys.pause.useMutation({
    onSuccess: (data) => {
      toast.success(data.status === "paused" ? "Key pausada" : "Key reativada");
      utils.keys.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const banMutation = trpc.keys.ban.useMutation({
    onSuccess: () => {
      toast.success("Key banida");
      utils.keys.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = (keys ?? []).filter(k => {
    const matchSearch = k.key.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || k.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusFilters: Array<KeyStatus | "all"> = ["all", "pending", "active", "paused", "banned", "expired"];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Gerenciar Keys</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          {keys?.length ?? 0} key{(keys?.length ?? 0) !== 1 ? "s" : ""} no total
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar key..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {statusFilters.map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                  filterStatus === s
                    ? "bg-primary/20 text-primary border-primary/40"
                    : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/30"
                )}
              >
                {s === "all" ? "Todas" : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Keys list */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <List className="w-4 h-4 text-primary" />
            Keys ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <KeyRound className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Nenhuma key encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(k => {
                const cfg = STATUS_CONFIG[k.status as KeyStatus] ?? STATUS_CONFIG.pending;
                const StatusIcon = cfg.icon;
                const canPause = k.status === "active" || k.status === "paused";
                const canBan = k.status !== "banned";

                return (
                  <div key={k.id} className="px-4 py-3">
                    {/* Row 1: key + status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-sm font-semibold text-foreground tracking-wider">
                        {k.key}
                      </span>
                      <span className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                        cfg.className
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Row 2: info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground mb-2">
                      <span>{k.durationDays + (k.extraDays ?? 0)} dias</span>
                      {k.activatedAt && (
                        <span>Ativada: {new Date(k.activatedAt).toLocaleDateString("pt-BR")}</span>
                      )}
                      {k.expiresAt && (
                        <span>Expira: {new Date(k.expiresAt).toLocaleDateString("pt-BR")}</span>
                      )}
                      {!k.activatedAt && (
                        <span className="text-yellow-500/70">Não ativada ainda</span>
                      )}
                    </div>

                    {/* Row 3: actions */}
                    <div className="flex gap-2">
                      {canPause && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => pauseMutation.mutate({ id: k.id })}
                          disabled={pauseMutation.isPending}
                          className="h-7 text-xs gap-1 border-border"
                        >
                          {k.status === "paused" ? (
                            <><Play className="w-3 h-3" /> Reativar</>
                          ) : (
                            <><PauseCircle className="w-3 h-3" /> Pausar</>
                          )}
                        </Button>
                      )}
                      {canBan && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => banMutation.mutate({ id: k.id })}
                          disabled={banMutation.isPending}
                          className="h-7 text-xs gap-1 border-border text-red-400 hover:text-red-300 hover:border-red-500/50"
                        >
                          <Ban className="w-3 h-3" /> Banir
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddDaysTarget({ id: k.id, key: k.key })}
                        className="h-7 text-xs gap-1 border-border text-blue-400 hover:text-blue-300 hover:border-blue-500/50"
                      >
                        <CalendarPlus className="w-3 h-3" /> +Dias
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {addDaysTarget && (
        <AddDaysDialog
          keyId={addDaysTarget.id}
          keyValue={addDaysTarget.key}
          open={true}
          onClose={() => setAddDaysTarget(null)}
        />
      )}
    </div>
  );
}

export default function ManageKeys() {
  return (
    <RequireAuth>
      <PanelLayout title="Gerenciar Keys">
        <ManageKeysContent />
      </PanelLayout>
    </RequireAuth>
  );
}
