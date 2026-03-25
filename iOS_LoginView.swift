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
                    if let expiresAt = result.expiresAt {
                        HStack {
                            Text("Tempo restante:")
                                .foregroundColor(.gray)
                            Text(AuthZyonService.shared.getRemainingTime(expiresAt))
                                .foregroundColor(.green)
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

#Preview {
    LoginView()
}
