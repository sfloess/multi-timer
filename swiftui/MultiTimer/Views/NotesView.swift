import SwiftUI

struct NotesView: View {
    let timerID: UUID
    @Environment(TimerManager.self) private var timerManager
    @Environment(\.dismiss) private var dismiss
    
    @State private var notesText: String = ""

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground.ignoresSafeArea()
                
                VStack(spacing: 16) {
                    TextEditor(text: $notesText)
                        .scrollContentBackground(.hidden)
                        .padding()
                        .background(Color.appCard)
                        .cornerRadius(12)
                        .foregroundColor(.white)
                        .font(.body)
                        .padding(.horizontal)
                        .padding(.top)

                    Spacer()
                }
            }
            .navigationTitle("Timer Notes")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(.appAccent)
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        timerManager.updateNotes(for: timerID, notes: notesText)
                        dismiss()
                    }
                    .foregroundColor(.appAccent)
                }
            }
            .onAppear {
                if let timer = timerManager.timers.first(where: { $0.id == timerID }) {
                    notesText = timer.notes
                }
            }
        }
    }
}
