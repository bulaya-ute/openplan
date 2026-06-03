package com.example.openplan_mobile.ui.navigation

import com.example.openplan_mobile.data.state.AppState

object Navigator {
    private val backStack = mutableListOf<AppScreen>()

    fun push(screen: AppScreen) {
        backStack.add(AppState.uiState.currentScreen)
        AppState.lastNavigationAction = NavigationAction.Push
        AppState.uiState = AppState.uiState.copy(currentScreen = screen)
    }

    fun back() {
        if (backStack.isEmpty()) return
        AppState.lastNavigationAction = NavigationAction.Back
        AppState.uiState = AppState.uiState.copy(currentScreen = backStack.removeLast())
    }

    fun replace(screen: AppScreen) {
        AppState.lastNavigationAction = NavigationAction.Replace
        AppState.uiState = AppState.uiState.copy(currentScreen = screen)
    }

    fun setRoot(screen: AppScreen) {
        backStack.clear()
        AppState.lastNavigationAction = NavigationAction.SetRoot
        AppState.uiState = AppState.uiState.copy(currentScreen = screen)
    }

    val canGoBack get() = backStack.isNotEmpty()
}
