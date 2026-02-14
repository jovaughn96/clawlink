import SwiftUI

struct TypingIndicator: View {
    let partialResponse: String?

    @State private var phase = 0.0

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 6) {
                if let partial = partialResponse, !partial.isEmpty {
                    Text(partial)
                        .foregroundStyle(.primary)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(Color(.systemGray5))
                        .clipShape(RoundedRectangle(cornerRadius: 18))
                }

                HStack(spacing: 5) {
                    ForEach(0..<3, id: \.self) { i in
                        Circle()
                            .fill(Color.secondary)
                            .frame(width: 8, height: 8)
                            .offset(y: sin(phase + Double(i) * 0.8) * 4)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Color(.systemGray5))
                .clipShape(RoundedRectangle(cornerRadius: 18))
                .onAppear {
                    withAnimation(.linear(duration: 1.0).repeatForever(autoreverses: false)) {
                        phase = .pi * 2
                    }
                }
            }

            Spacer(minLength: 60)
        }
        .padding(.horizontal)
        .padding(.vertical, 2)
    }
}
