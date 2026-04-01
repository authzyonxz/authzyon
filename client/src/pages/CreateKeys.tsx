import { useState } from "react";
import PanelLayout from "@/components/PanelLayout";
import RequireAuth from "@/components/RequireAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  KeyRound, Copy, CheckCheck, Sparkles, Clock, Loader2, Plus, Minus, Package as PackageIcon, X
} from "lucide-react";
import { cn } from "@/lib/utils";

const DURATIONS = [
  { days: 1, label: "1 Dia", short: "1d" },
  { days: 7, label: "7 Dias", short: "7d" },
  { days: 30, label: "30 Dias", short: "30d" },
];

interface GeneratedKeysModalProps {
  keys: string[];
  durationLabel: string;
  packageName: string;
  onClose: () => void;
}

function GeneratedKeysModal({ keys, durationLabel, packageName, onClose }: GeneratedKeysModalProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyKey = (key: string, index: number) => {
    navigator.clipboard.writeText(key);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(keys.join("\n"));
    setCopiedAll(true);
    toast.success("Todas as keys copiadas!");
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div className="w-full max-w-sm rounded-3xl bg-[#1c1c1e] border border-white/5 shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Keys Geradas ({keys.length})
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Keys list */}
        <div className="px-6 space-y-2.5 max-h-[60vh] overflow-y-auto pb-2 scrollbar-hide">
          {keys.map((key, i) => (
            <div
              key={key}
              onClick={() => copyKey(key, i)}
              className="w-full flex items-center justify-between bg-[#2c2c2e] hover:bg-[#3a3a3c] rounded-2xl px-5 py-4 transition-all duration-200 group cursor-pointer active:scale-[0.98]"
            >
              <span className="font-mono text-[13px] font-medium text-white/90 tracking-wider truncate pr-4">
                {key}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] font-bold bg-[#1a4a5a] text-[#4ec9e0] px-2 py-0.5 rounded-md uppercase tracking-tighter">
                  {durationLabel}
                </span>
                {copiedIndex === i ? (
                  <CheckCheck className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Copy all button */}
        <div className="px-6 pt-4 pb-7">
          <button
            onClick={copyAll}
            className={cn(
              "w-full h-[54px] rounded-[20px] font-bold text-[15px] flex items-center justify-center gap-2.5 transition-all duration-300 active:scale-[0.97] shadow-lg",
              copiedAll
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
            )}
          >
            {copiedAll ? (
              <>
                <CheckCheck className="w-5 h-5" />
                Copiado com Sucesso!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copiar Todas as Keys
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateKeysContent() {
  const [count, setCount] = useState(1);
  const [duration, setDuration] = useState(1);
  const [packageId, setPackageId] = useState<string>("none");
  const [showModal, setShowModal] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);

  const utils = trpc.useUtils();
  const { data: packages } = trpc.packages.list.useQuery();

  const selectedDuration = DURATIONS.find(d => d.days === duration) ?? DURATIONS[0];
  const selectedPackage = packages?.find(p => p.id.toString() === packageId);
  const packageName = selectedPackage ? selectedPackage.name : "Nenhum";

  const generateMutation = trpc.keys.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedKeys(data.keys);
      setShowModal(true);
      toast.success(`${data.count} key${data.count > 1 ? "s" : ""} gerada${data.count > 1 ? "s" : ""} com sucesso!`);
      utils.keys.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao gerar keys");
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      count,
      durationDays: duration,
      packageId: packageId === "none" ? undefined : parseInt(packageId)
    });
  };

  return (
    <>
      {showModal && generatedKeys.length > 0 && (
        <GeneratedKeysModal
          keys={generatedKeys}
          durationLabel={selectedDuration.short}
          packageName={packageName}
          onClose={() => setShowModal(false)}
        />
      )}

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
            {/* Package Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <PackageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                Vincular a um Pacote (Opcional)
              </Label>
              <Select value={packageId} onValueChange={setPackageId}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Selecione um pacote" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="none">Nenhum (Livre)</SelectItem>
                  {packages?.map(pkg => (
                    <SelectItem key={pkg.id} value={pkg.id.toString()}>
                      {pkg.name} {pkg.status === "offline" ? "(Offline)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Se selecionar um pacote, a key só funcionará em projetos configurados com o token desse pacote.
              </p>
            </div>

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
                      "flex items-center justify-center p-3 rounded-xl border text-sm font-medium transition-all duration-150",
                      duration === d.days
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
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

        {/* Botão para reabrir o modal se já gerou keys */}
        {generatedKeys.length > 0 && !showModal && (
          <button
            onClick={() => setShowModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            Ver {generatedKeys.length} key{generatedKeys.length > 1 ? "s" : ""} gerada{generatedKeys.length > 1 ? "s" : ""}
          </button>
        )}
      </div>
    </>
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
