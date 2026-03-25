# AuthZyon iOS - Guia de Integração Rápida

## 📱 Base URL
```
https://authpanel-ujuvsni4.manus.space
```

## 🚀 Como Usar (3 Passos)

### Passo 1: Copiar os 3 arquivos Swift para seu projeto Xcode

1. **iOS_AuthZyonModels.swift** → Copie para seu projeto
2. **iOS_AuthZyonService.swift** → Copie para seu projeto  
3. **iOS_LoginView.swift** → Copie para seu projeto

### Passo 2: Usar a LoginView no seu app

Em seu `ContentView.swift` ou `App.swift`:

```swift
import SwiftUI

@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            LoginView()
        }
    }
}
```

### Passo 3: Pronto! 🎉

Seu app agora:
- ✅ Pede uma key ao abrir
- ✅ Valida a key no servidor
- ✅ Salva a key localmente
- ✅ Auto-login ao reabrir o app
- ✅ Mostra mensagens de sucesso/erro

---

## 🔑 Gerar Keys no Painel

1. Acesse: `https://authpanel-ujuvsni4.manus.space/login`
2. Login: **RUAN** / **RUAN123**
3. Vá em "Criar Keys"
4. Escolha duração: 1 dia, 7 dias ou 30 dias
5. Clique "Gerar"
6. Copie a key e teste no seu app

---

## 📝 Endpoints da API

### Validar Key (primeira vez)
```
POST https://authpanel-ujuvsni4.manus.space/api/public/validate-key
Content-Type: application/json

{
  "key": "ABCDEFGHIJ12"
}
```

**Resposta Sucesso:**
```json
{
  "success": true,
  "result": "success",
  "key": "ABCDEFGHIJ12",
  "expiresAt": "2026-03-26T20:00:00.000Z",
  "durationDays": 1
}
```

### Verificar Key (auto-login)
```
GET https://authpanel-ujuvsni4.manus.space/api/public/check-key/ABCDEFGHIJ12
```

**Resposta Sucesso:**
```json
{
  "success": true,
  "result": "valid",
  "key": "ABCDEFGHIJ12",
  "expiresAt": "2026-03-26T20:00:00.000Z",
  "remainingMs": 72000000
}
```

---

## 🎯 Fluxo do App

```
Abrir App
    ↓
Verificar se tem key salva
    ↓
├─ SIM → Validar key com servidor
│        ├─ Válida → Liberar acesso
│        └─ Expirada → Pedir nova key
│
└─ NÃO → Mostrar tela de input
         ↓
         Usuário digita key
         ↓
         Validar no servidor
         ↓
         ├─ Sucesso → Salvar key + Liberar acesso
         └─ Erro → Mostrar mensagem + Tentar novamente
```

---

## 🛠️ Customizar

### Mudar o título "FFH4X"
Em `iOS_LoginView.swift`, linha ~85:
```swift
Text("FFH4X")  // ← Mude para seu título
```

### Mudar cores
Em `iOS_LoginView.swift`, procure por:
```swift
.foregroundColor(.white)  // Mude para sua cor
.backgroundColor(.black)  // Mude para sua cor
```

### Mudar duração da animação
Em `iOS_LoginView.swift`, linha ~60:
```swift
try? await Task.sleep(nanoseconds: 1_200_000_000)  // 1.2 segundos
// Mude para: 2_000_000_000 para 2 segundos
```

---

## 📋 Checklist

- [ ] Copiei os 3 arquivos Swift
- [ ] Adicionei `LoginView()` no meu app
- [ ] Testei com uma key gerada no painel
- [ ] Fechei e reabri o app (auto-login funcionou)
- [ ] Testei com uma key expirada
- [ ] Customizei cores/textos conforme necessário

---

## ❓ Troubleshooting

### "Erro de conexão"
- Verifique internet
- Confirme que `https://authpanel-ujuvsni4.manus.space` está acessível

### "Key inválida"
- Gere uma nova key no painel
- Confirme que a key não foi banida

### "Key expirada"
- Gere uma nova key com duração maior
- Ou adicione dias extras no painel (opção "+Dias")

---

## 📞 Suporte

Painel de controle: `https://authpanel-ujuvsni4.manus.space`
- Gerar keys
- Ver histórico de validações
- Gerenciar usuários
- Editar perfil

---

**Pronto para usar! 🚀**
