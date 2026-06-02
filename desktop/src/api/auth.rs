use super::ApiClient;
use crate::{
    error::Result,
    models::auth::{AuthUser, LoginRequest, RegisterRequest},
};

pub async fn login(client: &ApiClient, email: &str, password: &str) -> Result<AuthUser> {
    client
        .post(
            "/auth/login",
            &LoginRequest {
                email: email.to_string(),
                password: password.to_string(),
            },
        )
        .await
}

pub async fn register(
    client: &ApiClient,
    email: &str,
    password: &str,
    display_name: &str,
) -> Result<AuthUser> {
    client
        .post(
            "/auth/register",
            &RegisterRequest {
                email: email.to_string(),
                password: password.to_string(),
                display_name: display_name.to_string(),
            },
        )
        .await
}
