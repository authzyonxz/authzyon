import { useState, useRef } from "react";
import PanelLayout from "@/components/PanelLayout";
import RequireAuth from "@/components/RequireAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { UserCircle, Camera, Save, Loader2, KeyRound, Shield, User } from "lucide-react";
import { usePanelAuth } from "@/hooks/usePanelAuth";

function ProfileContent() {
  const { user } = usePanelAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [avatarMime, setAvatarMime] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const updateMutation = trpc.panel.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      utils.panel.me.invalidate();
      setAvatarBase64(null);
      setAvatarMime(null);
      setAvatarPreview(null);
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar perfil"),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      // result = "data:image/jpeg;base64,..."
      const [header, b64] = result.split(",");
      const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
      setAvatarPreview(result);
      setAvatarBase64(b64);
      setAvatarMime(mime);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const updates: { username?: string; avatarBase64?: string; avatarMime?: string } = {};
    if (username && username !== user?.username) updates.username = username;
    if (avatarBase64 && avatarMime) {
      updates.avatarBase64 = avatarBase64;
      updates.avatarMime = avatarMime;
    }
    if (Object.keys(updates).length === 0) {
      toast.info("Nenhuma alteração detectada");
      return;
    }
    updateMutation.mutate(updates);
  };

  const currentAvatar = avatarPreview ?? user?.avatarUrl ?? undefined;

  return (
    <div className="space-y-6 max-w-lg animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Meu Perfil</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Edite suas informações pessoais</p>
      </div>

      {/* Avatar */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-primary" />
            Foto de Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={currentAvatar} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                {user?.username?.charAt(0).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-primary-foreground" />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{user?.username}</p>
            <p className="text-xs text-muted-foreground capitalize flex items-center gap-1 mt-0.5">
              {user?.role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
              {user?.role === "admin" ? "Administrador" : "Usuário"}
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs text-primary hover:text-primary/80 mt-1.5 transition-colors"
            >
              Alterar foto
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Informações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">Nome de Usuário</Label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="bg-input border-border text-foreground"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-secondary/50 rounded-lg p-3 border border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <KeyRound className="w-3 h-3" />
                Keys Geradas
              </div>
              <p className="text-lg font-bold text-foreground">{user?.keysGenerated ?? 0}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 border border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <KeyRound className="w-3 h-3" />
                Limite de Keys
              </div>
              <p className="text-lg font-bold text-foreground">
                {user?.role === "admin" ? "∞" : user?.keyLimit ?? 0}
              </p>
            </div>
          </div>

          {user?.createdAt && (
            <p className="text-xs text-muted-foreground">
              Conta criada em: {new Date(user.createdAt).toLocaleDateString("pt-BR")}
            </p>
          )}

          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {updateMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Salvando...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Salvar Alterações</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Profile() {
  return (
    <RequireAuth>
      <PanelLayout title="Meu Perfil">
        <ProfileContent />
      </PanelLayout>
    </RequireAuth>
  );
}
