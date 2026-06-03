package com.example.openplan_mobile.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.openplan_mobile.data.state.AppState
import com.example.openplan_mobile.ui.dialogs.DialogHost
import com.example.openplan_mobile.ui.theme.Background
import com.example.openplan_mobile.ui.theme.Outline
import com.example.openplan_mobile.ui.theme.Primary
import com.example.openplan_mobile.ui.theme.Surface
import com.example.openplan_mobile.ui.theme.SurfaceVariant
import com.example.openplan_mobile.ui.theme.TextMuted
import com.example.openplan_mobile.ui.theme.TextSecondary

private data class Tab(val label: String, val icon: String, val index: Int)

private val tabs = listOf(
    Tab("Today", "◈", 0),
    Tab("Upcoming", "◷", 1),
    Tab("Inbox", "⊡", 2),
    Tab("Projects", "▦", 3)
)

@Composable
fun MainScreen() {
    var selectedTab by remember { mutableIntStateOf(0) }
    var prevTab by remember { mutableIntStateOf(0) }
    var showAddSheet by remember { mutableStateOf(false) }
    var selectedProjectId by remember { mutableStateOf<String?>(null) }

    // Load data on first render
    LaunchedEffect(Unit) {
        AppState.loadTodayTasks()
        AppState.loadProjects()
    }

    LaunchedEffect(selectedTab) {
        when (selectedTab) {
            0 -> AppState.loadTodayTasks()
            1 -> AppState.loadUpcomingTasks()
            2 -> AppState.loadInboxTasks()
        }
    }

    Scaffold(
        containerColor = Background,
        bottomBar = {
            Column {
                HorizontalDivider(color = Outline.copy(alpha = 0.4f), thickness = 0.5.dp)
                NavigationBar(
                    containerColor = SurfaceVariant,
                    tonalElevation = 0.dp,
                    modifier = Modifier.navigationBarsPadding()
                ) {
                    tabs.forEach { tab ->
                        NavigationBarItem(
                            selected = selectedTab == tab.index,
                            onClick = {
                                prevTab = selectedTab
                                selectedTab = tab.index
                                selectedProjectId = null
                            },
                            icon = {
                                Text(tab.icon, fontSize = 18.sp,
                                    color = if (selectedTab == tab.index) Primary else TextMuted)
                            },
                            label = {
                                Text(tab.label, fontSize = 10.sp,
                                    color = if (selectedTab == tab.index) Primary else TextMuted,
                                    fontWeight = if (selectedTab == tab.index) FontWeight.SemiBold else FontWeight.Normal)
                            },
                            colors = NavigationBarItemDefaults.colors(
                                indicatorColor = Primary.copy(alpha = 0.15f)
                            )
                        )
                    }
                }
            }
        },
        floatingActionButton = {
            if (selectedTab != 3) {
                FloatingActionButton(
                    onClick = { showAddSheet = true },
                    containerColor = Primary,
                    contentColor = Color.White,
                    elevation = FloatingActionButtonDefaults.elevation(4.dp),
                    modifier = Modifier.padding(bottom = 4.dp)
                ) {
                    Text("+", fontSize = 24.sp, color = Color.White)
                }
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.fillMaxSize()) {
            AnimatedContent(
                targetState = selectedTab to selectedProjectId,
                transitionSpec = {
                    val forward = targetState.first >= initialState.first
                    if (forward) {
                        (slideInHorizontally { it } + fadeIn()).togetherWith(slideOutHorizontally { -it } + fadeOut())
                    } else {
                        (slideInHorizontally { -it } + fadeIn()).togetherWith(slideOutHorizontally { it } + fadeOut())
                    }
                }
            ) { (tab, projId) ->
                when {
                    tab == 0 -> {
                        Column(modifier = Modifier.fillMaxSize()) {
                            ScreenHeader("Today", AppState.loginState.let {
                                if (it is com.example.openplan_mobile.data.state.LoginState.LoggedIn) it.displayName else ""
                            })
                            TaskListView(
                                title = "Today",
                                tasks = AppState.todayTasks,
                                loading = AppState.isLoadingTasks,
                                view = "today",
                                showAddSheet = showAddSheet,
                                onDismissAddSheet = { showAddSheet = false },
                                innerPadding = innerPadding
                            )
                        }
                    }
                    tab == 1 -> {
                        Column(modifier = Modifier.fillMaxSize()) {
                            ScreenHeader("Upcoming", null)
                            TaskListView(
                                title = "Upcoming",
                                tasks = AppState.upcomingTasks,
                                loading = AppState.isLoadingTasks,
                                view = "upcoming",
                                showAddSheet = showAddSheet,
                                onDismissAddSheet = { showAddSheet = false },
                                innerPadding = innerPadding
                            )
                        }
                    }
                    tab == 2 -> {
                        Column(modifier = Modifier.fillMaxSize()) {
                            ScreenHeader("Inbox", null)
                            TaskListView(
                                title = "Inbox",
                                tasks = AppState.inboxTasks,
                                loading = AppState.isLoadingTasks,
                                view = "inbox",
                                showAddSheet = showAddSheet,
                                onDismissAddSheet = { showAddSheet = false },
                                innerPadding = innerPadding
                            )
                        }
                    }
                    tab == 3 && projId == null -> {
                        ProjectsScreen(
                            projects = AppState.projects,
                            loading = AppState.isLoadingProjects,
                            onProjectClick = { selectedProjectId = it },
                            innerPadding = innerPadding
                        )
                    }
                    tab == 3 && projId != null -> {
                        val projectName = AppState.projects.firstOrNull { it.id == projId }?.name ?: "Project"
                        LaunchedEffect(projId) { AppState.loadProjectTasks(projId) }
                        Column(modifier = Modifier.fillMaxSize()) {
                            ScreenHeader(projectName, null, onBack = { selectedProjectId = null })
                            TaskListView(
                                title = projectName,
                                tasks = AppState.projectTasksMap[projId] ?: emptyList(),
                                loading = AppState.isLoadingTasks,
                                view = "project",
                                projectId = projId,
                                showAddSheet = showAddSheet,
                                onDismissAddSheet = { showAddSheet = false },
                                innerPadding = innerPadding
                            )
                        }
                    }
                }
            }
            DialogHost()
        }
    }
}

@Composable
private fun ScreenHeader(title: String, subtitle: String?, onBack: (() -> Unit)? = null) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Background)
            .statusBarsPadding()
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (onBack != null) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(Surface),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "‹",
                    fontSize = 22.sp,
                    color = Primary,
                    modifier = Modifier
                        .padding(bottom = 2.dp)
                        .clickableNoRipple { onBack() }
                )
            }
            Spacer(Modifier.width(10.dp))
        }

        Column {
            Text(
                title,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
            if (!subtitle.isNullOrBlank()) {
                Text(subtitle, fontSize = 12.sp, color = TextSecondary)
            }
        }
    }
}

@Composable
fun Modifier.clickableNoRipple(onClick: () -> Unit): Modifier {
    val interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
    return this.then(
        androidx.compose.foundation.clickable(
            indication = null,
            interactionSource = interactionSource,
            onClick = onClick
        )
    )
}
