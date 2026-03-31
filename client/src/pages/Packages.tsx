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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Package as PackageIcon, Plus, Trash2, Copy, Loader2,
  Calendar, KeyRound, Globe, GlobeLock
} from "lucide-react";
import { cn } from "@/lib/utils";

function CreatePackageDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const utils = trpc.useUtils();

  const createMutation = trpc.packages.create.useMutation({
    onSuccess: () => {
      toast.success(`Pacote "${name}" criado com sucesso!`);
      utils.packages.list.invalidate();
      onClose();
      setName("");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Criar Novo Pacote
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">Nome do Pacote</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Meu App iOS, Sistema VIP"
              className="bg-input border-border text-foreground"
            />
          </div>
          <p className="text-xs text-muted-foreground italic">
            Ao criar, um Token de integração único será gerado para este pacote.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">Cancelar</Button>
          <Button
            onClick={() => createMutation.mutate({ name })}
            disabled={createMutation.isPending || !name.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PackagesContent() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: pkgs, isLoading } = trpc.packages.list.useQuery();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.packages.delete.useMutation({
    onSuccess: () => {
      toast.success("Pacote removido");
      utils.packages.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const statusMutation = trpc.packages.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status do pacote atualizado");
      utils.packages.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("Token copiado para a área de transferência!");
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Packages (Pacotes)</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gerencie os pacotes de integração para suas Keys
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          Novo Pacote
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !pkgs?.length ? (
          <Card className="col-span-full bg-card border-border border-dashed py-12">
            <div className="text-center">
              <PackageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground">Nenhum pacote criado ainda</p>
              <Button 
                variant="link" 
                onClick={() => setCreateOpen(true)}
                className="text-primary mt-2"
              >
                Criar meu primeiro pacote
              </Button>
            </div>
          </Card>
        ) : (
          pkgs.map(pkg => (
            <Card key={pkg.id} className={cn(
              "bg-card border-border overflow-hidden group transition-all duration-300",
              pkg.status === "offline" && "opacity-75 grayscale-[0.5]"
            )}>
              <CardHeader className="pb-3 bg-secondary/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-foreground truncate flex items-center gap-2">
                    <PackageIcon className={cn("w-4 h-4", pkg.status === "online" ? "text-primary" : "text-muted-foreground")} />
                    {pkg.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if(confirm("Tem certeza que deseja excluir este pacote? As keys vinculadas a ele podem parar de funcionar.")) {
                          deleteMutation.mutate({ id: pkg.id });
                        }
                      }}
                      className="h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/10 border border-border/40">
                  <div className="flex items-center gap-2">
                    {pkg.status === "online" ? (
                      <Globe className="w-4 h-4 text-green-400" />
                    ) : (
                      <GlobeLock className="w-4 h-4 text-red-400" />
                    )}
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      pkg.status === "online" ? "text-green-400" : "text-red-400"
                    )}>
                      {pkg.status}
                    </span>
                  </div>
                  <Switch 
                    checked={pkg.status === "online"}
                    onCheckedChange={(checked) => {
                      statusMutation.mutate({ id: pkg.id, status: checked ? "online" : "offline" });
                    }}
                    disabled={statusMutation.isPending}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Token de Integração</Label>
                  <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 border border-border/50 group-hover:border-primary/30 transition-colors">
                    <code className="flex-1 text-xs text-primary font-mono truncate">
                      {pkg.token}
                    </code>
                    <button 
                      onClick={() => copyToken(pkg.token)}
                      className="p-1.5 hover:bg-primary/20 rounded-md text-muted-foreground hover:text-primary transition-colors"
                      title="Copiar Token"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(pkg.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <KeyRound className="w-3 h-3" />
                    ID: {pkg.id}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreatePackageDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

export default function Packages() {
  return (
    <RequireAuth adminOnly>
      <PanelLayout title="Packages">
        <PackagesContent />
      </PanelLayout>
    </RequireAuth>
  );
}
