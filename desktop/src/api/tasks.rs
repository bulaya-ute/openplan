use super::ApiClient;
use crate::{
    error::Result,
    models::task::{CreateTaskPayload, Task, UpdateTaskPayload},
};

pub async fn get_tasks(client: &ApiClient, view: &str) -> Result<Vec<Task>> {
    client.get_with_params("/tasks", &[("view", view)]).await
}

pub async fn get_project_tasks(client: &ApiClient, project_id: &str) -> Result<Vec<Task>> {
    client.get(&format!("/tasks/project/{project_id}")).await
}

pub async fn get_task(client: &ApiClient, id: &str) -> Result<Task> {
    client.get(&format!("/tasks/{id}")).await
}

pub async fn create_task(client: &ApiClient, payload: CreateTaskPayload) -> Result<Task> {
    client.post("/tasks", &payload).await
}

pub async fn update_task(
    client: &ApiClient,
    id: &str,
    payload: UpdateTaskPayload,
) -> Result<Task> {
    client.put(&format!("/tasks/{id}"), &payload).await
}

pub async fn tick_task(client: &ApiClient, id: &str) -> Result<Task> {
    client.post_empty(&format!("/tasks/{id}/tick")).await
}

pub async fn delete_task(client: &ApiClient, id: &str) -> Result<()> {
    client.delete(&format!("/tasks/{id}")).await
}
