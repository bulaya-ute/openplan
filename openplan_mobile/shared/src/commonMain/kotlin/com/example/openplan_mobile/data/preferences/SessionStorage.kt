package com.example.openplan_mobile.data.preferences

import com.russhwolf.settings.Settings

data class SavedSession(
    val token: String,
    val userId: String,
    val email: String,
    val displayName: String,
    val serverUrl: String
)

object SessionStorage {
    private val settings: Settings = Settings()

    fun save(token: String, userId: String, email: String, displayName: String, serverUrl: String) {
        settings.putString("token", token)
        settings.putString("userId", userId)
        settings.putString("email", email)
        settings.putString("displayName", displayName)
        settings.putString("serverUrl", serverUrl)
    }

    fun restore(): SavedSession? {
        val token = settings.getStringOrNull("token") ?: return null
        return SavedSession(
            token = token,
            userId = settings.getString("userId", ""),
            email = settings.getString("email", ""),
            displayName = settings.getString("displayName", ""),
            serverUrl = settings.getString("serverUrl", "http://localhost:5000/api/v1")
        )
    }

    fun clear() {
        settings.clear()
    }
}
