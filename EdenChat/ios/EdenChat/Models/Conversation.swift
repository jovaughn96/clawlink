import Foundation
import FirebaseFirestore

struct Conversation: Codable, Identifiable {
    @DocumentID var id: String?
    let deviceId: String
    let title: String
    var unreadCount: Int?
    @ServerTimestamp var updatedAt: Timestamp?
}
