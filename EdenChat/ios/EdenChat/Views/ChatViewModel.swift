import FirebaseFirestore
import Observation

@Observable
@MainActor
final class ChatViewModel {
    var messages: [Message] = []
    var isEdenTyping = false
    var partialResponse: String?
    var conversationId: String?
    var isLoading = true
    var errorMessage: String?

    var suggestedPrompts: [String] {
        [
            "What can you help me with?",
            "Tell me something interesting",
            "Help me brainstorm ideas",
            "Write me a short poem"
        ]
    }

    private let firestoreService = FirestoreService()
    private let deviceId = KeychainService.getOrCreateDeviceId()
    private var messageListener: ListenerRegistration?
    private var presenceListener: ListenerRegistration?

    func start() async {
        do {
            let convId = try await firestoreService.getOrCreateConversation(deviceId: deviceId)
            conversationId = convId

            messageListener = firestoreService.listenToMessages(conversationId: convId) { [weak self] messages in
                self?.messages = messages
                self?.markUnreadMessages(messages, conversationId: convId)
            }

            presenceListener = firestoreService.listenToPresence(conversationId: convId) { [weak self] typing, partial in
                self?.isEdenTyping = typing
                self?.partialResponse = partial
            }

            isLoading = false
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }

    func send(text: String) {
        guard let convId = conversationId, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }

        Task {
            do {
                try await firestoreService.sendMessage(text: text, conversationId: convId)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    func stop() {
        messageListener?.remove()
        presenceListener?.remove()
    }

    private func markUnreadMessages(_ messages: [Message], conversationId: String) {
        for message in messages where message.isEden && message.status != "read" {
            guard let id = message.id else { continue }
            Task {
                try? await firestoreService.markAsRead(messageId: id, conversationId: conversationId)
            }
        }
    }
}
