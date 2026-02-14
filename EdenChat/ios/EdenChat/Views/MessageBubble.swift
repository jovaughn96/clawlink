import SwiftUI

// MARK: - Bubble Tail Shape

struct BubbleTail: Shape {
    let isUser: Bool

    func path(in rect: CGRect) -> Path {
        var path = Path()
        if isUser {
            path.move(to: CGPoint(x: rect.maxX - 6, y: rect.maxY))
            path.addQuadCurve(
                to: CGPoint(x: rect.maxX, y: rect.maxY - 12),
                control: CGPoint(x: rect.maxX + 4, y: rect.maxY)
            )
            path.addLine(to: CGPoint(x: rect.maxX - 6, y: rect.maxY - 4))
        } else {
            path.move(to: CGPoint(x: rect.minX + 6, y: rect.maxY))
            path.addQuadCurve(
                to: CGPoint(x: rect.minX, y: rect.maxY - 12),
                control: CGPoint(x: rect.minX - 4, y: rect.maxY)
            )
            path.addLine(to: CGPoint(x: rect.minX + 6, y: rect.maxY - 4))
        }
        path.closeSubpath()
        return path
    }
}

// MARK: - Status Icon

private struct StatusIcon: View {
    let status: String?

    var body: some View {
        Group {
            switch status {
            case "sent":
                Image(systemName: "checkmark")
                    .foregroundStyle(Eden.mutedText)
            case "delivered":
                Image(systemName: "checkmark")
                    .foregroundStyle(Eden.mutedText)
                    .overlay(
                        Image(systemName: "checkmark")
                            .foregroundStyle(Eden.mutedText)
                            .offset(x: 4)
                    )
            case "read":
                Image(systemName: "checkmark")
                    .foregroundStyle(Eden.green)
                    .overlay(
                        Image(systemName: "checkmark")
                            .foregroundStyle(Eden.green)
                            .offset(x: 4)
                    )
            default:
                Image(systemName: "clock")
                    .foregroundStyle(Eden.mutedText)
            }
        }
        .font(.system(size: 10))
    }
}

// MARK: - Message Bubble

struct MessageBubble: View {
    let message: Message

    @State private var appeared = false

    private var isUser: Bool { message.isUser }

    var body: some View {
        HStack(alignment: .bottom, spacing: 4) {
            if isUser { Spacer(minLength: 48) }

            VStack(alignment: isUser ? .trailing : .leading, spacing: 4) {
                ZStack(alignment: isUser ? .bottomTrailing : .bottomLeading) {
                    Text(message.text)
                        .font(.system(size: 16))
                        .foregroundStyle(isUser ? .white : Color(.white).opacity(0.9))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(
                            isUser
                                ? AnyShapeStyle(Eden.userBubbleGradient)
                                : AnyShapeStyle(Eden.surfaceLight)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 20))

                    BubbleTail(isUser: isUser)
                        .fill(isUser ? AnyShapeStyle(Eden.teal) : AnyShapeStyle(Eden.surfaceLight))
                        .frame(width: 12, height: 16)
                        .offset(x: isUser ? 2 : -2, y: 0)
                }

                // Timestamp + status
                HStack(spacing: 4) {
                    Text(message.displayDate, style: .time)
                        .font(.caption2)
                        .foregroundStyle(Eden.mutedText)

                    if isUser {
                        StatusIcon(status: message.status)
                    }
                }
                .padding(.horizontal, 6)
            }

            if !isUser { Spacer(minLength: 48) }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 3)
        .scaleEffect(appeared ? 1 : 0.85)
        .opacity(appeared ? 1 : 0)
        .onAppear {
            withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
                appeared = true
            }
        }
    }
}
