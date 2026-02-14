import LocalAuthentication

enum BiometricService {
    static func authenticate() async -> Bool {
        let context = LAContext()
        var error: NSError?

        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
            // No biometrics or passcode available — allow access
            return true
        }

        do {
            return try await context.evaluatePolicy(
                .deviceOwnerAuthentication,
                localizedReason: "Unlock EdenChat"
            )
        } catch {
            return false
        }
    }
}
