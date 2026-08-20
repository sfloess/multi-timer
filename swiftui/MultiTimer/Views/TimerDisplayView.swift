import SwiftUI

struct TimerDisplayView: View {
    let timer: TimerModel

    var body: some View {
        VStack(spacing: 8) {
            Text(timer.timeDisplay)
                .font(.system(size: 56, weight: .thin, design: .monospaced))
                .foregroundColor(.white)
                .shadow(color: .appAccent.opacity(0.4), radius: 10, x: 0, y: 0)
                .minimumScaleFactor(0.5)
                .lineLimit(1)

            ProgressView(value: timer.progress)
                .progressViewStyle(LinearProgressViewStyle(tint: .appAccent))
                .frame(height: 6)
                .opacity(timer.initialDuration > 0 ? 1 : 0)
        }
        .padding(.vertical, 12)
    }
}
