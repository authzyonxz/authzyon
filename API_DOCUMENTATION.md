# AuthZyon — Documentação da API REST Pública

Esta documentação descreve os endpoints públicos da API AuthZyon para integração com aplicativos iOS (Swift/SwiftUI/Objective-C).

---

## Base URL

```
https://SEU_DOMINIO.manus.space
```

Substitua `SEU_DOMINIO` pelo domínio do seu projeto AuthZyon após a publicação.

---

## Endpoints

### 1. Validar Key

**`POST /api/public/validate-key`**

Valida uma key de acesso. Se for a primeira vez que a key é usada, ela é **ativada** e o contador de tempo começa a partir deste momento.

#### Request

```http
POST /api/public/validate-key
Content-Type: application/json

{
  "key": "ABCDEFGHIJ12"
}
```

| Campo | Tipo   | Obrigatório | Descrição          |
|-------|--------|-------------|---------------------|
| `key` | string | Sim         | A key a ser validada (case-insensitive, será convertida para maiúsculas) |

#### Respostas

**Sucesso (200)**
```json
{
  "success": true,
  "result": "success",
  "key": "ABCDEFGHIJ12",
  "status": "active",
  "activatedAt": "2026-03-25T20:00:00.000Z",
  "expiresAt": "2026-03-26T20:00:00.000Z",
  "durationDays": 1,
  "message": "Key Validada, KEY: ABCDEFGHIJ12"
}
```

**Key Inválida (404)**
```json
{
  "success": false,
  "result": "invalid",
  "message": "Key inválida, insira uma key válida"
}
```

**Key Expirada (403)**
```json
{
  "success": false,
  "result": "expired",
  "message": "Key expirada"
}
```

**Key Banida (403)**
```json
{
  "success": false,
  "result": "banned",
  "message": "Key banida"
}
```

**Key Pausada (403)**
```json
{
  "success": false,
  "result": "paused",
  "message": "Key pausada temporariamente"
}
```

---

### 2. Verificar Key (Auto-Login)

**`GET /api/public/check-key/:key`**

Verifica o status de uma key já validada anteriormente. Use este endpoint ao reabrir o app para verificar se a key salva localmente ainda é válida, sem reativar ou alterar o tempo de expiração.

#### Request

```http
GET /api/public/check-key/ABCDEFGHIJ12
```

#### Respostas

**Válida (200)**
```json
{
  "success": true,
  "result": "valid",
  "key": "ABCDEFGHIJ12",
  "status": "active",
  "activatedAt": "2026-03-25T20:00:00.000Z",
  "expiresAt": "2026-03-26T20:00:00.000Z",
  "durationDays": 1,
  "remainingMs": 72000000
}
```

| Campo         | Tipo    | Descrição                                      |
|---------------|---------|------------------------------------------------|
| `remainingMs` | number  | Milissegundos restantes até a expiração        |
| `status`      | string  | `active`, `paused`, `banned`, `expired`        |

**Expirada (403)**
```json
{
  "success": false,
  "result": "expired",
  "message": "Key expirada"
}
```

---

## Códigos de Resultado

| `result`        | Significado                                     |
|-----------------|-------------------------------------------------|
| `success`       | Key válida e ativada com sucesso                |
| `valid`         | Key válida (verificação de auto-login)          |
| `invalid`       | Key não existe no sistema                       |
| `expired`       | Key expirou (tempo esgotado após ativação)      |
| `banned`        | Key foi banida pelo administrador               |
| `paused`        | Key foi pausada temporariamente                 |
| `not_activated` | Key existe mas ainda não foi ativada            |

---

## Integração Swift (iOS)

### Estrutura de Resposta

```swift
// AuthZyonModels.swift

import Foundation

struct KeyValidationResponse: Codable {
    let success: Bool
    let result: String
    let key: String?
    let status: String?
    let activatedAt: String?
    let expiresAt: String?
    let durationDays: Int?
    let remainingMs: Double?
    let message: String?
}
```

### Serviço de Autenticação

```swift
// AuthZyonService.swift

import Foundation

class AuthZyonService {
    
    static let shared = AuthZyonService()
    
    private let baseURL = "https://SEU_DOMINIO.manus.space"
    private let storageKey = "authzyon_saved_key"
    
    // MARK: - Validar Key (primeira vez)
    
    func validateKey(_ key: String) async throws -> KeyValidationResponse {
        guard let url = URL(string: "\(baseURL)/api/public/validate-key") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(["key": key.uppercased()])
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(KeyValidationResponse.self, from: data)
        
        if response.success, let savedKey = response.key {
            // Salva a key localmente após validação bem-sucedida
            UserDefaults.standard.set(savedKey, forKey: storageKey)
        }
        
        return response
    }
    
    // MARK: - Verificar Key Salva (auto-login)
    
    func checkSavedKey() async -> KeyValidationResponse? {
        guard let savedKey = UserDefaults.standard.string(forKey: storageKey) else {
            return nil // Nenhuma key salva
        }
        
        guard let url = URL(string: "\(baseURL)/api/public/check-key/\(savedKey)") else {
            return nil
        }
        
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let response = try JSONDecoder().decode(KeyValidationResponse.self, from: data)
            
            if !response.success {
                // Key expirada ou inválida — remove do armazenamento
                UserDefaults.standard.removeObject(forKey: storageKey)
            }
            
            return response
        } catch {
            return nil
        }
    }
    
    // MARK: - Limpar Key Salva
    
    func clearSavedKey() {
        UserDefaults.standard.removeObject(forKey: storageKey)
    }
    
    // MARK: - Formatar Data de Expiração
    
    func formatExpiryDate(_ isoString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        guard let date = formatter.date(from: isoString) else { return isoString }
        
        let display = DateFormatter()
        display.dateStyle = .medium
        display.timeStyle = .short
        display.locale = Locale(identifier: "pt_BR")
        
        return display.string(from: date)
    }
}
```

### View de Login (SwiftUI)

```swift
// LoginView.swift

import SwiftUI

struct LoginView: View {
    @State private var keyInput = ""
    @State private var phase: LoginPhase = .checking
    @State private var validationResult: KeyValidationResponse?
    @State private var errorMessage = ""
    
    enum LoginPhase {
        case checking, input, validating, success, error
    }
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            switch phase {
            case .checking:
                checkingView
            case .input:
                inputView
            case .validating:
                validatingView
            case .success:
                successView
            case .error:
                errorView
            }
        }
        .task {
            await checkSavedKey()
        }
    }
    
    // MARK: - Verificar key salva ao abrir
    
    private func checkSavedKey() async {
        phase = .checking
        
        if let response = await AuthZyonService.shared.checkSavedKey() {
            if response.success {
                validationResult = response
                phase = .success
            } else {
                phase = .input
            }
        } else {
            phase = .input
        }
    }
    
    // MARK: - Validar key digitada
    
    private func validateKey() async {
        guard !keyInput.isEmpty else { return }
        phase = .validating
        
        // Pequeno delay para mostrar animação
        try? await Task.sleep(nanoseconds: 1_200_000_000)
        
        do {
            let response = try await AuthZyonService.shared.validateKey(keyInput)
            if response.success {
                validationResult = response
                phase = .success
            } else {
                errorMessage = response.message ?? "Key inválida, insira uma key válida"
                phase = .error
            }
        } catch {
            errorMessage = "Erro de conexão. Verifique sua internet."
            phase = .error
        }
    }
    
    // MARK: - Views
    
    private var checkingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
                .tint(.blue)
            Text("Carregando login")
                .foregroundColor(.white)
                .font(.headline)
            Text("Verificando sua key...")
                .foregroundColor(.gray)
                .font(.subheadline)
        }
    }
    
    private var inputView: some View {
        VStack(spacing: 32) {
            Text("FFH4X")
                .font(.system(size: 42, weight: .black))
                .foregroundColor(.white)
            
            VStack(spacing: 12) {
                TextField("INSIRA SUA KEY", text: $keyInput)
                    .textFieldStyle(.roundedBorder)
                    .font(.system(.body, design: .monospaced))
                    .textCase(.uppercase)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.characters)
                    .padding(.horizontal)
                
                Button("Entrar") {
                    Task { await validateKey() }
                }
                .buttonStyle(.borderedProminent)
                .disabled(keyInput.isEmpty)
                .padding(.horizontal)
                .frame(maxWidth: .infinity)
            }
        }
        .padding()
    }
    
    private var validatingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
                .tint(.blue)
            Text("Validando key…")
                .foregroundColor(.white)
                .font(.headline)
        }
    }
    
    private var successView: some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.shield.fill")
                .font(.system(size: 60))
                .foregroundColor(.green)
            
            if let result = validationResult {
                Text("Key Validada")
                    .font(.title2.bold())
                    .foregroundColor(.green)
                
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("KEY:")
                            .foregroundColor(.gray)
                        Text(result.key ?? "")
                            .font(.system(.body, design: .monospaced).bold())
                            .foregroundColor(.white)
                    }
                    if let expiresAt = result.expiresAt {
                        HStack {
                            Text("Data de expiração:")
                                .foregroundColor(.gray)
                            Text(AuthZyonService.shared.formatExpiryDate(expiresAt))
                                .foregroundColor(.white)
                        }
                    }
                }
                .padding()
                .background(Color.white.opacity(0.05))
                .cornerRadius(12)
            }
        }
        .padding()
    }
    
    private var errorView: some View {
        VStack(spacing: 20) {
            Image(systemName: "xmark.shield.fill")
                .font(.system(size: 60))
                .foregroundColor(.red)
            
            Text("Key inválida, insira uma key válida")
                .font(.headline)
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
            
            Text("Se acha que foi um erro, entre em contato com seu vendedor")
                .font(.caption)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
            
            Button("Tentar novamente") {
                keyInput = ""
                phase = .input
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}
```

---

## Fluxo de Integração

O diagrama abaixo descreve o fluxo completo de autenticação no app iOS:

```
Abrir App
    │
    ▼
Existe key salva no UserDefaults?
    │
    ├── NÃO → Exibir tela de input → Usuário digita key
    │                                       │
    │                                       ▼
    │                              POST /validate-key
    │                                       │
    │                              ┌────────┴────────┐
    │                          Sucesso           Falha
    │                              │                 │
    │                     Salva key local     Exibe erro
    │                     Libera acesso
    │
    └── SIM → GET /check-key/:key
                    │
           ┌────────┴────────┐
       Válida              Inválida/Expirada
           │                       │
    Libera acesso          Remove key local
                           Exibe tela de input
```

---

## Configuração de Info.plist (iOS)

Para permitir chamadas HTTP em desenvolvimento, adicione ao `Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>SEU_DOMINIO.manus.space</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
    </dict>
</dict>
```

> **Nota:** O domínio AuthZyon usa HTTPS por padrão após publicação, portanto não é necessário liberar HTTP inseguro.

---

## Notas Importantes

1. **Ativação única:** A key só começa a contar o tempo após a **primeira validação** via `POST /validate-key`. Antes disso, o status é `pending`.

2. **Auto-login:** Ao reabrir o app, use `GET /check-key/:key` (não o POST). Este endpoint não altera o status da key, apenas verifica.

3. **Case-insensitive:** A API aceita keys em qualquer caixa e converte automaticamente para maiúsculas.

4. **Formato das keys:** As keys têm entre 10 e 14 caracteres, compostos apenas por letras A-Z e números 0-9, todos maiúsculos.

5. **Persistência:** Armazene a key no `UserDefaults` (iOS) após validação bem-sucedida. Remova quando a key expirar.
