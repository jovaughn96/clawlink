import FirebaseFirestore

@MainActor
final class FirestoreService {
    private let db = Firestore.firestore()

    // MARK: - Conversations

    func getOrCreateConversation(deviceId: String) async throws -> String {
        let snapshot = try await db.collection("conversations")
            .whereField("deviceId", isEqualTo: deviceId)
            .limit(to: 1)
            .getDocuments()

        if let doc = snapshot.documents.first {
            return doc.documentID
        }

        let ref = try await db.collection("conversations").addDocument(data: [
            "deviceId": deviceId,
            "title": "Eden",
            "unreadCount": 0,
            "updatedAt": FieldValue.serverTimestamp(),
        ])
        return ref.documentID
    }

    // MARK: - Messages

    func listenToMessages(
        conversationId: String,
        onChange: @escaping ([Message]) -> Void
    ) -> ListenerRegistration {
        db.collection("conversations")
            .document(conversationId)
            .collection("messages")
            .order(by: "createdAt", descending: false)
            .addSnapshotListener { snapshot, error in
                guard let docs = snapshot?.documents else { return }
                let messages = docs.compactMap { doc in
                    try? doc.data(as: Message.self)
                }
                onChange(messages)
            }
    }

    func sendMessage(text: String, conversationId: String) async throws {
        let data: [String: Any] = [
            "sender": "user",
            "type": "text",
            "text": text,
            "bridgeStatus": "pending",
            "status": "sent",
            "createdAt": FieldValue.serverTimestamp(),
        ]
        try await db.collection("conversations")
            .document(conversationId)
            .collection("messages")
            .addDocument(data: data)
    }

    func markAsRead(messageId: String, conversationId: String) async throws {
        try await db.collection("conversations")
            .document(conversationId)
            .collection("messages")
            .document(messageId)
            .updateData(["status": "read"])
    }

    // MARK: - Presence

    func listenToPresence(
        conversationId: String,
        onChange: @escaping (Bool, String?) -> Void
    ) -> ListenerRegistration {
        db.collection("presence")
            .document(conversationId)
            .addSnapshotListener { snapshot, error in
                guard let data = snapshot?.data() else {
                    onChange(false, nil)
                    return
                }
                let isTyping = data["edenTyping"] as? Bool ?? false
                let partial = data["partialResponse"] as? String
                onChange(isTyping, partial)
            }
    }

    // MARK: - Device Registration

    func registerDevice(deviceId: String, fcmToken: String?) async throws {
        var data: [String: Any] = [
            "lastSeenAt": FieldValue.serverTimestamp(),
        ]
        if let token = fcmToken {
            data["fcmToken"] = token
        }

        let ref = db.collection("devices").document(deviceId)
        let doc = try await ref.getDocument()

        if doc.exists {
            try await ref.updateData(data)
        } else {
            data["createdAt"] = FieldValue.serverTimestamp()
            try await ref.setData(data)
        }
    }
}
