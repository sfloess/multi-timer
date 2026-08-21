package com.flossware.multitimer.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    background = Color(0xFF0F172A),
    surface = Color(0xFF1E293B),
    primary = Color(0xFF38BDF8),
    onBackground = Color.White,
    onSurface = Color.White,
    primaryContainer = Color(0xFF1E293B),
    onPrimaryContainer = Color.White,
    onPrimary = Color.White
)

@Composable
fun MultiTimerTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
