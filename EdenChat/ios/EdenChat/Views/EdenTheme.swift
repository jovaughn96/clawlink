import SwiftUI

enum Eden {
    // MARK: - Colors
    static let green = Color(red: 16 / 255, green: 185 / 255, blue: 129 / 255)       // #10B981
    static let teal = Color(red: 13 / 255, green: 148 / 255, blue: 136 / 255)         // #0D9488
    static let darkBackground = Color(red: 13 / 255, green: 17 / 255, blue: 23 / 255) // #0D1117
    static let surface = Color(red: 22 / 255, green: 27 / 255, blue: 34 / 255)        // #161B22
    static let surfaceLight = Color(red: 28 / 255, green: 35 / 255, blue: 51 / 255)   // #1C2333
    static let mutedText = Color(red: 125 / 255, green: 140 / 255, blue: 155 / 255)

    // MARK: - Gradients
    static let edenGradient = LinearGradient(
        colors: [green, teal],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let backgroundGradient = LinearGradient(
        colors: [darkBackground, Color.black],
        startPoint: .top,
        endPoint: .bottom
    )

    static let userBubbleGradient = LinearGradient(
        colors: [green, teal],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}
