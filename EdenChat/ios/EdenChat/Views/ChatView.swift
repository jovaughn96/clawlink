import SwiftUI

struct ChatView: View {
    @State private var viewModel = ChatViewModel()
    @State private var inputText = ""

    var body: some View {
        VStack(spacing: 0) {
            edenHeader

            if viewModel.isLoading {
                Spacer()
                ProgressView("Connecting...")
                    .tint(Eden.green)
                    .foregroundStyle(Eden.mutedText)
                Spacer()
            } else if viewModel.messages.isEmpty && !viewModel.isEdenTyping {
                welcomeState
            } else {
                messageList
            }

            MessageInputBar(text: $inputText, onSend: send)
        }
        .background(Eden.darkBackground)
        .task {
            await viewModel.start()
        }
        .onDisappear {
            viewModel.stop()
        }
    }

    // MARK: - Header

    private var edenHeader: some View {
        HStack(spacing: 12) {
            // Avatar
            ZStack {
                Circle()
                    .fill(Eden.green.opacity(0.15))
                    .frame(width: 44, height: 44)
                    .blur(radius: 8)

                Circle()
                    .strokeBorder(Eden.edenGradient, lineWidth: 2)
                    .frame(width: 38, height: 38)

                Image(systemName: "leaf.fill")
                    .font(.system(size: 16))
                    .foregroundStyle(Eden.edenGradient)
            }

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text("Eden")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.white)

                    Circle()
                        .fill(Eden.green)
                        .frame(width: 7, height: 7)
                        .shadow(color: Eden.green.opacity(0.6), radius: 3)
                }

                Text("AI Agent")
                    .font(.caption)
                    .foregroundStyle(Eden.mutedText)
            }

            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(
            Eden.surface
                .overlay(
                    Rectangle()
                        .fill(Color.white.opacity(0.04))
                )
        )
    }

    // MARK: - Welcome State

    private var welcomeState: some View {
        ScrollView {
            VStack(spacing: 28) {
                Spacer()
                    .frame(height: 40)

                // Eden icon with glow
                ZStack {
                    Circle()
                        .fill(Eden.green.opacity(0.12))
                        .frame(width: 100, height: 100)
                        .blur(radius: 20)

                    Circle()
                        .strokeBorder(Eden.edenGradient, lineWidth: 2)
                        .frame(width: 72, height: 72)

                    Image(systemName: "leaf.fill")
                        .font(.system(size: 30))
                        .foregroundStyle(Eden.edenGradient)
                }

                VStack(spacing: 8) {
                    Text("How can I help?")
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundStyle(.white)

                    Text("Start a conversation or try a suggestion below")
                        .font(.subheadline)
                        .foregroundStyle(Eden.mutedText)
                        .multilineTextAlignment(.center)
                }

                // Suggestion chips
                VStack(spacing: 10) {
                    ForEach(viewModel.suggestedPrompts, id: \.self) { prompt in
                        Button {
                            inputText = prompt
                            send()
                        } label: {
                            Text(prompt)
                                .font(.system(size: 15))
                                .foregroundStyle(.white.opacity(0.85))
                                .padding(.horizontal, 18)
                                .padding(.vertical, 12)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Eden.surface)
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16)
                                        .strokeBorder(Color.white.opacity(0.06), lineWidth: 1)
                                )
                        }
                    }
                }
                .padding(.horizontal, 20)

                Spacer()
            }
        }
    }

    // MARK: - Message List

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

    // MARK: - Actions

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
