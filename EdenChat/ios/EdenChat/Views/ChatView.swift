import SwiftUI

struct ChatView: View {
    @State private var viewModel = ChatViewModel()
    @State private var inputText = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if viewModel.isLoading {
                    Spacer()
                    ProgressView("Connecting...")
                    Spacer()
                } else {
                    messageList
                }

                MessageInputBar(text: $inputText, onSend: send)
            }
            .navigationTitle("Eden")
            .navigationBarTitleDisplayMode(.inline)
        }
        .task {
            await viewModel.start()
        }
        .onDisappear {
            viewModel.stop()
        }
    }

    private var messageList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(viewModel.messages) { message in
                        MessageBubble(message: message)
                            .id(message.id)
                    }

                    if viewModel.isEdenTyping {
                        TypingIndicator(partialResponse: viewModel.partialResponse)
                            .id("typing")
                    }
                }
                .padding(.vertical, 8)
            }
            .onChange(of: viewModel.messages.count) {
                scrollToBottom(proxy: proxy)
            }
            .onChange(of: viewModel.isEdenTyping) {
                scrollToBottom(proxy: proxy)
            }
        }
    }

    private func send() {
        let text = inputText
        inputText = ""
        viewModel.send(text: text)
    }

    private func scrollToBottom(proxy: ScrollViewProxy) {
        let target: String? = viewModel.isEdenTyping ? "typing" : viewModel.messages.last?.id
        guard let id = target else { return }
        withAnimation(.easeOut(duration: 0.2)) {
            proxy.scrollTo(id, anchor: .bottom)
        }
    }
}
