import SwiftUI

struct TimePickerView: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var duration: TimeInterval
    let title: String

    @State private var selectedHours: Int = 0
    @State private var selectedMinutes: Int = 0
    @State private var selectedSeconds: Int = 0

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground.ignoresSafeArea()

                VStack(spacing: 24) {
                    Text("Set Duration")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.top, 20)

                    HStack(spacing: 0) {
                        pickerColumn(title: "Hours", range: 0...23, selection: $selectedHours)
                        colonSeparator
                        pickerColumn(title: "Minutes", range: 0...59, selection: $selectedMinutes)
                        colonSeparator
                        pickerColumn(title: "Seconds", range: 0...59, selection: $selectedSeconds)
                    }
                    .padding(.horizontal, 20)

                    previewDisplay

                    Spacer()

                    actionButtons
                        .padding(.horizontal, 20)
                        .padding(.bottom, 20)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(.appAccent)
                }
            }
            .onAppear {
                loadCurrentDuration()
            }
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }

    private var colonSeparator: some View {
        Text(":")
            .font(.system(size: 36, weight: .bold))
            .foregroundColor(.appAccent)
            .frame(width: 10)
    }

    private func pickerColumn(title: String, range: ClosedRange<Int>, selection: Binding<Int>) -> some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.caption)
                .foregroundColor(.gray)
                .textCase(.uppercase)

            Picker(title, selection: selection) {
                ForEach(range, id: \.self) { value in
                    Text(String(format: "%02d", value))
                        .font(.system(size: 32, weight: .semibold, design: .rounded))
                        .foregroundColor(.white)
                        .tag(value)
                }
            }
            .pickerStyle(.wheel)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.appCard)
            )
        }
        .frame(maxWidth: .infinity)
    }

    private var previewDisplay: some View {
        VStack(spacing: 8) {
            Text("Total Duration")
                .font(.caption)
                .foregroundColor(.gray)
                .textCase(.uppercase)

            Text(previewString)
                .font(.system(size: 28, weight: .bold, design: .monospaced))
                .foregroundColor(.appAccent)
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color.appCard)
                )
        }
    }

    private var actionButtons: some View {
        HStack(spacing: 12) {
            Button {
                selectedHours = 0
                selectedMinutes = 0
                selectedSeconds = 0
            } label: {
                Text("Reset")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.appCard)
                    )
            }

            Button {
                applyDuration()
                dismiss()
            } label: {
                Text("Set Timer")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.appAccent)
                    )
            }
        }
    }

    private var previewString: String {
        let h = selectedHours
        let m = selectedMinutes
        let s = selectedSeconds
        if h > 0 {
            return String(format: "%02d:%02d:%02d", h, m, s)
        } else {
            return String(format: "%02d:%02d", m, s)
        }
    }

    private func loadCurrentDuration() {
        let total = Int(duration)
        selectedHours = total / 3600
        selectedMinutes = (total % 3600) / 60
        selectedSeconds = total % 60
    }

    private func applyDuration() {
        duration = TimeInterval(selectedHours * 3600 + selectedMinutes * 60 + selectedSeconds)
    }
}

#Preview {
    TimePickerView(duration: .constant(125), title: "Test Timer")
}
