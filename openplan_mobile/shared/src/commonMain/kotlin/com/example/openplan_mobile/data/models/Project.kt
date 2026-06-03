package com.example.openplan_mobile.data.models

import kotlinx.serialization.Serializable

@Serializable
data class Project(
    val id: String,
    val ownerId: String,
    val name: String,
    val color: String,
    val isArchived: Boolean = false,
    val sortOrder: Int = 0,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class CreateProjectRequest(
    val name: String,
    val color: String = "#6b7280",
    val sortOrder: Int = 0
)
