import { useState, useEffect, useRef } from "react";
import { Loader2, ShieldCheck, ShieldX, Key } from "lucide-react";

const STORAGE_KEY = "ffh4x_key";
const API_BASE = "/api/public";

type Phase =
  | "checking"      // verificando key salva ao abrir
  | "input"         // aguardando o usuário digitar a key
  | "validating"    // animação "Validando key..."
  | "success"       // key válida
  | "error"         // key inválida
  | "expired_saved" // key salva expirou, pede nova

interface KeyInfo {
  key: string;
  expiresAt: string;
  activatedAt: string;
  durationDays: number;
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
  const [phase, setPhase] = useState<Phase>("checking");
  const [keyInput, setKeyInput] = useState("");
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Ao montar: verifica se há key salva
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setPhase("input");
      return;
    }
    // Verifica a key salva
    checkKey(saved).then(res => {
      if (res.success && res.data) {
        setKeyInfo(res.data);
        setPhase("success");
      } else if (res.result === "expired") {
        localStorage.removeItem(STORAGE_KEY);
        setPhase("expired_saved");
        setTimeout(() => setPhase("input"), 3000);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setPhase("input");
      }
    });
  }, []);

  useEffect(() => {
    if (phase === "input" || phase === "expired_saved") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [phase]);

  const handleValidate = async () => {
    const key = keyInput.toUpperCase().trim();
    if (!key) return;
    setPhase("validating");

    // Pequeno delay para mostrar a animação
    await new Promise(r => setTimeout(r, 1200));

    const res = await validateKey(key);
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

  // ─── Tela: Verificando key salva ───────────────────────────────────────────
  if (phase === "checking") {
    return (
      <AppScreen>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-semibold text-lg">Carregando login</p>
            <p className="text-muted-foreground text-sm mt-1">Verificando sua key...</p>
          </div>
        </div>
      </AppScreen>
    );
  }

  // ─── Tela: Key salva expirou ───────────────────────────────────────────────
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
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </AppScreen>
    );
  }

  // ─── Tela: Validando key... ────────────────────────────────────────────────
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
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </AppScreen>
    );
  }

  // ─── Tela: Sucesso ─────────────────────────────────────────────────────────
  if (phase === "success" && keyInfo) {
    return (
      <AppScreen>
        <div className="flex flex-col items-center gap-5 w-full">
          <div className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-green-400" />
          </div>
          <div className="text-center">
            <p className="text-green-400 font-bold text-xl">Key Validada</p>
          </div>
          <div className="w-full bg-secondary/60 border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">KEY</span>
              <span className="font-mono text-sm font-bold text-foreground tracking-wider">{keyInfo.key}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Data de expiração</span>
              <span className="text-sm text-foreground font-medium">{formatDate(keyInfo.expiresAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Tempo restante</span>
              <span className="text-sm text-green-400 font-medium">{getRemainingText(keyInfo.expiresAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Duração</span>
              <span className="text-sm text-foreground">{keyInfo.durationDays} dia{keyInfo.durationDays !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center px-4">
            Acesso liberado. Sua key está salva e será verificada automaticamente.
          </p>
        </div>
      </AppScreen>
    );
  }

  // ─── Tela: Erro ────────────────────────────────────────────────────────────
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
            <p className="text-muted-foreground text-xs">
              Se acha que foi um erro, entre em contato com seu vendedor
            </p>
          </div>
          <button
            onClick={handleTryAgain}
            className="w-full max-w-xs py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors"
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
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Título */}
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            FFH4X
          </h1>
          <div className="w-12 h-0.5 bg-primary mx-auto mt-2 rounded-full" />
        </div>

        {/* Campo de key */}
        <div className="w-full max-w-xs space-y-3">
          <div
            className="relative w-full"
            onClick={() => inputRef.current?.focus()}
          >
            <div className="flex items-center gap-3 w-full bg-secondary/60 border-2 border-border rounded-2xl px-4 py-4 cursor-text focus-within:border-primary transition-colors">
              <Key className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="INSIRA SUA KEY"
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/60 font-mono text-base tracking-widest outline-none min-w-0"
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
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base tracking-wide hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Entrar
          </button>
        </div>

        <p className="text-xs text-muted-foreground/60 text-center">
          AuthZyon Key System
        </p>
      </div>
    </AppScreen>
  );
}

// ─── Wrapper de tela mobile ────────────────────────────────────────────────────
function AppScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(circle, oklch(0.65 0.22 265) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />
      {/* Glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center justify-center min-h-[60vh]">
        {children}
      </div>
    </div>
  );
}
