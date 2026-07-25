import SwiftUI

struct AuthGate<SignedIn: View>: View {
    @EnvironmentObject private var session: AuthSession
    private let signedIn: () -> SignedIn

    init(@ViewBuilder signedIn: @escaping () -> SignedIn) {
        self.signedIn = signedIn
    }

    var body: some View {
        Group {
            switch session.state {
            case .checking: ProgressView()
            case .signedOut: LoginView()
            case .signedIn: signedIn()
            }
        }
        .task { if session.state == .checking { await session.restore() } }
    }
}
