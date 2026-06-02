use super::ApiClient;
use crate::{
    error::Result,
    models::project::{CreateProjectPayload, Project},
};

pub async fn get_projects(client: &ApiClient) -> Result<Vec<Project>> {
    client.get("/projects").await
}

pub async fn create_project(client: &ApiClient, name: &str, color: &str) -> Result<Project> {
    client
        .post(
            "/projects",
            &CreateProjectPayload {
                name: name.to_string(),
                color: color.to_string(),
                sort_order: 0,
            },
        )
        .await
}

pub async fn delete_project(client: &ApiClient, id: &str) -> Result<()> {
    client.delete(&format!("/projects/{id}")).await
}
