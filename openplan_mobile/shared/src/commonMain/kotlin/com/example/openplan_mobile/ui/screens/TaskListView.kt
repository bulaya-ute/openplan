package com.example.openplan_mobile.ui.screens

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.openplan_mobile.data.models.CreateTaskRequest
import com.example.openplan_mobile.data.models.Task
import com.example.openplan_mobile.data.models.UpdateTaskRequest
import com.example.openplan_mobile.data.state.AppState
import com.example.openplan_mobile.ui.components.AddTaskSheet
import com.example.openplan_mobile.ui.components.TaskCard
import com.example.openplan_mobile.ui.components.TaskDetailSheet
import com.example.openplan_mobile.ui.theme.Primary
import com.example.openplan_mobile.ui.theme.TextMuted

@Composable
fun TaskListView(
    title: String,
    tasks: List<Task>,
    loading: Boolean,
    view: String,
    projectId: String? = null,
    showAddSheet: Boolean,
    onDismissAddSheet: () -> Unit,
    innerPadding: PaddingValues = PaddingValues(0.dp)
) {
    var detailTaskId by remember { mutableStateOf<String?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(innerPadding)
    ) {
        when {
            loading -> {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = Primary
                )
            }
            tasks.isEmpty() && !loading -> {
                Text(
                    "No tasks here.",
                    color = TextMuted,
                    modifier = Modifier.align(Alignment.Center)
                )
            }
            else -> {
                LazyColumn(
                    contentPadding = PaddingValues(top = 8.dp, bottom = 88.dp)
                ) {
                    items(tasks, key = { it.id }) { task ->
                        TaskCard(
                            task = task,
                            onTick = { AppState.tickTask(task.id, view, projectId) },
                            onOpen = { detailTaskId = task.id }
                        )
                    }
                }
            }
        }
    }

    // Find the selected task for the detail sheet
    val detailTask = detailTaskId?.let { id ->
        fun findTask(list: List<Task>): Task? {
            for (t in list) {
                if (t.id == id) return t
                findTask(t.children)?.let { return it }
            }
            return null
        }
        findTask(tasks)
    }

    detailTask?.let { task ->
        TaskDetailSheet(
            task = task,
            onDismiss = { detailTaskId = null },
            onSave = { req -> AppState.updateTask(task.id, req, view, projectId) },
            onDelete = { AppState.deleteTask(task.id, view, projectId) }
        )
    }

    if (showAddSheet) {
        AddTaskSheet(
            projectId = projectId,
            onDismiss = onDismissAddSheet,
            onSubmit = { req -> AppState.createTask(req, view, projectId) }
        )
    }
}
