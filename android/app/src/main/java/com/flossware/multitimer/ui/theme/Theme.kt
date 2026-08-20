package com.flossware.multitimer.ui.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

@Composable
fun MultiTimerTheme(content: @Composable () -> Unit) {
    val darkColorScheme = darkColorScheme(
        background = Color(0xFF0F172A),
        surface = Color(0xFF1E293B),
        primary = Color(0xFF38BDF8),
        onBackground = Color.White,
        onSurface = Color.White
    )

    MaterialTheme(
        colorScheme = darkColorScheme,
        content = content
    )
}
