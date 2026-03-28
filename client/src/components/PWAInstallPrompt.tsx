import { useState, useEffect } from "react";
import { Shield, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Componente que exibe um banner discreto convidando o usuário a instalar
 * o AuthZyon como aplicativo PWA na tela inicial do dispositivo.
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Verifica se já foi dispensado anteriormente
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm
                 bg-card border border-border rounded-2xl shadow-2xl p-4 flex items-center gap-3
                 animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      {/* Ícone */}
      <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
        <Shield className="w-5 h-5 text-primary" />
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">Instalar AuthZyon</p>
        <p className="text-xs text-muted-foreground mt-0.5">Adicione à tela inicial para acesso rápido</p>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          onClick={handleInstall}
          className="h-8 px-3 text-xs gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Instalar
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDismiss}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
