import { useState } from "react";
import PanelLayout from "@/components/PanelLayout";
import RequireAuth from "@/components/RequireAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Lock, Bell, History } from "lucide-react";
import { WebhookManager } from "@/components/WebhookManager";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";

function SettingsContent() {
  const [activeTab, setActiveTab] = useState("webhooks");

  const handleExportAudit = async () => {
    try {
      // Implementar exportação de auditoria
      toast.success("Auditoria exportada com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar auditoria");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Configurações</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Gerencie webhooks, segurança e auditoria</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary">
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Auditoria
          </TabsTrigger>
        </TabsList>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Gerenciar Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configure webhooks para receber notificações em tempo real sobre eventos de chaves e pacotes.
              </p>
              <WebhookManager
                webhooks={[]}
                isLoading={false}
                onCreateWebhook={async (data) => {
                  // Implementar chamada à API
                  toast.success("Webhook criado!");
                }}
                onDeleteWebhook={async (id) => {
                  // Implementar chamada à API
                  toast.success("Webhook deletado!");
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Segurança da Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <TwoFactorSetup
                isEnabled={false}
                onInitiate={async () => {
                  // Implementar chamada à API
                  return { secret: "JBSWY3DPEBLW64TMMQ======", qrCode: "data:image/png;base64,..." };
                }}
                onConfirm={async (token, secret) => {
                  // Implementar chamada à API
                  toast.success("2FA ativado!");
                }}
                onDisable={async (password) => {
                  // Implementar chamada à API
                  toast.success("2FA desativado!");
                }}
                onRegenerateBackupCodes={async () => {
                  // Implementar chamada à API
                  return { codes: ["ABC123", "DEF456", "GHI789", "JKL012", "MNO345"] };
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Histórico de Auditoria</CardTitle>
              <Button
                onClick={handleExportAudit}
                size="sm"
                variant="outline"
                className="border-border gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Implementar listagem de auditoria */}
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum registro de auditoria disponível
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Settings() {
  return (
    <RequireAuth>
      <PanelLayout title="Configurações">
        <SettingsContent />
      </PanelLayout>
    </RequireAuth>
  );
}
