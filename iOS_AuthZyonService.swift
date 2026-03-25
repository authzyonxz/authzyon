import Foundation

class AuthZyonService {
    
    static let shared = AuthZyonService()
    
    private let baseURL = "https://authpanel-ujuvsni4.manus.space"
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
            UserDefaults.standard.set(savedKey, forKey: storageKey)
        }
        
        return response
    }
    
    // MARK: - Verificar Key Salva (auto-login)
    
    func checkSavedKey() async -> KeyValidationResponse? {
        guard let savedKey = UserDefaults.standard.string(forKey: storageKey) else {
            return nil
        }
        
        guard let url = URL(string: "\(baseURL)/api/public/check-key/\(savedKey)") else {
            return nil
        }
        
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let response = try JSONDecoder().decode(KeyValidationResponse.self, from: data)
            
            if !response.success {
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
    
    // MARK: - Tempo Restante Formatado
    
    func getRemainingTime(_ expiresAt: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        guard let expireDate = formatter.date(from: expiresAt) else {
            return "Tempo desconhecido"
        }
        
        let diff = expireDate.timeIntervalSince(Date())
        
        if diff <= 0 {
            return "Expirada"
        }
        
        let days = Int(diff / (24 * 60 * 60))
        let hours = Int((diff.truncatingRemainder(dividingBy: 24 * 60 * 60)) / (60 * 60))
        
        if days > 0 {
            return "\(days) dia\(days > 1 ? "s" : "") restante\(days > 1 ? "s" : "")"
        }
        
        return "\(hours) hora\(hours > 1 ? "s" : "") restante\(hours > 1 ? "s" : "")"
    }
}
