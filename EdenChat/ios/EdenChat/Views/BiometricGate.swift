import SwiftUI

struct BiometricGate<Content: View>: View {
    @ViewBuilder var content: () -> Content

    @State private var isUnlocked = false
    @State private var authFailed = false
    @State private var appeared = false

    var body: some View {
        Group {
            if isUnlocked {
                content()
            } else {
                lockScreen
            }
        }
        .task {
            await authenticate()
        }
    }

    private var lockScreen: some View {
        ZStack {
            Eden.backgroundGradient
                .ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer()

                // Eden logo with glow ring
                ZStack {
                    Circle()
                        .fill(Eden.green.opacity(0.15))
                        .frame(width: 120, height: 120)
                        .blur(radius: 20)

                    Circle()
                        .strokeBorder(Eden.edenGradient, lineWidth: 2.5)
                        .frame(width: 96, height: 96)

                    Image(systemName: "leaf.fill")
                        .font(.system(size: 40))
                        .foregroundStyle(Eden.edenGradient)
                }

                // Title
                Text("Eden")
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundStyle(Eden.edenGradient)

                Text("Your private AI companion")
                    .font(.subheadline)
                    .foregroundStyle(Eden.mutedText)

                Spacer()

                // Unlock area
                if authFailed {
                    Button {
                        Task { await authenticate() }
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "faceid")
                                .font(.system(size: 18))
                            Text("Tap to Unlock")
                                .fontWeight(.semibold)
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 32)
                        .padding(.vertical, 14)
                        .background(
                            Capsule()
                                .fill(Eden.edenGradient)
                        )
                        .overlay(
                            Capsule()
                                .fill(.white.opacity(0.1))
                        )
                    }
                } else {
                    ProgressView()
                        .tint(Eden.green)
                }

                Spacer()
                    .frame(height: 60)
            }
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 20)
            .animation(.easeOut(duration: 0.6), value: appeared)
        }
        .onAppear { appeared = true }
    }

    private func authenticate() async {
        let success = await BiometricService.authenticate()
        await MainActor.run {
            if success {
                withAnimation(.easeInOut(duration: 0.3)) {
                    isUnlocked = true
                }
            } else {
                authFailed = true
            }
        }
    }
}
