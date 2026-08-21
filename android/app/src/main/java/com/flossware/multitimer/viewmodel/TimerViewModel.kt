package com.flossware.multitimer.viewmodel

import android.content.SharedPreferences
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.flossware.multitimer.model.TimerModel
import com.flossware.multitimer.model.TimerStatus
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update

data class TimersState(
    val timers: List<TimerModel> = emptyList(),
    val selectedIndex: Int? = null
)

class TimerViewModel(private val sharedPreferences: SharedPreferences) : ViewModel() {
    private val gson = Gson()
    private val _timers = MutableStateFlow(TimersState())
    val timers: StateFlow<TimersState> = _timers

    private val _selectedTimerId = MutableStateFlow<String?>(null)
    val selectedTimerId: StateFlow<String?> = _selectedTimerId

    init {
        loadTimers()
        viewModelScope.launch {
            tick()
        }
    }

    private fun loadTimers() {
        val json = sharedPreferences.getString("timers", null) ?: return
        try {
            val type = object : TypeToken<List<TimerModel>>() {}.type
            val timerList: List<TimerModel> = gson.fromJson(json, type)
            _timers.update { it.copy(timers = timerList) }
        } catch (e: Exception) {
            _timers.update { TimersState() }
        }
    }

    private fun saveTimers() {
        val json = gson.toJson(_timers.value.timers)
        sharedPreferences.edit().putString("timers", json).apply()
    }

    fun addTimer(name: String = "New Timer", seconds: Long = 300) {
        val timer = TimerModel(name = name, totalSeconds = seconds)
        _timers.update { it.copy(timers = it.timers + timer) }
        _selectedTimerId.value = timer.id
        saveTimers()
    }

    fun deleteSelectedTimer() {
        val id = _selectedTimerId.value ?: return
        _timers.update { state ->
            state.copy(timers = state.timers.filter { it.id != id })
        }
        _selectedTimerId.value = _timers.value.timers.lastOrNull()?.id
        saveTimers()
    }

    fun moveSelectedTimerUp() {
        val id = _selectedTimerId.value ?: return
        _timers.update { state ->
            val index = state.timers.indexOfFirst { it.id == id }
            if (index > 0) {
                val list = state.timers.toMutableList()
                val item = list.removeAt(index)
                list.add(index - 1, item)
                state.copy(timers = list)
            } else state
        }
        saveTimers()
    }

    fun moveSelectedTimerDown() {
        val id = _selectedTimerId.value ?: return
        _timers.update { state ->
            val index = state.timers.indexOfFirst { it.id == id }
            if (index >= 0 && index < state.timers.size - 1) {
                val list = state.timers.toMutableList()
                val item = list.removeAt(index)
                list.add(index + 1, item)
                state.copy(timers = list)
            } else state
        }
        saveTimers()
    }

    fun clearAllTimers() {
        _timers.update { TimersState() }
        _selectedTimerId.value = null
        saveTimers()
    }

    fun selectTimer(id: String) {
        _selectedTimerId.value = id
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
                } else timer
            })
        }
        saveTimers()
    }

    fun resetTimer(id: String) {
        _timers.update { state ->
            state.copy(timers = state.timers.map { timer ->
                if (timer.id == id) timer.copy(remainingSeconds = timer.totalSeconds, status = TimerStatus.IDLE)
                else timer
            })
        }
        saveTimers()
    }

    private suspend fun tick() {
        while (true) {
            delay(1000)
            _timers.update { state ->
                state.copy(timers = state.timers.map { timer ->
                    if (timer.status == TimerStatus.RUNNING && timer.remainingSeconds > 0) {
                        val remaining = timer.remainingSeconds - 1
                        if (remaining <= 0) timer.copy(remainingSeconds = 0, status = TimerStatus.FINISHED)
                        else timer.copy(remainingSeconds = remaining)
                    } else timer
                })
            }
        }
    }

    class Factory(private val prefs: SharedPreferences) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return TimerViewModel(prefs) as T
        }
    }
}
