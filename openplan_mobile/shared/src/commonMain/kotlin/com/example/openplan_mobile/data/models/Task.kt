package com.example.openplan_mobile.data.models

import kotlinx.serialization.Serializable

@Serializable
data class Task(
    val id: String,
    val ownerId: String,
    val projectId: String? = null,
    val parentId: String? = null,
    val title: String,
    val description: String? = null,
    val taskType: String,
    val weight: Float = 1f,
    val priority: String,
    val effectivePriority: String,
    val status: String,
    val startAt: String,
    val dueAt: String,
    val completedAt: String? = null,
    val sortOrder: Int = 0,
    val progress: Double = 0.0,
    val completedChildCount: Int = 0,
    val totalChildCount: Int = 0,
    val nextChildTitle: String? = null,
    val createdAt: String,
    val updatedAt: String,
    val children: List<Task> = emptyList()
) {
    val isCompleted get() = status == "Completed"
    val isCancelled get() = status == "Cancelled"
    val isTerminal get() = isCompleted || isCancelled
    val hasChildren get() = children.isNotEmpty() || totalChildCount > 0
    val isSequential get() = taskType == "Sequential"
}

@Serializable
data class CreateTaskRequest(
    val title: String,
    val description: String? = null,
    val projectId: String? = null,
    val parentId: String? = null,
    val taskType: String = "Parallel",
    val weight: Float = 1f,
    val priority: String = "P4",
    val startAt: String = "0001-01-01T00:00:00+00:00",
    val dueAt: String = "0001-01-01T00:00:00+00:00",
    val sortOrder: Int = 0
)

@Serializable
data class UpdateTaskRequest(
    val title: String? = null,
    val description: String? = null,
    val projectId: String? = null,
    val taskType: String? = null,
    val weight: Float? = null,
    val priority: String? = null,
    val status: String? = null,
    val startAt: String? = null,
    val dueAt: String? = null,
    val sortOrder: Int? = null
)
