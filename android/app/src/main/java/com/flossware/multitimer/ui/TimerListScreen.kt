package com.flossware.multitimer.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.flossware.multitimer.model.TimerModel
import com.flossware.multitimer.model.TimerStatus
import com.flossware.multitimer.viewmodel.TimerViewModel
import kotlinx.coroutines.delay
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimerListScreen(viewModel: TimerViewModel, modifier: Modifier = Modifier) {
    val state by viewModel.timers.collectAsState()
    val selectedTimerId by viewModel.selectedTimerId.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }
    var showSettingsDialog by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
            .padding(16.dp)
    ) {
        // Top action buttons row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            ActionButton(
                icon = Icons.Default.Add,
                label = "Add",
                onClick = { showAddDialog = true }
            )
            ActionButton(
                icon = Icons.Default.Delete,
                label = "Delete",
                onClick = { viewModel.deleteSelectedTimer() }
            )
            ActionButton(
                icon = Icons.Default.ArrowUpward,
                label = "Move Up",
                onClick = { viewModel.moveSelectedTimerUp() }
            )
            ActionButton(
                icon = Icons.Default.ArrowDownward,
                label = "Move Down",
                onClick = { viewModel.moveSelectedTimerDown() }
            )
            ActionButton(
                icon = Icons.Default.ClearAll,
                label = "Clear All",
                onClick = { viewModel.clearAllTimers() }
            )
            ActionButton(
                icon = Icons.Default.Settings,
                label = "Settings",
                onClick = { showSettingsDialog = true }
            )
        }

        // Timer list
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(state.timers, key = { it.id }) { timer ->
                TimerCard(
                    timer = timer,
                    isSelected = timer.id == selectedTimerId,
                    onClick = { viewModel.selectTimer(timer.id) },
                    onStartPause = { viewModel.toggleTimer(timer.id) },
                    onReset = { viewModel.resetTimer(timer.id) }
                )
            }
        }
    }

    // Add Timer Dialog
    if (showAddDialog) {
        AddTimerDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { name, durationSeconds ->
                viewModel.addTimer(name, durationSeconds)
                showAddDialog = false
            }
        )
    }

    // Settings Dialog
    if (showSettingsDialog) {
        SettingsDialog(
            onDismiss = { showSettingsDialog = false },
            onClearAll = {
                viewModel.clearAllTimers()
                showSettingsDialog = false
            }
        )
    }
}

@Composable
private fun ActionButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clickable(onClick = onClick)
            .padding(4.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = Color(0xFF38BDF8),
            modifier = Modifier.size(24.dp)
        )
        Text(
            text = label,
            color = Color(0xFF38BDF8),
            fontSize = 10.sp,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun TimerCard(
    timer: TimerModel,
    isSelected: Boolean,
    onClick: () -> Unit,
    onStartPause: () -> Unit,
    onReset: () -> Unit
) {
    val statusColor = when (timer.status) {
        TimerStatus.IDLE -> Color(0xFF64748B)
        TimerStatus.RUNNING -> Color(0xFF22C55E)
        TimerStatus.PAUSED -> Color(0xFFF59E0B)
        TimerStatus.FINISHED -> Color(0xFFEF4444)
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(
                width = if (isSelected) 2.dp else 1.dp,
                color = if (isSelected) Color(0xFF38BDF8) else Color(0xFF334155),
                shape = RoundedCornerShape(12.dp)
            )
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF1E293B)
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = timer.name,
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = formatTime(timer.remainingSeconds),
                        color = Color(0xFF94A3B8),
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .background(statusColor, RoundedCornerShape(6.dp))
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                Button(
                    onClick = onStartPause,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (timer.status == TimerStatus.RUNNING) 
                            Color(0xFFF59E0B) 
                        else 
                            Color(0xFF38BDF8)
                    ),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = when (timer.status) {
                            TimerStatus.RUNNING -> "Pause"
                            TimerStatus.PAUSED -> "Resume"
                            TimerStatus.FINISHED -> "Restart"
                            TimerStatus.IDLE -> "Start"
                        },
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                }
                OutlinedButton(
                    onClick = onReset,
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = Color(0xFF38BDF8)
                    ),
                    border = BorderStroke(1.dp, Color(0xFF38BDF8)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = "Reset",
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
private fun AddTimerDialog(
    onDismiss: () -> Unit,
    onConfirm: (String, Long) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var hours by remember { mutableStateOf("0") }
    var minutes by remember { mutableStateOf("0") }
    var seconds by remember { mutableStateOf("0") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = Color(0xFF1E293B)
            )
        ) {
            Column(
                modifier = Modifier.padding(24.dp)
            ) {
                Text(
                    text = "Add Timer",
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Timer Name", color = Color(0xFF94A3B8)) },
                    textStyle = LocalTextStyle.current.copy(color = Color.White),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFF38BDF8),
                        unfocusedBorderColor = Color(0xFF334155),
                        cursorColor = Color(0xFF38BDF8)
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Duration",
                    color = Color(0xFF94A3B8),
                    fontSize = 14.sp,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    DurationField(
                        value = hours,
                        onValueChange = { hours = it },
                        label = "Hours"
                    )
                    DurationField(
                        value = minutes,
                        onValueChange = { minutes = it },
                        label = "Minutes"
                    )
                    DurationField(
                        value = seconds,
                        onValueChange = { seconds = it },
                        label = "Seconds"
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel", color = Color(0xFF94A3B8))
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            val h = hours.toLongOrNull() ?: 0L
                            val m = minutes.toLongOrNull() ?: 0L
                            val s = seconds.toLongOrNull() ?: 0L
                            val totalSeconds = h * 3600 + m * 60 + s
                            if (totalSeconds > 0) {
                                onConfirm(name.ifBlank { "Timer" }, totalSeconds)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF38BDF8)
                        )
                    ) {
                        Text("Add", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun DurationField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.width(80.dp)
    ) {
        OutlinedTextField(
            value = value,
            onValueChange = { newValue ->
                if (newValue.length <= 3 && newValue.all { it.isDigit() }) {
                    onValueChange(newValue)
                }
            },
            textStyle = LocalTextStyle.current.copy(
                color = Color.White,
                textAlign = TextAlign.Center
            ),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Color(0xFF38BDF8),
                unfocusedBorderColor = Color(0xFF334155),
                cursorColor = Color(0xFF38BDF8)
            ),
            modifier = Modifier.fillMaxWidth()
        )
        Text(
            text = label,
            color = Color(0xFF94A3B8),
            fontSize = 12.sp,
            modifier = Modifier.padding(top = 4.dp)
        )
    }
}

@Composable
private fun SettingsDialog(
    onDismiss: () -> Unit,
    onClearAll: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = Color(0xFF1E293B)
            )
        ) {
            Column(
                modifier = Modifier.padding(24.dp)
            ) {
                Text(
                    text = "Settings",
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                Text(
                    text = "Timer Settings",
                    color = Color(0xFF94A3B8),
                    fontSize = 14.sp,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                // Add more settings here as needed

                Spacer(modifier = Modifier.height(24.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Close", color = Color(0xFF94A3B8))
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = onClearAll,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFFEF4444)
                        )
                    ) {
                        Text("Clear All", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

private fun formatTime(totalSeconds: Long): String {
    val hours = totalSeconds / 3600
    val minutes = (totalSeconds % 3600) / 60
    val seconds = totalSeconds % 60
    return String.format(Locale.US, "%02d:%02d:%02d", hours, minutes, seconds)
}
