import SwiftUI

@MainActor
public final class SaqeelTheme: ObservableObject {
    @Published public var colors: SaqeelColorScheme

    public init(dark: Bool = false) {
        self.colors = dark ? .dark : .light
    }

    public func apply(dark: Bool) {
        colors = dark ? .dark : .light
    }
}
