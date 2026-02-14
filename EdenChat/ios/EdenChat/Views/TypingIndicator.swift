import SwiftUI

struct TypingIndicator: View {
    let partialResponse: String?

    @State private var phase = 0.0

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 6) {
                if let partial = partialResponse, !partial.isEmpty {
                    Text(partial)
                        .font(.system(size: 16))
                        .foregroundStyle(Color.white.opacity(0.9))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(Eden.surfaceLight)
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                }

                HStack(spacing: 6) {
                    ForEach(0..<3, id: \.self) { i in
                        Circle()
                            .fill(Eden.green)
                            .frame(width: 8, height: 8)
                            .shadow(color: Eden.green.opacity(0.6), radius: 4)
                            .offset(y: sin(phase + Double(i) * 0.8) * 4)
                    }
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 12)
                .background(Eden.surfaceLight)
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .onAppear {
                    withAnimation(.linear(duration: 1.0).repeatForever(autoreverses: false)) {
                        phase = .pi * 2
                    }
                }

                Text("Eden is thinking...")
                    .font(.caption2)
                    .foregroundStyle(Eden.mutedText)
                    .padding(.leading, 8)
            }

            Spacer(minLength: 48)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 3)
    }
}
