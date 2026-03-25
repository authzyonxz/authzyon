import { useState } from "react";
import PanelLayout from "@/components/PanelLayout";
import RequireAuth from "@/components/RequireAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Users as UsersIcon, UserPlus, Ban, KeyRound, Loader2,
  Shield, User, CheckCircle2, XCircle, Edit2
} from "lucide-react";
import { cn } from "@/lib/utils";

function CreateUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ username: "", password: "", keyLimit: 10, role: "user" as "admin" | "user" });
  const utils = trpc.useUtils();

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success(`Usuário ${form.username} criado!`);
      utils.users.list.invalidate();
      onClose();
      setForm({ username: "", password: "", keyLimit: 10, role: "user" });
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            Criar Usuário
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">Usuário</Label>
            <Input
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="Nome de usuário"
              className="bg-input border-border text-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">Senha</Label>
            <Input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Senha"
              className="bg-input border-border text-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">Limite de Keys</Label>
            <Input
              type="number"
              min={1}
              value={form.keyLimit}
              onChange={e => setForm(f => ({ ...f, keyLimit: parseInt(e.target.value) || 1 }))}
              className="bg-input border-border text-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">Função</Label>
            <div className="flex gap-2">
              {(["user", "admin"] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setForm(f => ({ ...f, role: r }))}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium transition-all",
                    form.role === r
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {r === "admin" ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  {r === "admin" ? "Admin" : "Usuário"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">Cancelar</Button>
          <Button
            onClick={() => createMutation.mutate(form)}
            disabled={createMutation.isPending || !form.username || !form.password}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditLimitDialog({
  userId, username, currentLimit, open, onClose
}: { userId: number; username: string; currentLimit: number; open: boolean; onClose: () => void }) {
  const [limit, setLimit] = useState(currentLimit);
  const utils = trpc.useUtils();

  const updateMutation = trpc.users.updateLimit.useMutation({
    onSuccess: () => {
      toast.success(`Limite de ${username} atualizado para ${limit}`);
      utils.users.list.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-primary" />
            Editar Limite de Keys
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Usuário: <span className="text-foreground font-medium">{username}</span>
          </p>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">Novo Limite</Label>
            <Input
              type="number"
              min={0}
              value={limit}
              onChange={e => setLimit(parseInt(e.target.value) || 0)}
              className="bg-input border-border text-foreground"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">Cancelar</Button>
          <Button
            onClick={() => updateMutation.mutate({ id: userId, keyLimit: limit })}
            disabled={updateMutation.isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UsersContent() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: number; username: string; limit: number } | null>(null);

  const { data: users, isLoading } = trpc.users.list.useQuery();
  const utils = trpc.useUtils();

  const banMutation = trpc.users.ban.useMutation({
    onSuccess: () => {
      toast.success("Status do usuário atualizado");
      utils.users.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Usuários</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {users?.length ?? 0} usuário{(users?.length ?? 0) !== 1 ? "s" : ""} cadastrado{(users?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
          size="sm"
        >
          <UserPlus className="w-4 h-4" />
          Novo Usuário
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-primary" />
            Lista de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !users?.length ? (
            <div className="text-center py-12">
              <UsersIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Nenhum usuário cadastrado</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {users.map(u => (
                <div key={u.id} className="px-4 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={u.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                        {u.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm">{u.username}</span>
                        <span className={cn(
                          "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium border",
                          u.role === "admin"
                            ? "bg-primary/20 text-primary border-primary/30"
                            : "bg-secondary text-muted-foreground border-border"
                        )}>
                          {u.role === "admin" ? <Shield className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                          {u.role === "admin" ? "Admin" : "Usuário"}
                        </span>
                        {u.banned === 1 && (
                          <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                            Banido
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <KeyRound className="w-3 h-3" />
                          {u.keysGenerated}/{u.keyLimit} keys
                        </span>
                        {u.lastLoginAt && (
                          <span>Último login: {new Date(u.lastLoginAt).toLocaleDateString("pt-BR")}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditTarget({ id: u.id, username: u.username, limit: u.keyLimit })}
                      className="h-7 text-xs gap-1 border-border"
                    >
                      <Edit2 className="w-3 h-3" /> Limite
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => banMutation.mutate({ id: u.id })}
                      disabled={banMutation.isPending}
                      className={cn(
                        "h-7 text-xs gap-1 border-border",
                        u.banned === 1
                          ? "text-green-400 hover:text-green-300 hover:border-green-500/50"
                          : "text-red-400 hover:text-red-300 hover:border-red-500/50"
                      )}
                    >
                      {u.banned === 1 ? (
                        <><CheckCircle2 className="w-3 h-3" /> Desbanir</>
                      ) : (
                        <><XCircle className="w-3 h-3" /> Banir</>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      {editTarget && (
        <EditLimitDialog
          userId={editTarget.id}
          username={editTarget.username}
          currentLimit={editTarget.limit}
          open={true}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}

export default function Users() {
  return (
    <RequireAuth adminOnly>
      <PanelLayout title="Usuários">
        <UsersContent />
      </PanelLayout>
    </RequireAuth>
  );
}
