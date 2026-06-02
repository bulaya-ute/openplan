use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
pub enum ItemStatus {
    Scheduled,
    Active,
    Completed,
    Cancelled,
}

impl ItemStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            ItemStatus::Scheduled => "Scheduled",
            ItemStatus::Active => "Active",
            ItemStatus::Completed => "Completed",
            ItemStatus::Cancelled => "Cancelled",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "Active" => ItemStatus::Active,
            "Completed" => ItemStatus::Completed,
            "Cancelled" => ItemStatus::Cancelled,
            _ => ItemStatus::Scheduled,
        }
    }

    pub fn is_terminal(&self) -> bool {
        matches!(self, ItemStatus::Completed | ItemStatus::Cancelled)
    }
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
pub enum Priority {
    P1,
    P2,
    P3,
    P4,
}

impl Priority {
    pub fn as_str(&self) -> &'static str {
        match self {
            Priority::P1 => "P1",
            Priority::P2 => "P2",
            Priority::P3 => "P3",
            Priority::P4 => "P4",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "P1" => Priority::P1,
            "P2" => Priority::P2,
            "P3" => Priority::P3,
            _ => Priority::P4,
        }
    }

    pub fn label(&self) -> &'static str {
        match self {
            Priority::P1 => "P1 — Urgent",
            Priority::P2 => "P2 — High",
            Priority::P3 => "P3 — Medium",
            Priority::P4 => "P4 — Low",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
pub enum TaskType {
    Sequential,
    Parallel,
}

impl TaskType {
    pub fn as_str(&self) -> &'static str {
        match self {
            TaskType::Sequential => "Sequential",
            TaskType::Parallel => "Parallel",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "Parallel" => TaskType::Parallel,
            _ => TaskType::Sequential,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub owner_id: String,
    pub project_id: Option<String>,
    pub parent_id: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub task_type: TaskType,
    pub weight: f64,
    pub priority: Priority,
    pub effective_priority: Priority,
    pub status: ItemStatus,
    pub start_at: String,
    pub due_at: String,
    pub completed_at: Option<String>,
    pub sort_order: i32,
    pub progress: f64,
    pub completed_child_count: i32,
    pub total_child_count: i32,
    pub next_child_title: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub children: Vec<Task>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskPayload {
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
    pub task_type: String,
    pub weight: f64,
    pub priority: String,
    pub start_at: String,
    pub due_at: String,
    pub sort_order: i32,
}

#[derive(Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTaskPayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub weight: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub priority: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub due_at: Option<String>,
}
