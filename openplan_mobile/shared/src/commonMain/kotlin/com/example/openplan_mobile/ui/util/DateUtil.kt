package com.example.openplan_mobile.ui.util

import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

private val MIN_DATE_PREFIX = "0001-01-01"

fun formatDueDate(isoString: String): String {
    if (isoString.startsWith(MIN_DATE_PREFIX) || isoString.isBlank()) return ""
    return try {
        val instant = Instant.parse(isoString)
        val now = Clock.System.now()
        val tz = TimeZone.currentSystemDefault()
        val local = instant.toLocalDateTime(tz)
        val today = now.toLocalDateTime(tz).date
        val tomorrow = kotlinx.datetime.LocalDate(today.year, today.month, today.dayOfMonth + 1)

        val time = "%02d:%02d".format(local.hour, local.minute)
        when (local.date) {
            today -> "Today · $time"
            tomorrow -> "Tomorrow · $time"
            else -> "${local.month.name.take(3).lowercase().replaceFirstChar { it.uppercase() }} ${local.dayOfMonth} · $time"
        }
    } catch (e: Exception) { "" }
}

fun isNoDueDate(isoString: String) = isoString.startsWith(MIN_DATE_PREFIX) || isoString.isBlank()

fun isDueOverdue(isoString: String): Boolean {
    if (isNoDueDate(isoString)) return false
    return try {
        Instant.parse(isoString) < Clock.System.now()
    } catch (e: Exception) { false }
}
