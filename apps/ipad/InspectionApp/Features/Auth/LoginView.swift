import SwiftUI
import DesignSystem
import Components

struct LoginView: View {
    @EnvironmentObject private var session: AuthSession
    @EnvironmentObject private var theme: SaqeelTheme

    @State private var email = ""
    @State private var password = ""
    @State private var isSubmitting = false
    @State private var showPassword = false

    var body: some View {
        ScrollView {
            VStack(spacing: SaqeelSpacing.lg) {
                Text("MIM Inspection")
                    .font(SaqeelTypography.display)
                    .foregroundColor(theme.colors.text)

                SaqeelField("Email") {
                    TextField("", text: $email)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.emailAddress)
                        .textContentType(.username)
                        .padding(SaqeelSpacing.sm)
                        .frame(height: SaqeelDensity.field)
                        .background(theme.colors.surface)
                        .overlay(RoundedRectangle(cornerRadius: SaqeelRadius.input)
                            .stroke(theme.colors.borderControl, lineWidth: 1))
                }

                SaqeelField("Password", error: session.errorMessage) {
                    HStack(spacing: 0) {
                        Group {
                            if showPassword {
                                TextField("", text: $password)
                            } else {
                                SecureField("", text: $password)
                            }
                        }
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .textContentType(.password)
                        .padding(.leading, SaqeelSpacing.sm)

                        Button {
                            showPassword.toggle()
                        } label: {
                            Image(systemName: showPassword ? "eye.slash" : "eye")
                                .foregroundColor(theme.colors.textSecondary)
                                .frame(width: SaqeelDensity.field, height: SaqeelDensity.field)
                        }
                        .accessibilityLabel(showPassword ? "Hide password" : "Show password")
                    }
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
            .frame(maxWidth: .infinity)
            .padding(.top, 96)
        }
        .background(theme.colors.canvas)
        .scrollDismissesKeyboard(.interactively)
        .scrollBounceBehavior(.basedOnSize)
    }
}
