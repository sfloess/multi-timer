import SwiftUI

struct TimerRowView: View {
    let timer: TimerModel
    @Environment(TimerManager.self) private var timerManager

    @State private var isEditingName = false
    @State private var editedTitle = ""
    @State private var showingDurationPicker = false
    @State private var showingNotesSheet = false
    @State private var editedNotes = ""

    // Temporary values for duration picker
    @State private var pickerHours = 0
    @State private var pickerMinutes = 0
    @State private var pickerSeconds = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            // Header: Title & Notes indicator/action
            HStack {
                if isEditingName {
                    TextField("Timer Name", text: $editedTitle, onCommit: saveTitle)
                        .textFieldStyle(.plain)
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding(.vertical, 2)
                        .padding(.horizontal, 6)
                        .background(Color.appBackground.opacity(0.6))
                        .cornerRadius(6)
                    
                    Button(action: saveTitle) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.appAccent)
                    }
                    .buttonStyle(.plain)
                } else {
                    Text(timer.title.isEmpty ? "Timer" : timer.title)
                        .font(.headline)
                        .foregroundColor(.white)
                        .onTapGesture {
                            editedTitle = timer.title
                            isEditingName = true
                        }
                    
                    Button {
                        editedTitle = timer.title
                        isEditingName = true
                    } label: {
                        Image(systemName: "pencil")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                    .buttonStyle(.plain)
                }

                Spacer()

                // Notes Button
                Button {
                    editedNotes = timer.notes
                    showingNotesSheet = true
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: timer.notes.isEmpty ? "note.text.badge.plus" : "note.text")
                        if !timer.notes.isEmpty {
                            Circle()
                                .fill(Color.appAccent)
                                .frame(width: 6, height: 6)
                        }
                    }
                    .font(.subheadline)
                    .foregroundColor(timer.notes.isEmpty ? .gray : .appAccent)
                    .padding(6)
                    .background(Color.appBackground.opacity(0.5))
                    .cornerRadius(8)
                }
                .buttonStyle(.plain)
            }

            // Timer Digital Display and Progress
            HStack(alignment: .center) {
                Button {
                    guard !timer.isRunning else { return }
                    pickerHours = timer.hours
                    pickerMinutes = timer.minutes
                    pickerSeconds = timer.seconds
                    showingDurationPicker = true
                } label: {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(timer.timeDisplay)
                            .font(.system(size: 40, weight: .bold, design: .monospaced))
                            .foregroundColor(timer.remainingTime == 0 && timer.initialDuration > 0 ? .red : .white)
                        
                        if !timer.isRunning {
                            Text("Tap to set duration")
                                .font(.caption2)
                                .foregroundColor(.gray)
                        }
                    }
                }
                .buttonStyle(.plain)
                .disabled(timer.isRunning)

                Spacer()

                // Circular Progress Indicator
                ZStack {
                    Circle()
                        .stroke(Color.appBackground, lineWidth: 6)
                    Circle()
                        .trim(from: 0, to: CGFloat(max(0.001, timer.progress)))
                        .stroke(
                            timer.remainingTime == 0 && timer.initialDuration > 0 ? Color.red : Color.appAccent,
                            style: StrokeStyle(lineWidth: 6, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                        .animation(.linear(duration: 0.2), value: timer.progress)
                }
                .frame(width: 44, height: 44)
            }

            // Optional note preview
            if !timer.notes.isEmpty {
                Text(timer.notes)
                    .font(.caption)
                    .foregroundColor(.gray)
                    .lineLimit(2)
                    .padding(.horizontal, 4)
            }

            // Controls (Start / Pause, Reset, Set Duration)
            HStack(spacing: 12) {
                // Play / Pause Button
                Button {
                    if timer.isRunning {
                        timerManager.pauseTimer(timer)
                    } else {
                        timerManager.startTimer(timer)
                    }
                } label: {
                    Label(timer.isRunning ? "Pause" : "Start", systemImage: timer.isRunning ? "pause.fill" : "play.fill")
                        .font(.subheadline.bold())
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(timer.isRunning ? Color.orange : Color.appAccent)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                .buttonStyle(.plain)
                .disabled(timer.remainingTime == 0 && timer.initialDuration == 0)

                // Reset Button
                Button {
                    timerManager.resetTimer(timer)
                } label: {
                    Label("Reset", systemImage: "arrow.counterclockwise")
                        .font(.subheadline.bold())
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Color.appBackground)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(16)
        .background(Color.appCard)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(timer.isRunning ? Color.appAccent.opacity(0.6) : Color.clear, lineWidth: 1.5)
        )
        .sheet(isPresented: $showingDurationPicker) {
            DurationPickerSheet(
                hours: $pickerHours,
                minutes: $pickerMinutes,
                seconds: $pickerSeconds,
                onSave: {
                    let totalSeconds = TimeInterval(pickerHours * 3600 + pickerMinutes * 60 + pickerSeconds)
                    timerManager.setDuration(for: timer, duration: totalSeconds)
                    showingDurationPicker = false
                }
            )
            .presentationDetents([.height(320)])
            .presentationDragIndicator(.visible)
        }
        .sheet(isPresented: $showingNotesSheet) {
            NavigationStack {
                VStack(alignment: .leading, spacing: 12) {
                    TextEditor(text: $editedNotes)
                        .padding(8)
                        .background(Color.appCard)
                        .cornerRadius(10)
                        .foregroundColor(.white)
                        .scrollContentBackground(.hidden)
                }
                .padding()
                .background(Color.appBackground.ignoresSafeArea())
                .navigationTitle("Timer Notes")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") {
                            showingNotesSheet = false
                        }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Save") {
                            timerManager.updateNotes(for: timer, notes: editedNotes)
                            showingNotesSheet = false
                        }
                        .fontWeight(.bold)
                    }
                }
            }
            .preferredColorScheme(.dark)
            .presentationDetents([.medium])
        }
    }

    private func saveTitle() {
        isEditingName = false
        timerManager.updateTitle(for: timer, title: editedTitle)
    }
}

// MARK: - Duration Picker Sheet
private struct DurationPickerSheet: View {
    @Binding var hours: Int
    @Binding var minutes: Int
    @Binding var seconds: Int
    var onSave: () -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack {
                HStack(spacing: 0) {
                    PickerView(value: $hours, range: 0...23, label: "hours")
                    PickerView(value: $minutes, range: 0...59, label: "min")
                    PickerView(value: $seconds, range: 0...59, label: "sec")
                }
                .padding(.horizontal)

                Spacer()
            }
            .background(Color.appBackground.ignoresSafeArea())
            .navigationTitle("Set Duration")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Set") {
                        onSave()
                    }
                    .fontWeight(.bold)
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}

private struct PickerView: View {
    @Binding var value: Int
    let range: ClosedRange<Int>
    let label: String

    var body: some View {
        HStack(spacing: 2) {
            Picker(label, selection: $value) {
                ForEach(range, id: \.self) { num in
                    Text("\(num)")
                        .tag(num)
                }
            }
            .pickerStyle(.wheel)

            Text(label)
                .font(.caption)
                .foregroundColor(.gray)
                .frame(width: 32, alignment: .leading)
        }
    }
}
