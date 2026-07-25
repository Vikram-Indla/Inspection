import SwiftUI
import DesignSystem
import Components

struct LoginView: View {
    @EnvironmentObject private var session: AuthSession
    @EnvironmentObject private var theme: SaqeelTheme

    @State private var email = ""
    @State private var password = ""
    @State private var isSubmitting = false

    var body: some View {
        VStack(spacing: SaqeelSpacing.lg) {
            Text("MIM Inspection")
                .font(SaqeelTypography.display)
                .foregroundColor(theme.colors.text)

            SaqeelField("Email") {
                TextField("", text: $email)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                    .padding(SaqeelSpacing.sm)
                    .frame(height: SaqeelDensity.field)
                    .background(theme.colors.surface)
                    .overlay(RoundedRectangle(cornerRadius: SaqeelRadius.input)
                        .stroke(theme.colors.borderControl, lineWidth: 1))
            }

            SaqeelField("Password", error: session.errorMessage) {
                SecureField("", text: $password)
                    .padding(SaqeelSpacing.sm)
                    .frame(height: SaqeelDensity.field)
                    .background(theme.colors.surface)
                    .overlay(RoundedRectangle(cornerRadius: SaqeelRadius.input)
                        .stroke(theme.colors.borderControl, lineWidth: 1))
            }

            SaqeelButton("Sign in", isLoading: isSubmitting,
                         isEnabled: !email.isEmpty && !password.isEmpty) {
                Task {
                    isSubmitting = true
                    await session.signIn(email: email, password: password)
                    isSubmitting = false
                }
            }
        }
        .padding(SaqeelSpacing.xl)
        .frame(maxWidth: 480)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(theme.colors.canvas)
    }
}
