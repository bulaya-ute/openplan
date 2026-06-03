package com.example.openplan_mobile.data.state

sealed class LoginState {
    object LoggedOut : LoginState()
    data class LoggedIn(
        val token: String,
        val userId: String,
        val email: String,
        val displayName: String,
        val serverUrl: String
    ) : LoginState()
}
