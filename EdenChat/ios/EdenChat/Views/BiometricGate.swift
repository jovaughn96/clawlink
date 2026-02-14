import SwiftUI

struct BiometricGate<Content: View>: View {
    @ViewBuilder var content: () -> Content

    @State private var isUnlocked = false
    @State private var authFailed = false

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
        VStack(spacing: 20) {
            Spacer()

            Image(systemName: "lock.fill")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)

            Text("EdenChat")
                .font(.title)
                .fontWeight(.semibold)

            if authFailed {
                Button("Tap to Unlock") {
                    Task { await authenticate() }
                }
                .buttonStyle(.borderedProminent)
            } else {
                ProgressView()
            }

            Spacer()
        }
    }

    private func authenticate() async {
        let success = await BiometricService.authenticate()
        await MainActor.run {
            if success {
                isUnlocked = true
            } else {
                authFailed = true
            }
        }
    }
}
