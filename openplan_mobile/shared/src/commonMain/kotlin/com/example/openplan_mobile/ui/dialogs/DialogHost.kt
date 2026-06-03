package com.example.openplan_mobile.ui.dialogs

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color

@Composable
fun DialogHost() {
    val dialogs = DialogController.dialogs
    AnimatedVisibility(
        visible = dialogs.isNotEmpty(),
        enter = fadeIn(),
        exit = fadeOut()
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.5f))
                .clickable(
                    indication = null,
                    interactionSource = remember { MutableInteractionSource() }
                ) {
                    val top = dialogs.lastOrNull()
                    if (top?.dismissOnTouchOutside == true) DialogController.dismissLast()
                },
            contentAlignment = Alignment.Center
        ) {
            dialogs.lastOrNull()?.let { dialog ->
                AnimatedVisibility(
                    visible = true,
                    enter = slideInVertically(initialOffsetY = { it / 4 }) + fadeIn(),
                    exit = slideOutVertically(targetOffsetY = { it / 4 }) + fadeOut()
                ) {
                    Box(
                        modifier = Modifier.clickable(
                            indication = null,
                            interactionSource = remember { MutableInteractionSource() }
                        ) {}
                    ) {
                        dialog.content()
                    }
                }
            }
        }
    }
}
