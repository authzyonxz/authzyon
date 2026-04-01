import { useState, useEffect, useRef } from "react";
import { Loader2, ShieldCheck, ShieldX, Key, Wifi, WifiOff, Clock } from "lucide-react";

const STORAGE_KEY = "ffh4x_key";
const API_BASE = "/api/public";

type Phase =
  | "checking_status" // "CHECKING PACKAGE STATUS"
  | "package_online"  // "PACKAGE ONLINE"
  | "package_offline" // "PACKAGE OFFLINE TEMPORARIAMENTE"
  | "checking_key"    // verificando key salva
  | "input"           // aguardando o usuário digitar a key
  | "validating"      // animação "Validando key..."
  | "success"         // key válida
  | "error"           // key inválida
  | "expired_saved"   // key salva expirou

interface KeyInfo {
  key: string;
  expiresAt: string;
  activatedAt: string;
  durationDays: number;
  packageName?: string;
}

async function validateKey(key: string): Promise<{ success: boolean; data?: KeyInfo; result?: string; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/validate-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    const json = await res.json();
    if (json.success) {
      return {
        success: true,
        data: {
          key: json.key,
          expiresAt: json.expiresAt,
          activatedAt: json.activatedAt,
          durationDays: json.durationDays,
          packageName: json.packageName,
        },
      };
    }
    return { success: false, result: json.result, message: json.message };
  } catch {
    return { success: false, result: "error", message: "Erro de conexão" };
  }
}

async function checkKey(key: string): Promise<{ success: boolean; data?: KeyInfo; result?: string }> {
  try {
    const res = await fetch(`${API_BASE}/check-key/${encodeURIComponent(key)}`);
    const json = await res.json();
    if (json.success) {
      return {
        success: true,
        data: {
          key: json.key,
          expiresAt: json.expiresAt,
          activatedAt: json.activatedAt,
          durationDays: json.durationDays,
          packageName: json.packageName,
        },
      };
    }
    return { success: false, result: json.result };
  } catch {
    return { success: false, result: "error" };
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getRemainingText(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expirada";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days} dia${days > 1 ? "s" : ""} restante${days > 1 ? "s" : ""}`;
  return `${hours} hora${hours > 1 ? "s" : ""} restante${hours > 1 ? "s" : ""}`;
}

export default function AppLogin() {
  const [phase, setPhase] = useState<Phase>("checking_status");
  const [keyInput, setKeyInput] = useState("");
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(10);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fluxo inicial de verificação
  useEffect(() => {
    const startFlow = async () => {
      // 1. "CHECKING PACKAGE STATUS"
      setPhase("checking_status");
      await new Promise(r => setTimeout(r, 1500));

      const savedKey = localStorage.getItem(STORAGE_KEY);
      
      if (!savedKey) {
        // Se não tem key, apenas assume online para deixar entrar a key
        // (Ou você poderia ter um endpoint só de status, mas vamos usar o fluxo da key)
        setPhase("package_online");
        await new Promise(r => setTimeout(r, 1000));
        setPhase("input");
        return;
      }

      // 2. Verifica a key salva (isso já checa o status do package no servidor)
      const res = await checkKey(savedKey);

      if (res.result === "offline") {
        setPhase("package_offline");
        return;
      }

      // Se não está offline, mostra "PACKAGE ONLINE"
      setPhase("package_online");
      await new Promise(r => setTimeout(r, 1000));

      if (res.success && res.data) {
        setKeyInfo(res.data);
        setPhase("success");
      } else if (res.result === "expired") {
        localStorage.removeItem(STORAGE_KEY);
        setPhase("expired_saved");
        await new Promise(r => setTimeout(r, 2500));
        setPhase("input");
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setPhase("input");
      }
    };

    startFlow();
  }, []);

  // Timer para fechar o app se estiver offline
  useEffect(() => {
    if (phase === "package_offline" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === "package_offline" && countdown === 0) {
      // Simula fechar o app (redireciona ou limpa tela)
      window.location.href = "about:blank";
    }
  }, [phase, countdown]);

  useEffect(() => {
    if (phase === "input") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [phase]);

  const handleValidate = async () => {
    const key = keyInput.toUpperCase().trim();
    if (!key) return;
    setPhase("validating");

    await new Promise(r => setTimeout(r, 1200));

    const res = await validateKey(key);
    
    if (res.result === "offline") {
      setPhase("package_offline");
      return;
    }

    if (res.success && res.data) {
      localStorage.setItem(STORAGE_KEY, res.data.key);
      setKeyInfo(res.data);
      setPhase("success");
    } else {
      setErrorMsg(res.message ?? "Key inválida, insira uma key válida");
      setPhase("error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleValidate();
  };

  const handleTryAgain = () => {
    setKeyInput("");
    setErrorMsg("");
    setPhase("input");
  };

  // ─── Telas de Status ───────────────────────────────────────────────────────
  
  if (phase === "checking_status") {
    return (
      <AppScreen>
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center">
              <Wifi className="w-4 h-4 text-primary animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-white font-black text-xl tracking-tighter">CHECKING PACKAGE STATUS</p>
            <p className="text-muted-foreground text-xs uppercase tracking-widest opacity-60">Conectando ao servidor...</p>
          </div>
        </div>
      </AppScreen>
    );
  }

  if (phase === "package_online") {
    return (
      <AppScreen>
        <div className="flex flex-col items-center gap-5 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            <Wifi className="w-10 h-10 text-green-400" />
          </div>
          <div className="text-center">
            <p className="text-green-400 font-black text-2xl tracking-tighter">PACKAGE ONLINE</p>
            <p className="text-white/60 text-xs mt-1 uppercase tracking-widest">Acesso Autorizado</p>
          </div>
        </div>
      </AppScreen>
    );
  }

  if (phase === "package_offline") {
    return (
      <AppScreen>
        <div className="flex flex-col items-center gap-6 w-full max-w-[280px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.2)]">
            <WifiOff className="w-12 h-12 text-red-400" />
          </div>
          <div className="text-center space-y-3">
            <p className="text-red-400 font-black text-xl leading-tight tracking-tighter">
              PACKAGE OFFLINE <br/> TEMPORARIAMENTE
            </p>
            <div className="h-px bg-red-500/20 w-12 mx-auto" />
            <p className="text-white/70 text-sm font-medium">
              O sistema está em manutenção. Por favor, tente novamente mais tarde.
            </p>
          </div>
          
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-red-400" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Fechando em</p>
                <p className="text-white font-mono font-bold text-lg">{countdown}s</p>
              </div>
            </div>
            <div className="relative w-12 h-12">
               <svg className="w-12 h-12 -rotate-90">
                 <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                 <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="125.6" strokeDashoffset={125.6 - (125.6 * countdown / 10)} className="text-red-500 transition-all duration-1000" />
               </svg>
            </div>
          </div>
        </div>
      </AppScreen>
    );
  }

  // ─── Telas de Key ──────────────────────────────────────────────────────────

  if (phase === "expired_saved") {
    return (
      <AppScreen>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-red-400" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-semibold text-lg">Key Expirada</p>
            <p className="text-muted-foreground text-sm mt-1">Sua key expirou. Redirecionando...</p>
          </div>
        </div>
      </AppScreen>
    );
  }

  if (phase === "validating") {
    return (
      <AppScreen>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-semibold text-lg">Validando key</p>
            <p className="text-muted-foreground text-sm mt-1">Aguarde um momento...</p>
          </div>
        </div>
      </AppScreen>
    );
  }

  if (phase === "success" && keyInfo) {
    return (
      <AppScreen>
        <div className="flex flex-col items-center gap-5 w-full">
          <div className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-green-400" />
          </div>
          <div className="text-center">
            <p className="text-green-400 font-bold text-xl">Acesso Liberado</p>
            {keyInfo.packageName && (
               <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mt-1 font-bold">{keyInfo.packageName}</p>
            )}
          </div>
          <div className="w-full bg-secondary/60 border border-border rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Key Ativa</span>
              <span className="font-mono text-sm font-bold text-foreground tracking-wider">{keyInfo.key}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Expira em</span>
                 <span className="text-sm text-foreground font-medium">{formatDate(keyInfo.expiresAt)}</span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Restante</span>
                 <span className="text-sm text-green-400 font-bold">{getRemainingText(keyInfo.expiresAt)}</span>
               </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center px-6 uppercase tracking-widest leading-relaxed">
            Bem-vindo de volta. Sua sessão está ativa e segura.
          </p>
        </div>
      </AppScreen>
    );
  }

  if (phase === "error") {
    return (
      <AppScreen>
        <div className="flex flex-col items-center gap-5 w-full">
          <div className="w-20 h-20 rounded-full bg-red-500/15 border-2 border-red-500/40 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-red-400" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-red-400 font-bold text-xl">Key inválida</p>
            <p className="text-foreground text-sm">{errorMsg}</p>
          </div>
          <button
            onClick={handleTryAgain}
            className="w-full max-w-xs py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all active:scale-95"
          >
            Tentar novamente
          </button>
        </div>
      </AppScreen>
    );
  }

  // ─── Tela: Input de key ────────────────────────────────────────────────────
  return (
    <AppScreen>
      <div className="flex flex-col items-center gap-8 w-full">
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tighter text-foreground italic">
            FFH4X
          </h1>
          <div className="w-16 h-1.5 bg-primary mx-auto mt-2 rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
        </div>

        <div className="w-full max-w-xs space-y-4">
          <div
            className="relative w-full"
            onClick={() => inputRef.current?.focus()}
          >
            <div className="flex items-center gap-4 w-full bg-secondary/40 border-2 border-border rounded-[24px] px-5 py-5 cursor-text focus-within:border-primary/50 focus-within:bg-secondary/60 transition-all duration-300">
              <Key className="w-6 h-6 text-primary/40 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="INSIRA SUA KEY"
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/30 font-mono text-lg font-bold tracking-[0.2em] outline-none min-w-0"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={20}
              />
            </div>
          </div>

          <button
            onClick={handleValidate}
            disabled={!keyInput.trim()}
            className="w-full py-5 rounded-[24px] bg-primary text-primary-foreground font-black text-lg uppercase tracking-widest hover:bg-primary/90 active:scale-[0.96] transition-all disabled:opacity-20 disabled:grayscale shadow-lg shadow-primary/20"
          >
            Entrar no App
          </button>
        </div>

        <div className="flex flex-col items-center gap-1 opacity-30">
           <p className="text-[9px] font-bold uppercase tracking-[0.3em]">AuthZyon Secure System</p>
           <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-primary" />
              <div className="w-1 h-1 rounded-full bg-primary" />
              <div className="w-1 h-1 rounded-full bg-primary" />
           </div>
        </div>
      </div>
    </AppScreen>
  );
}

function AppScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-8 overflow-hidden font-sans">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center justify-center min-h-[70vh]">
        {children}
      </div>
    </div>
  );
}
