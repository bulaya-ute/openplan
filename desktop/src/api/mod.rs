pub mod auth;
pub mod projects;
pub mod tasks;

use crate::error::{AppError, Result};
use reqwest::{Client, Response, StatusCode};
use serde::de::DeserializeOwned;

#[derive(Clone)]
pub struct ApiClient {
    client: Client,
    pub base_url: String,
    token: Option<String>,
}

impl ApiClient {
    pub fn new(base_url: impl Into<String>, token: Option<String>) -> Self {
        Self {
            client: Client::new(),
            base_url: base_url.into(),
            token,
        }
    }

    pub fn with_token(mut self, token: impl Into<String>) -> Self {
        self.token = Some(token.into());
        self
    }

    pub fn set_token(&mut self, token: Option<String>) {
        self.token = token;
    }

    fn auth_header(&self) -> Option<String> {
        self.token.as_deref().map(|t| format!("Bearer {t}"))
    }

    pub async fn get<T: DeserializeOwned>(&self, path: &str) -> Result<T> {
        let mut req = self.client.get(format!("{}{}", self.base_url, path));
        if let Some(auth) = self.auth_header() {
            req = req.header("Authorization", auth);
        }
        let resp = req.send().await?;
        parse_response(resp).await
    }

    pub async fn get_with_params<T: DeserializeOwned>(
        &self,
        path: &str,
        params: &[(&str, &str)],
    ) -> Result<T> {
        let mut req = self
            .client
            .get(format!("{}{}", self.base_url, path))
            .query(params);
        if let Some(auth) = self.auth_header() {
            req = req.header("Authorization", auth);
        }
        let resp = req.send().await?;
        parse_response(resp).await
    }

    pub async fn post<B: serde::Serialize, T: DeserializeOwned>(
        &self,
        path: &str,
        body: &B,
    ) -> Result<T> {
        let mut req = self
            .client
            .post(format!("{}{}", self.base_url, path))
            .json(body);
        if let Some(auth) = self.auth_header() {
            req = req.header("Authorization", auth);
        }
        let resp = req.send().await?;
        parse_response(resp).await
    }

    pub async fn post_empty<T: DeserializeOwned>(&self, path: &str) -> Result<T> {
        let mut req = self
            .client
            .post(format!("{}{}", self.base_url, path))
            .header("Content-Length", "0");
        if let Some(auth) = self.auth_header() {
            req = req.header("Authorization", auth);
        }
        let resp = req.send().await?;
        parse_response(resp).await
    }

    pub async fn put<B: serde::Serialize, T: DeserializeOwned>(
        &self,
        path: &str,
        body: &B,
    ) -> Result<T> {
        let mut req = self
            .client
            .put(format!("{}{}", self.base_url, path))
            .json(body);
        if let Some(auth) = self.auth_header() {
            req = req.header("Authorization", auth);
        }
        let resp = req.send().await?;
        parse_response(resp).await
    }

    pub async fn delete(&self, path: &str) -> Result<()> {
        let mut req = self.client.delete(format!("{}{}", self.base_url, path));
        if let Some(auth) = self.auth_header() {
            req = req.header("Authorization", auth);
        }
        let resp = req.send().await?;
        if resp.status().is_success() {
            Ok(())
        } else {
            let status = resp.status().as_u16();
            let message = resp.text().await.unwrap_or_default();
            Err(AppError::Server { status, message })
        }
    }
}

async fn parse_response<T: DeserializeOwned>(resp: Response) -> Result<T> {
    let status = resp.status();
    if status == StatusCode::UNAUTHORIZED {
        return Err(AppError::Unauthenticated);
    }
    if !status.is_success() {
        let code = status.as_u16();
        let message = resp.text().await.unwrap_or_default();
        return Err(AppError::Server {
            status: code,
            message,
        });
    }
    Ok(resp.json::<T>().await?)
}
