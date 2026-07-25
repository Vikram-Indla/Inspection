import UIKit

public enum SaqeelAdaptive {
    public static let isIPad: Bool = MainActor.assumeIsolated {
        UIDevice.current.userInterfaceIdiom == .pad
    }
}
