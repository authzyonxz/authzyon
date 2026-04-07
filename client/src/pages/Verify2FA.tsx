import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Lock, AlertCircle } from "lucide-react";
import axios from "axios";

export default function Verify2FA() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isBackupCode, setIsBackupCode] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("Digite o código");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post("/api/verify-2fa", { code });
      
      if (response.data.success) {
        toast.success("Autenticação bem-sucedida!");
        // Redireciona para o dashboard
        setLocation("/dashboard");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Código inválido";
      toast.error(errorMsg);
      
      setAttempts((prev) => prev + 1);
      if (attempts >= 4) {
        toast.error("Muitas tentativas. Você será desconectado.");
        setTimeout(() => setLocation("/login"), 2000);
      }
      
      setCode("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Verificação 2FA</CardTitle>
          <p className="text-sm text-muted-foreground">
            Digite o código do seu autenticador
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {isBackupCode ? "Código de Backup" : "Código de 6 Dígitos"}
              </label>
              <Input
                type={isBackupCode ? "text" : "text"}
                value={code}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  if (isBackupCode) {
                    setCode(val.replace(/[^A-Z0-9]/g, "").slice(0, 8));
                  } else {
                    setCode(val.replace(/\D/g, "").slice(0, 6));
                  }
                }}
                placeholder={isBackupCode ? "ABC123XYZ" : "000000"}
                maxLength={isBackupCode ? 8 : 6}
                className="bg-input border-border text-foreground text-center text-lg tracking-widest font-mono"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || (isBackupCode ? code.length < 6 : code.length !== 6)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verificando...
                </>
              ) : (
                "Verificar"
              )}
            </Button>
          </form>

          <div className="border-t border-border pt-4">
            <button
              onClick={() => {
                setIsBackupCode(!isBackupCode);
                setCode("");
              }}
              className="text-sm text-primary hover:text-primary/80 transition-colors w-full text-center"
            >
              {isBackupCode ? "Usar código do autenticador" : "Usar código de backup"}
            </button>
          </div>

          {attempts > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              <p className="text-xs text-yellow-600">
                Tentativas restantes: {5 - attempts}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
