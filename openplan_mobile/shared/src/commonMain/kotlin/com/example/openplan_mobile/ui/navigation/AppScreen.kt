package com.example.openplan_mobile.ui.navigation

import androidx.compose.runtime.Composable
import com.example.openplan_mobile.ui.screens.LoginScreen
import com.example.openplan_mobile.ui.screens.MainScreen

sealed class AppScreen {
    @Composable abstract fun Content()

    object Login : AppScreen() {
        @Composable override fun Content() { LoginScreen() }
    }

    object Main : AppScreen() {
        @Composable override fun Content() { MainScreen() }
    }
}
