import { useState } from "react";
import PanelLayout from "@/components/PanelLayout";
import RequireAuth from "@/components/RequireAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  KeyRound, Copy, CheckCheck, Sparkles, Clock, Loader2, Plus, Minus
} from "lucide-react";
import { cn } from "@/lib/utils";

const DURATIONS = [
  { days: 1, label: "1 Dia", icon: "⚡" },
  { days: 7, label: "7 Dias", icon: "📅" },
  { days: 30, label: "30 Dias", icon: "🗓️" },
];

function CreateKeysContent() {
  const [count, setCount] = useState(1);
  const [duration, setDuration] = useState(1);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const generateMutation = trpc.keys.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedKeys(data.keys);
      toast.success(`${data.count} key${data.count > 1 ? "s" : ""} gerada${data.count > 1 ? "s" : ""} com sucesso!`);
      utils.keys.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao gerar keys");
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({ count, durationDays: duration });
  };

  const copyKey = (key: string, index: number) => {
    navigator.clipboard.writeText(key);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(generatedKeys.join("\n"));
    setCopiedAll(true);
    toast.success("Todas as keys copiadas!");
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Criar Keys</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Gere novas keys de acesso para distribuição</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Configurações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Duração */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              Duração da Key
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d.days}
                  onClick={() => setDuration(d.days)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border text-sm font-medium transition-all duration-150",
                    duration === d.days
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  <span className="text-lg">{d.icon}</span>
                  <span>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantidade */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Quantidade de Keys
            </Label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCount(Math.max(1, count - 1))}
                className="w-9 h-9 rounded-lg border border-border bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <Input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={e => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-20 text-center bg-input border-border text-foreground h-9"
              />
              <button
                onClick={() => setCount(Math.min(100, count + 1))}
                className="w-9 h-9 rounded-lg border border-border bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-sm text-muted-foreground">
                {count > 1 ? `${count} keys` : "1 key"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Máximo de 100 keys por vez</p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="w-full h-11 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Gerando...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 mr-2" />
                Gerar {count > 1 ? `${count} Keys` : "Key"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Keys geradas */}
      {generatedKeys.length > 0 && (
        <Card className="bg-card border-border animate-fade-in-up">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckCheck className="w-4 h-4 text-green-400" />
                {generatedKeys.length} Key{generatedKeys.length > 1 ? "s" : ""} Gerada{generatedKeys.length > 1 ? "s" : ""}
              </CardTitle>
              {generatedKeys.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAll}
                  className="h-8 text-xs gap-1.5 border-border"
                >
                  {copiedAll ? (
                    <><CheckCheck className="w-3.5 h-3.5 text-green-400" /> Copiado!</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copiar Todas</>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border max-h-80 overflow-y-auto">
              {generatedKeys.map((key, i) => (
                <div key={key} className="flex items-center justify-between px-4 py-2.5 group">
                  <span className="font-mono text-sm text-foreground tracking-wider">{key}</span>
                  <button
                    onClick={() => copyKey(key, i)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1 rounded"
                  >
                    {copiedIndex === i ? (
                      <CheckCheck className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function CreateKeys() {
  return (
    <RequireAuth>
      <PanelLayout title="Criar Keys">
        <CreateKeysContent />
      </PanelLayout>
    </RequireAuth>
  );
}
