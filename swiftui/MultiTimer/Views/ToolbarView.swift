import SwiftUI

struct ToolbarView: View {
    @Environment(TimerManager.self) private var timerManager
    @Binding var isEditing: Bool
    @State private var showClearConfirmation = false

    var body: some View {
        HStack(spacing: 12) {
            // Reorder / Edit toggle
            Button(action: {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    isEditing.toggle()
                }
            }) {
                HStack(spacing: 6) {
                    Image(systemName: isEditing ? "checkmark.circle.fill" : "arrow.up.arrow.down")
                    Text(isEditing ? "Done" : "Reorder")
                }
                .font(.subheadline.weight(.medium))
                .foregroundColor(.appAccent)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color.appCard)
                .cornerRadius(10)
            }

            Spacer()

            // Move Selected Timers Up / Down helper actions when editing
            if isEditing && !timerManager.timers.isEmpty {
                HStack(spacing: 8) {
                    Button(action: {
                        timerManager.moveSelectedUp()
                    }) {
                        Image(systemName: "chevron.up")
                            .font(.subheadline.weight(.bold))
                            .foregroundColor(.appAccent)
                            .frame(width: 36, height: 36)
                            .background(Color.appCard)
                            .cornerRadius(10)
                    }

                    Button(action: {
                        timerManager.moveSelectedDown()
                    }) {
                        Image(systemName: "chevron.down")
                            .font(.subheadline.weight(.bold))
                            .foregroundColor(.appAccent)
                            .frame(width: 36, height: 36)
                            .background(Color.appCard)
                            .cornerRadius(10)
                    }
                }
            }

            // Clear All Timers
            if !timerManager.timers.isEmpty {
                Button(role: .destructive, action: {
                    showClearConfirmation = true
                }) {
                    Image(systemName: "trash")
                        .font(.subheadline.weight(.medium))
                        .foregroundColor(.red.opacity(0.85))
                        .frame(width: 36, height: 36)
                        .background(Color.appCard)
                        .cornerRadius(10)
                }
                .confirmationDialog(
                    "Clear All Timers?",
                    isPresented: $showClearConfirmation,
                    titleVisibility: .visible
                ) {
                    Button("Clear All", role: .destructive) {
                        withAnimation {
                            timerManager.clearAll()
                        }
                    }
                    Button("Cancel", role: .cancel) {}
                } message: {
                    Text("This will delete all existing timers and stop any running notifications.")
                }
            }

            // Add Timer Button
            Button(action: {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    timerManager.addTimer()
                }
            }) {
                HStack(spacing: 6) {
                    Image(systemName: "plus")
                        .font(.subheadline.weight(.bold))
                    Text("Add Timer")
                        .font(.subheadline.weight(.semibold))
                }
                .foregroundColor(.white)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(Color.appAccent)
                .cornerRadius(10)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Color.appBackground.opacity(0.95))
    }
}
