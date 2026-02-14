import SwiftUI

struct MessageInputBar: View {
    @Binding var text: String
    var onSend: () -> Void

    @FocusState private var isFocused: Bool

    private var canSend: Bool {
        !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        HStack(spacing: 12) {
            TextField("Message Eden...", text: $text, axis: .vertical)
                .lineLimit(1...5)
                .textFieldStyle(.plain)
                .foregroundStyle(.white)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Eden.surface)
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .strokeBorder(
                            isFocused ? Eden.green.opacity(0.6) : Color.white.opacity(0.08),
                            lineWidth: 1
                        )
                )
                .focused($isFocused)

            Button(action: onSend) {
                Image(systemName: "arrow.up")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 36, height: 36)
                    .background(
                        Circle()
                            .fill(canSend ? AnyShapeStyle(Eden.edenGradient) : AnyShapeStyle(Color.gray.opacity(0.3)))
                    )
            }
            .disabled(!canSend)
            .scaleEffect(canSend ? 1.0 : 0.9)
            .animation(.spring(response: 0.25), value: canSend)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            Eden.darkBackground
                .overlay(.ultraThinMaterial.opacity(0.3))
        )
    }
}
