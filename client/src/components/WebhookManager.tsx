import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";

const AVAILABLE_EVENTS = [
  { id: "key.created", label: "Chave Criada" },
  { id: "key.banned", label: "Chave Banida" },
  { id: "key.paused", label: "Chave Pausada" },
  { id: "key.expired", label: "Chave Expirada" },
  { id: "key.activated", label: "Chave Ativada" },
  { id: "package.offline", label: "Pacote Offline" },
  { id: "package.online", label: "Pacote Online" },
];

interface Webhook {
  id: number;
  url: string;
  events: string[];
  isActive: number;
  lastTriggeredAt?: string;
}

interface WebhookManagerProps {
  webhooks?: Webhook[];
  isLoading?: boolean;
  onCreateWebhook?: (data: { url: string; events: string[] }) => Promise<void>;
  onUpdateWebhook?: (id: number, data: any) => Promise<void>;
  onDeleteWebhook?: (id: number) => Promise<void>;
}

export function WebhookManager({
  webhooks = [],
  isLoading = false,
  onCreateWebhook,
  onUpdateWebhook,
  onDeleteWebhook,
}: WebhookManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!url.trim()) {
      toast.error("URL é obrigatória");
      return;
    }

    if (selectedEvents.length === 0) {
      toast.error("Selecione pelo menos um evento");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateWebhook?.({ url, events: selectedEvents });
      toast.success("Webhook criado com sucesso!");
      setUrl("");
      setSelectedEvents([]);
      setIsCreateOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar webhook");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este webhook?")) return;

    try {
      await onDeleteWebhook?.(id);
      toast.success("Webhook deletado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar webhook");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Webhooks</h3>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Webhook
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : webhooks.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">Nenhum webhook configurado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className="bg-card border-border">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-foreground truncate">{webhook.url}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {webhook.events.map((event) => (
                        <span
                          key={event}
                          className="inline-block bg-primary/20 text-primary text-xs px-2 py-0.5 rounded"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                    {webhook.lastTriggeredAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Última ativação: {new Date(webhook.lastTriggeredAt).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(webhook.id)}
                      className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Criar Webhook */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Webhook</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">URL do Webhook</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://seu-servidor.com/webhooks/authzyon"
                className="bg-input border-border text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Receberá POST requests com eventos de chaves e pacotes
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Eventos</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {AVAILABLE_EVENTS.map((event) => (
                  <div key={event.id} className="flex items-center gap-2">
                    <Checkbox
                      id={event.id}
                      checked={selectedEvents.includes(event.id)}
                      onCheckedChange={() => handleToggleEvent(event.id)}
                      className="border-border"
                    />
                    <Label htmlFor={event.id} className="text-sm font-normal cursor-pointer">
                      {event.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="border-border">
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
