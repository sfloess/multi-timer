import SwiftUI

// MARK: - Theme Constants
extension Color {
    static let appBackground = Color(red: 15/255, green: 23/255, blue: 42/255) // #0F172A
    static let appCard = Color(red: 30/255, green: 41/255, blue: 59/255)     // #1E293B
    static let appAccent = Color(red: 59/255, green: 130/255, blue: 246/255) // #3B82F6
    static let appOrange = Color(red: 249/255, green: 115/255, blue: 22/255) // #F97316
}

struct ContentView: View {
    @Environment(TimerManager.self) private var timerManager
    @State private var showingAddTimer = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground
                    .ignoresSafeArea()

                if timerManager.timers.isEmpty {
                    ContentUnavailableView(
                        "No Timers",
                        systemImage: "timer",
                        description: Text("Tap the plus button to create a new timer.")
                    )
                    .foregroundStyle(.white)
                } else {
                    List {
                        ForEach(timerManager.timers) { timer in
                            TimerRowView(timer: timer)
                                .listRowBackground(Color.clear)
                                .listRowSeparator(.hidden)
                        }
                        .onDelete(perform: timerManager.deleteTimers)
                        .onMove(perform: timerManager.moveTimers)
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Multi-Timer")
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbarBackground(Color.appBackground, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    EditButton()
                        .foregroundStyle(Color.appAccent)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: { showingAddTimer = true }) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .foregroundStyle(Color.appAccent)
                    }
                }
            }
            .sheet(isPresented: $showingAddTimer) {
                AddTimerView()
            }
        }
    }
}

struct TimerRowView: View {
    @Environment(TimerManager.self) private var timerManager
    let timer: TimerModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(timer.title)
                        .font(.headline)
                        .foregroundStyle(.white)
                    if !timer.notes.isEmpty {
                        Text(timer.notes)
                            .font(.subheadline)
                            .foregroundStyle(.gray)
                    }
                }
                Spacer()
                Text(timer.timeDisplay)
                    .font(.system(.title, design: .monospaced))
                    .bold()
                    .foregroundStyle(timer.remainingTime == 0 ? Color.red : .white)
            }

            ProgressView(value: timer.progress)
                .tint(timer.remainingTime == 0 ? .red : Color.appAccent)

            HStack {
                Button(action: {
                    if timer.isRunning {
                        timerManager.pauseTimer(id: timer.id)
                    } else {
                        timerManager.startTimer(id: timer.id)
                    }
                }) {
                    Label(timer.isRunning ? "Pause" : "Start", systemImage: timer.isRunning ? "pause.fill" : "play.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(timer.isRunning ? Color.appOrange : Color.appAccent)

                Button(action: {
                    timerManager.resetTimer(id: timer.id)
                }) {
                    Label("Reset", systemImage: "arrow.counterclockwise")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .tint(.gray)
            }
        }
        .padding()
        .background(Color.appCard)
        .cornerRadius(12)
        .padding(.vertical, 4)
    }
}
