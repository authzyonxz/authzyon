import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Copy, Check, AlertCircle } from "lucide-react";
import { useState as useStateRef } from "react";

interface TwoFactorSetupProps {
  isEnabled?: boolean;
  onInitiate?: () => Promise<{ secret: string; qrCode: string }>;
  onConfirm?: (token: string, secret: string) => Promise<void>;
  onDisable?: (password: string) => Promise<void>;
  onRegenerateBackupCodes?: () => Promise<{ codes: string[] }>;
}

export function TwoFactorSetup({
  isEnabled = false,
  onInitiate,
  onConfirm,
  onDisable,
  onRegenerateBackupCodes,
}: TwoFactorSetupProps) {
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isDisableOpen, setIsDisableOpen] = useState(false);
  const [isBackupCodesOpen, setIsBackupCodesOpen] = useState(false);
  
  const [secret, setSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);

  const handleInitiate = async () => {
    setIsLoading(true);
    try {
      const result = await onInitiate?.();
      if (result) {
        setSecret(result.secret);
        setQrCode(result.qrCode);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao iniciar 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!token.trim()) {
      toast.error("Digite o código de 6 dígitos");
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm?.(token, secret);
      toast.success("Autenticação de dois fatores ativada!");
      setIsSetupOpen(false);
      setToken("");
      setSecret("");
      setQrCode("");
    } catch (error: any) {
      toast.error(error.message || "Código inválido");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!password.trim()) {
      toast.error("Digite sua senha");
      return;
    }

    setIsLoading(true);
    try {
      await onDisable?.(password);
      toast.success("Autenticação de dois fatores desativada");
      setIsDisableOpen(false);
      setPassword("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao desativar 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    setIsLoading(true);
    try {
      const result = await onRegenerateBackupCodes?.();
      if (result) {
        setBackupCodes(result.codes);
        setIsBackupCodesOpen(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao regenerar códigos");
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Autenticação de Dois Fatores (2FA)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isEnabled
              ? "A autenticação de dois fatores está ativada. Você precisará de um código do seu autenticador para fazer login."
              : "Ative a autenticação de dois fatores para aumentar a segurança da sua conta."}
          </p>

          <div className="flex gap-2">
            {!isEnabled ? (
              <Button
                onClick={() => {
                  setIsSetupOpen(true);
                  handleInitiate();
                }}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ativar 2FA"}
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => handleRegenerateBackupCodes()}
                  disabled={isLoading}
                  variant="outline"
                  className="border-border"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Regenerar Códigos de Backup"}
                </Button>
                <Button
                  onClick={() => setIsDisableOpen(true)}
                  disabled={isLoading}
                  variant="destructive"
                >
                  Desativar 2FA
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Setup */}
      <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>Ativar Autenticação de Dois Fatores</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {qrCode && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">1. Escaneie o código QR</Label>
                <div className="bg-white p-4 rounded-lg flex justify-center">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Use um aplicativo como Google Authenticator, Microsoft Authenticator ou Authy
                </p>
              </div>
            )}

            {secret && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Ou digite manualmente</Label>
                <div className="flex gap-2">
                  <Input
                    value={secret}
                    readOnly
                    className="bg-input border-border text-foreground font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(secret);
                      toast.success("Copiado!");
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">2. Digite o código de 6 dígitos</Label>
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="bg-input border-border text-foreground text-center text-lg tracking-widest"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSetupOpen(false)} className="border-border">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || token.length !== 6}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Desativar */}
      <Dialog open={isDisableOpen} onOpenChange={setIsDisableOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>Desativar 2FA</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Digite sua senha para confirmar a desativação da autenticação de dois fatores.
            </p>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              className="bg-input border-border text-foreground"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisableOpen(false)} className="border-border">
              Cancelar
            </Button>
            <Button
              onClick={handleDisable}
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Desativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Códigos de Backup */}
      <Dialog open={isBackupCodesOpen} onOpenChange={setIsBackupCodesOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>Códigos de Backup</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Guarde esses códigos em um local seguro. Você pode usá-los para acessar sua conta se perder acesso ao seu autenticador.
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {backupCodes.map((code) => (
                <div
                  key={code}
                  onClick={() => copyCode(code)}
                  className="flex items-center justify-between bg-secondary p-3 rounded cursor-pointer hover:bg-secondary/80 transition-colors"
                >
                  <span className="font-mono text-sm text-foreground">{code}</span>
                  {copiedCode === code ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsBackupCodesOpen(false)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
            >
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
