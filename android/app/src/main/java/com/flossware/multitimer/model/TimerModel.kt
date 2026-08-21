package com.flossware.multitimer.model

import java.util.UUID

data class TimerModel(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val totalSeconds: Long,
    val remainingSeconds: Long = totalSeconds,
    val status: TimerStatus = TimerStatus.IDLE,
    val notes: String = ""
)

enum class TimerStatus {
    IDLE, RUNNING, PAUSED, FINISHED
}
