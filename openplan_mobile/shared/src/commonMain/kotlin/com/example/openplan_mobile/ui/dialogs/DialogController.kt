package com.example.openplan_mobile.ui.dialogs

import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateListOf

data class DialogConfig(
    val id: String,
    val dismissOnTouchOutside: Boolean = true,
    val content: @Composable () -> Unit
)

object DialogController {
    val dialogs = mutableStateListOf<DialogConfig>()

    fun show(id: String = "default", dismissOnTouchOutside: Boolean = true, content: @Composable () -> Unit) {
        val idx = dialogs.indexOfFirst { it.id == id }
        val config = DialogConfig(id, dismissOnTouchOutside, content)
        if (idx >= 0) dialogs[idx] = config else dialogs.add(config)
    }

    fun dismiss(id: String = "default") { dialogs.removeAll { it.id == id } }

    fun dismissLast() { if (dialogs.isNotEmpty()) dialogs.removeLast() }

    fun dismissAll() { dialogs.clear() }
}
