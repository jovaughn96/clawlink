import Foundation
import FirebaseFirestore

struct Message: Codable, Identifiable {
    @DocumentID var id: String?
    let sender: String
    let type: String
    let text: String
    var bridgeStatus: String?
    var status: String?
    @ServerTimestamp var createdAt: Timestamp?

    var isUser: Bool { sender == "user" }
    var isEden: Bool { sender == "eden" }

    var displayDate: Date {
        createdAt?.dateValue() ?? Date()
    }
}
