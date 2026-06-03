package com.example.openplan_mobile.data.api

import com.example.openplan_mobile.data.models.AuthResponse
import com.example.openplan_mobile.data.models.CreateTaskRequest
import com.example.openplan_mobile.data.models.LoginRequest
import com.example.openplan_mobile.data.models.Project
import com.example.openplan_mobile.data.models.Task
import com.example.openplan_mobile.data.models.UpdateTaskRequest
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.http.isSuccess

object ApiClient {
    private var client: HttpClient = createHttpClient()
    private var baseUrl: String = "http://localhost:5000/api/v1"
    private var token: String? = null

    fun initialize(serverUrl: String, authToken: String) {
        baseUrl = serverUrl.trimEnd('/')
        token = authToken
    }

    fun clearAuth() {
        token = null
    }

    private fun authHeader() = "Bearer $token"

    suspend fun login(serverUrl: String, email: String, password: String): Result<AuthResponse> = runCatching {
        val url = serverUrl.trimEnd('/') + "/auth/login"
        client.post(url) {
            contentType(ContentType.Application.Json)
            setBody(LoginRequest(email, password))
        }.body<AuthResponse>()
    }

    suspend fun getTasks(view: String): Result<List<Task>> = runCatching {
        client.get("$baseUrl/tasks?view=$view") {
            header("Authorization", authHeader())
        }.body<List<Task>>()
    }

    suspend fun getProjectTasks(projectId: String): Result<List<Task>> = runCatching {
        client.get("$baseUrl/tasks/project/$projectId") {
            header("Authorization", authHeader())
        }.body<List<Task>>()
    }

    suspend fun getTask(taskId: String): Result<Task> = runCatching {
        client.get("$baseUrl/tasks/$taskId") {
            header("Authorization", authHeader())
        }.body<Task>()
    }

    suspend fun createTask(request: CreateTaskRequest): Result<Task> = runCatching {
        client.post("$baseUrl/tasks") {
            header("Authorization", authHeader())
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body<Task>()
    }

    suspend fun updateTask(taskId: String, request: UpdateTaskRequest): Result<Task> = runCatching {
        client.put("$baseUrl/tasks/$taskId") {
            header("Authorization", authHeader())
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body<Task>()
    }

    suspend fun tickTask(taskId: String): Result<Task> = runCatching {
        client.post("$baseUrl/tasks/$taskId/tick") {
            header("Authorization", authHeader())
        }.body<Task>()
    }

    suspend fun deleteTask(taskId: String): Result<Unit> = runCatching {
        val resp = client.delete("$baseUrl/tasks/$taskId") {
            header("Authorization", authHeader())
        }
        if (!resp.status.isSuccess()) error("Delete failed: ${resp.status}")
    }

    suspend fun getProjects(): Result<List<Project>> = runCatching {
        client.get("$baseUrl/projects") {
            header("Authorization", authHeader())
        }.body<List<Project>>()
    }
}
