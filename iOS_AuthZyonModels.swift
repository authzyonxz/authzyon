import Foundation

// MARK: - Response Models

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
