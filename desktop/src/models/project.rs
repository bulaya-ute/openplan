use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub owner_id: String,
    pub name: String,
    pub color: String,
    pub is_archived: bool,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
pub struct CreateProjectPayload {
    pub name: String,
    pub color: String,
    #[serde(rename = "sortOrder")]
    pub sort_order: i32,
}
