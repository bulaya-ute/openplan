package com.example.openplan_mobile.data.models

import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(val email: String, val password: String)

@Serializable
data class AuthResponse(
    val accessToken: String,
    val userId: String,
    val email: String,
    val displayName: String
)
