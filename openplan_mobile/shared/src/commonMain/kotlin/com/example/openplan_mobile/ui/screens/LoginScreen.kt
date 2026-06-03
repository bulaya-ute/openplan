package com.example.openplan_mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.openplan_mobile.data.api.ApiClient
import com.example.openplan_mobile.data.state.AppState
import com.example.openplan_mobile.ui.components.inputColors
import com.example.openplan_mobile.ui.theme.Background
import com.example.openplan_mobile.ui.theme.Outline
import com.example.openplan_mobile.ui.theme.Primary
import com.example.openplan_mobile.ui.theme.PriorityP1
import com.example.openplan_mobile.ui.theme.Surface
import com.example.openplan_mobile.ui.theme.TextMuted
import com.example.openplan_mobile.ui.theme.TextSecondary
import kotlinx.coroutines.launch

@Composable
fun LoginScreen() {
    var serverUrl by remember { mutableStateOf("http://localhost:5000/api/v1") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp)
                .imePadding(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(48.dp))

            // Logo mark
            LogoMark()

            Spacer(Modifier.height(8.dp))

            Text(
                "OpenPlan",
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = Primary
            )
            Text(
                "Sign in to your workspace",
                fontSize = 13.sp,
                color = TextSecondary,
                modifier = Modifier.padding(top = 4.dp)
            )

            Spacer(Modifier.height(32.dp))

            // Card
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = Surface,
                shadowElevation = 8.dp,
                tonalElevation = 0.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    OutlinedTextField(
                        value = serverUrl,
                        onValueChange = { serverUrl = it },
                        label = { Text("Server URL") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = inputColors()
                    )
                    Spacer(Modifier.height(12.dp))

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Email") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        colors = inputColors()
                    )
                    Spacer(Modifier.height(12.dp))

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Password") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        colors = inputColors()
                    )

                    if (error.isNotBlank()) {
                        Spacer(Modifier.height(8.dp))
                        Text(error, color = PriorityP1, fontSize = 12.sp)
                    }

                    Spacer(Modifier.height(20.dp))

                    Button(
                        onClick = {
                            error = ""
                            loading = true
                            scope.launch {
                                val result = ApiClient.login(serverUrl.trim(), email.trim(), password)
                                result.onSuccess { auth ->
                                    AppState.onLoggedIn(
                                        token = auth.accessToken,
                                        userId = auth.userId,
                                        email = auth.email,
                                        displayName = auth.displayName,
                                        serverUrl = serverUrl.trim()
                                    )
                                }
                                result.onFailure {
                                    error = "Login failed. Check your credentials and server URL."
                                }
                                loading = false
                            }
                        },
                        enabled = !loading && email.isNotBlank() && password.isNotBlank(),
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Primary)
                    ) {
                        Text(
                            if (loading) "Signing in…" else "Sign in",
                            color = Color.White,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            Spacer(Modifier.height(48.dp))
        }
    }
}

@Composable
fun LogoMark() {
    // Two-pill staircase logo matching web/desktop
    Box(modifier = Modifier.size(40.dp)) {
        Box(
            modifier = Modifier
                .width(22.dp).height(9.dp)
                .align(Alignment.TopStart)
                .padding(top = 4.dp)
                .background(Color(0xFF1D4ED8), RoundedCornerShape(4.dp))
        )
        Box(
            modifier = Modifier
                .width(22.dp).height(9.dp)
                .align(Alignment.BottomEnd)
                .padding(bottom = 4.dp)
                .background(Color(0xFF60A5FA), RoundedCornerShape(4.dp))
        )
    }
}
