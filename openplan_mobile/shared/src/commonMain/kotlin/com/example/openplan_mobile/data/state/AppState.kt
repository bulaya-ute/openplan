package com.example.openplan_mobile.data.state

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.example.openplan_mobile.data.api.ApiClient
import com.example.openplan_mobile.data.models.CreateTaskRequest
import com.example.openplan_mobile.data.models.Project
import com.example.openplan_mobile.data.models.Task
import com.example.openplan_mobile.data.models.UpdateTaskRequest
import com.example.openplan_mobile.data.preferences.SessionStorage
import com.example.openplan_mobile.ui.navigation.AppScreen
import com.example.openplan_mobile.ui.navigation.NavigationAction
import com.example.openplan_mobile.ui.navigation.Navigator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

object AppState {
    var loginState: LoginState by mutableStateOf(LoginState.LoggedOut)
    var uiState: UIState by mutableStateOf(UIState())
    var lastNavigationAction: NavigationAction by mutableStateOf(NavigationAction.Unknown)

    var todayTasks: List<Task> by mutableStateOf(emptyList())
    var upcomingTasks: List<Task> by mutableStateOf(emptyList())
    var inboxTasks: List<Task> by mutableStateOf(emptyList())
    var projects: List<Project> by mutableStateOf(emptyList())
    var projectTasksMap: Map<String, List<Task>> by mutableStateOf(emptyMap())

    var isLoadingTasks: Boolean by mutableStateOf(false)
    var isLoadingProjects: Boolean by mutableStateOf(false)
    var taskError: String? by mutableStateOf(null)

    var selectedTaskId: String? by mutableStateOf(null)
    var selectedProjectId: String? by mutableStateOf(null)

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    fun initialize() {
        val session = SessionStorage.restore() ?: return
        loginState = LoginState.LoggedIn(
            token = session.token,
            userId = session.userId,
            email = session.email,
            displayName = session.displayName,
            serverUrl = session.serverUrl
        )
        ApiClient.initialize(session.serverUrl, session.token)
        Navigator.setRoot(AppScreen.Main)
    }

    fun onLoggedIn(token: String, userId: String, email: String, displayName: String, serverUrl: String) {
        loginState = LoginState.LoggedIn(token, userId, email, displayName, serverUrl)
        SessionStorage.save(token, userId, email, displayName, serverUrl)
        ApiClient.initialize(serverUrl, token)
        Navigator.setRoot(AppScreen.Main)
        loadProjects()
        loadTodayTasks()
    }

    fun logout() {
        SessionStorage.clear()
        ApiClient.clearAuth()
        loginState = LoginState.LoggedOut
        todayTasks = emptyList()
        upcomingTasks = emptyList()
        inboxTasks = emptyList()
        projects = emptyList()
        projectTasksMap = emptyMap()
        Navigator.setRoot(AppScreen.Login)
    }

    fun loadTodayTasks() = scope.launch {
        isLoadingTasks = true
        taskError = null
        val result = ApiClient.getTasks("today")
        result.onSuccess { todayTasks = it }
        result.onFailure { taskError = it.message }
        isLoadingTasks = false
    }

    fun loadUpcomingTasks() = scope.launch {
        isLoadingTasks = true
        taskError = null
        val result = ApiClient.getTasks("upcoming")
        result.onSuccess { upcomingTasks = it }
        result.onFailure { taskError = it.message }
        isLoadingTasks = false
    }

    fun loadInboxTasks() = scope.launch {
        isLoadingTasks = true
        taskError = null
        val result = ApiClient.getTasks("inbox")
        result.onSuccess { inboxTasks = it }
        result.onFailure { taskError = it.message }
        isLoadingTasks = false
    }

    fun loadProjects() = scope.launch {
        isLoadingProjects = true
        val result = ApiClient.getProjects()
        result.onSuccess { projects = it }
        isLoadingProjects = false
    }

    fun loadProjectTasks(projectId: String) = scope.launch {
        isLoadingTasks = true
        taskError = null
        val result = ApiClient.getProjectTasks(projectId)
        result.onSuccess { tasks ->
            projectTasksMap = projectTasksMap + (projectId to tasks)
        }
        result.onFailure { taskError = it.message }
        isLoadingTasks = false
    }

    fun tickTask(taskId: String, view: String, projectId: String? = null) = scope.launch {
        val result = ApiClient.tickTask(taskId)
        result.onSuccess { updated ->
            replaceTaskInView(updated, view, projectId)
            // Refresh parent view entirely to capture auto-complete propagation
            refreshView(view, projectId)
        }
    }

    fun createTask(request: CreateTaskRequest, view: String, projectId: String? = null) = scope.launch {
        val result = ApiClient.createTask(request)
        result.onSuccess { refreshView(view, projectId) }
        result.onFailure { taskError = it.message }
    }

    fun updateTask(taskId: String, request: UpdateTaskRequest, view: String, projectId: String? = null) = scope.launch {
        val result = ApiClient.updateTask(taskId, request)
        result.onSuccess { refreshView(view, projectId) }
        result.onFailure { taskError = it.message }
        selectedTaskId = null
    }

    fun deleteTask(taskId: String, view: String, projectId: String? = null) = scope.launch {
        ApiClient.deleteTask(taskId)
        refreshView(view, projectId)
        selectedTaskId = null
    }

    private fun refreshView(view: String, projectId: String?) {
        when (view) {
            "today" -> loadTodayTasks()
            "upcoming" -> loadUpcomingTasks()
            "inbox" -> loadInboxTasks()
            "project" -> projectId?.let { loadProjectTasks(it) }
        }
    }

    private fun replaceTaskInView(updated: Task, view: String, projectId: String?) {
        fun replaceIn(list: List<Task>): List<Task> = list.map { t ->
            if (t.id == updated.id) updated
            else t.copy(children = replaceIn(t.children))
        }
        when (view) {
            "today" -> todayTasks = replaceIn(todayTasks)
            "upcoming" -> upcomingTasks = replaceIn(upcomingTasks)
            "inbox" -> inboxTasks = replaceIn(inboxTasks)
            "project" -> projectId?.let { id ->
                val cur = projectTasksMap[id] ?: return
                projectTasksMap = projectTasksMap + (id to replaceIn(cur))
            }
        }
    }
}
