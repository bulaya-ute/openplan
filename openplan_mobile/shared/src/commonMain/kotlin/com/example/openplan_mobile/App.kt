package com.example.openplan_mobile

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import com.example.openplan_mobile.data.state.AppState
import com.example.openplan_mobile.ui.navigation.NavigationAction
import com.example.openplan_mobile.ui.theme.OpenPlanTheme

@OptIn(ExperimentalAnimationApi::class)
@Composable
fun App() {
    OpenPlanTheme {
        LaunchedEffect(Unit) {
            AppState.initialize()
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
        ) {
            AnimatedContent(
                targetState = AppState.uiState.currentScreen,
                transitionSpec = {
                    when (AppState.lastNavigationAction) {
                        NavigationAction.Push ->
                            (slideInHorizontally { it } + fadeIn()).togetherWith(slideOutHorizontally { -it } + fadeOut())
                        NavigationAction.Back ->
                            (slideInHorizontally { -it } + fadeIn()).togetherWith(slideOutHorizontally { it } + fadeOut())
                        else ->
                            fadeIn().togetherWith(fadeOut())
                    }
                }
            ) { screen ->
                screen.Content()
            }
        }
    }
}
