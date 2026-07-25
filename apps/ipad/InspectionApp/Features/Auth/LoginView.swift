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
            VStack(alignment: .leading, spacing: SaqeelSpacing.lg) {
                brand

                VStack(alignment: .leading, spacing: SaqeelSpacing.md) {
                    SaqeelField("Email") {
                        TextField("name@mim.gov.sa", text: $email)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .keyboardType(.emailAddress)
                            .textContentType(.username)
                            .font(SaqeelTypography.field)
                            .padding(.horizontal, SaqeelSpacing.sm)
                            .frame(height: SaqeelDensity.field)
                            .background(theme.colors.surface)
                            .overlay(RoundedRectangle(cornerRadius: SaqeelRadius.input)
                                .stroke(theme.colors.borderControl, lineWidth: 1))
                    }

                    SaqeelField("Password", error: session.errorMessage) {
                        HStack(spacing: 0) {
                            Group {
                                if showPassword {
                                    TextField("Enter your password", text: $password)
                                } else {
                                    SecureField("Enter your password", text: $password)
                                }
                            }
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .textContentType(.password)
                            .font(SaqeelTypography.field)
                            .padding(.leading, SaqeelSpacing.sm)

                            Button { showPassword.toggle() } label: {
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
                    .padding(.top, SaqeelSpacing.xs)
                }
                .padding(SaqeelSpacing.lg)
                .background(theme.colors.surface)
                .clipShape(RoundedRectangle(cornerRadius: SaqeelRadius.large))
                .overlay(RoundedRectangle(cornerRadius: SaqeelRadius.large)
                    .stroke(theme.colors.border, lineWidth: 1))
            }
            .frame(maxWidth: 460)
            .frame(maxWidth: .infinity)
            .padding(SaqeelSpacing.xl)
            .padding(.top, 72)
        }
        .background(theme.colors.canvas)
        .scrollDismissesKeyboard(.interactively)
        .scrollBounceBehavior(.basedOnSize)
    }

    private var brand: some View {
        HStack(spacing: SaqeelSpacing.sm) {
            ZStack {
                RoundedRectangle(cornerRadius: SaqeelRadius.standard)
                    .fill(theme.colors.primary)
                    .frame(width: 44, height: 44)
                Image(systemName: "checkmark.shield.fill")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundColor(theme.colors.inverseText)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text("MIM Inspection")
                    .font(SaqeelTypography.title)
                    .foregroundColor(theme.colors.text)
                Text("Field inspection")
                    .font(SaqeelTypography.caption)
                    .foregroundColor(theme.colors.textSecondary)
            }
        }
    }
}
