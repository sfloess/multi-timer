package com.flossware.multitimer.viewmodel

import android.content.SharedPreferences
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flossware.multitimer.model.TimerModel
import com.flossware.multitimer.model.TimerStatus
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString

@Serializable
data class TimersState(
    val timers: List<TimerModel> = emptyList(),
    val selectedIndex: Int? = null
)

class TimerViewModel(private val sharedPreferences: SharedPreferences, private val json: Json) : ViewModel() {
    private val _timers = MutableStateFlow(TimersState())
    val timers: StateFlow<TimersState> = _timers

    private val _selectedIndex = MutableStateFlow<Int?>(null)
    val selectedIndex: StateFlow<Int?> = _selectedIndex

    private val job = viewModelScope.coroutineContext[Job]

    init {
        loadTimers()
        viewModelScope.launch {
            tick()
        }
    }

    private fun loadTimers() {
        val jsonString = sharedPreferences.getString("timers", null) ?: return
        try {
            val decoded = json.decodeFromString<TimersState>(jsonString)
            _timers.update { it.copy(timers = decoded.timers, selectedIndex = decoded.selectedIndex) }
            _selectedIndex.value = decoded.selectedIndex
        } catch (e: Exception) {
            // Handle corrupted data gracefully
            _timers.update { TimersState() }
        }
    }

    private fun saveTimers() {
        val currentState = _timers.value
        val jsonString = json.encodeToString(TimersState(
            timers = currentState.timers,
            selectedIndex = currentState.selectedIndex
        ))
        sharedPreferences.edit().putString("timers", jsonString).apply()
    }

    fun addTimer(name: String, seconds: Long) {
        val newTimer = TimerModel(name = name, totalSeconds = seconds)
        _timers.update { 
            val newIndex = it.timers.size
            it.copy(timers = it.timers + newTimer, selectedIndex = newIndex)
        }
        _selectedIndex.value = _timers.value.timers.size - 1
        saveTimers()
    }

    fun deleteSelectedTimer() {
        val selectedIndex = _selectedIndex.value ?: return
        if (selectedIndex in _timers.value.timers.indices) {
            _timers.update { state ->
                val newTimers = state.timers.toMutableList()
                newTimers.removeAt(selectedIndex)
                val newSelectedIndex = if (newTimers.isEmpty()) null else selectedIndex.coerceAtMost(newTimers.size - 1)
                state.copy(timers = newTimers, selectedIndex = newSelectedIndex)
            }
            _selectedIndex.value = _timers.value.selectedIndex
            saveTimers()
        }
    }

    fun moveSelectedTimerUp() {
        val selectedIndex = _selectedIndex.value ?: return
        if (selectedIndex > 0 && selectedIndex < _timers.value.timers.size) {
            _timers.update { state ->
                val timers = state.timers.toMutableList()
                val timer = timers.removeAt(selectedIndex)
                timers.add(selectedIndex - 1, timer)
                state.copy(timers = timers, selectedIndex = selectedIndex - 1)
            }
            _selectedIndex.value = _timers.value.selectedIndex
            saveTimers()
        }
    }

    fun moveSelectedTimerDown() {
        val selectedIndex = _selectedIndex.value ?: return
        if (selectedIndex >= 0 && selectedIndex < _timers.value.timers.size - 1) {
            _timers.update { state ->
                val timers = state.timers.toMutableList()
                val timer = timers.removeAt(selectedIndex)
                timers.add(selectedIndex + 1, timer)
                state.copy(timers = timers, selectedIndex = selectedIndex + 1)
            }
            _selectedIndex.value = _timers.value.selectedIndex
            saveTimers()
        }
    }

    fun clearAllTimers() {
        _timers.update { TimersState() }
        _selectedIndex.value = null
        saveTimers()
    }

    fun selectTimer(id: String) {
        val index = _timers.value.timers.indexOfFirst { it.id == id }
        if (index >= 0) {
            _selectedIndex.value = index
            _timers.update { it.copy(selectedIndex = index) }
        }
    }

    fun toggleTimer(id: String) {
        _timers.update { state ->
            state.copy(timers = state.timers.map { timer ->
                if (timer.id == id) {
                    when (timer.status) {
                        TimerStatus.RUNNING -> timer.copy(status = TimerStatus.PAUSED)
                        TimerStatus.PAUSED, TimerStatus.IDLE -> timer.copy(status = TimerStatus.RUNNING)
                        TimerStatus.FINISHED -> timer.copy(status = TimerStatus.RUNNING, remainingSeconds = timer.totalSeconds)
                    }
                } else {
                    timer
                }
            })
        }
        saveTimers()
    }

    fun resetTimer(id: String) {
        _timers.update { state ->
            state.copy(timers = state.timers.map { timer ->
                if (timer.id == id) {
                    timer.copy(remainingSeconds = timer.totalSeconds, status = TimerStatus.IDLE)
                } else {
                    timer
                }
            })
        }
        saveTimers()
    }

    private suspend fun tick() {
        while (job?.isActive != false) {
            _timers.update { state ->
                state.copy(timers = state.timers.map { timer ->
                    if (timer.status == TimerStatus.RUNNING) {
                        val newRemaining = timer.remainingSeconds - 1
                        if (newRemaining <= 0) {
                            timer.copy(remainingSeconds = 0, status = TimerStatus.FINISHED)
                        } else {
                            timer.copy(remainingSeconds = newRemaining)
                        }
                    } else {
                        timer
                    }
                })
            }
            delay(1000)
        }
    }
}
