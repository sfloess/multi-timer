package com.flossware.multitimer.model

import java.util.UUID

data class TimerModel(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val totalSeconds: Long,
    var remainingSeconds: Long = totalSeconds,
    var status: TimerStatus = TimerStatus.IDLE,
    var notes: String = ""
)

enum class TimerStatus {
    IDLE, RUNNING, PAUSED, FINISHED
}
