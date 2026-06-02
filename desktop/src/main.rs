mod api;
mod config;
mod error;
mod models;

use std::{
    collections::HashSet,
    rc::Rc,
    sync::{Arc, Mutex},
};

use chrono::Local;
use slint::{ModelRc, SharedString, VecModel};

use api::ApiClient;
use config::Config;
use models::{project::Project, task::Task};

slint::include_modules!();

// ── App state (lives on the heap, shared via Arc<Mutex>) ──────────────────────

struct AppState {
    config: Config,
    client: ApiClient,
    tasks: Vec<Task>,
    projects: Vec<Project>,
    expanded: HashSet<String>,
    current_project_id: Option<String>,
}

impl AppState {
    fn new(config: Config) -> Self {
        let client = ApiClient::new(
            config.server_url.clone(),
            config.token.clone(),
        );
        Self {
            config,
            client,
            tasks: vec![],
            projects: vec![],
            expanded: HashSet::new(),
            current_project_id: None,
        }
    }

    fn update_client_base_url(&mut self, url: String) {
        self.config.server_url = url.clone();
        self.client = ApiClient::new(url, self.config.token.clone());
    }

    fn set_token(&mut self, token: Option<String>) {
        self.config.token = token.clone();
        self.client.set_token(token);
    }
}

// ── Slint model conversion ────────────────────────────────────────────────────

fn due_display(iso: &str) -> String {
    use chrono::DateTime;
    let Ok(dt) = DateTime::parse_from_rfc3339(iso) else {
        return String::new();
    };
    dt.format("%b %-d · %H:%M").to_string()
}

fn task_to_slint(task: &Task, depth: i32, is_expanded: bool) -> TaskData {
    TaskData {
        id: task.id.clone().into(),
        title: task.title.clone().into(),
        description: task.description.clone().unwrap_or_default().into(),
        status: task.status.as_str().into(),
        priority: task.priority.as_str().into(),
        task_type: task.task_type.as_str().into(),
        progress: task.progress as f32,
        due_at: due_display(&task.due_at).into(),
        start_at: task.start_at.clone().into(),
        has_children: !task.children.is_empty(),
        child_count: task.total_child_count,
        completed_child_count: task.completed_child_count,
        next_child_title: task.next_child_title.clone().unwrap_or_default().into(),
        depth,
        is_expanded,
        weight: task.weight as f32,
        project_id: task.project_id.clone().unwrap_or_default().into(),
    }
}

fn flatten_tasks<'a>(
    tasks: &'a [Task],
    expanded: &HashSet<String>,
    depth: i32,
    out: &mut Vec<TaskData>,
) {
    for task in tasks {
        let is_exp = expanded.contains(&task.id);
        out.push(task_to_slint(task, depth, is_exp));
        if is_exp {
            flatten_tasks(&task.children, expanded, depth + 1, out);
        }
    }
}

fn build_task_model(state: &AppState) -> ModelRc<TaskData> {
    let mut items: Vec<TaskData> = Vec::new();
    flatten_tasks(&state.tasks, &state.expanded, 0, &mut items);
    ModelRc::new(Rc::new(VecModel::from(items)))
}

fn build_project_model(projects: &[Project]) -> ModelRc<ProjectData> {
    let items: Vec<ProjectData> = projects
        .iter()
        .map(|p| ProjectData {
            id: p.id.clone().into(),
            name: p.name.clone().into(),
            color: p.color.clone().into(),
        })
        .collect();
    ModelRc::new(Rc::new(VecModel::from(items)))
}

fn find_task_by_id<'a>(tasks: &'a [Task], id: &str) -> Option<&'a Task> {
    for task in tasks {
        if task.id == id {
            return Some(task);
        }
        if let Some(found) = find_task_by_id(&task.children, id) {
            return Some(found);
        }
    }
    None
}

fn replace_task_in_vec(tasks: &mut Vec<Task>, updated: Task) -> bool {
    for task in tasks.iter_mut() {
        if task.id == updated.id {
            *task = updated;
            return true;
        }
        if replace_task_in_vec(&mut task.children, updated.clone()) {
            return true;
        }
    }
    false
}

fn remove_task_from_vec(tasks: &mut Vec<Task>, id: &str) -> bool {
    if let Some(pos) = tasks.iter().position(|t| t.id == id) {
        tasks.remove(pos);
        return true;
    }
    for task in tasks.iter_mut() {
        if remove_task_from_vec(&mut task.children, id) {
            return true;
        }
    }
    false
}

fn default_start_at() -> String {
    Local::now().format("%Y-%m-%dT09:00:00").to_string()
}

fn default_due_at() -> String {
    Local::now().format("%Y-%m-%dT17:00:00").to_string()
}

// ── Main ──────────────────────────────────────────────────────────────────────

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = Config::load();
    let is_authed = config.token.is_some();
    let display_name = config.display_name.clone().unwrap_or_default();
    let server_url = config.server_url.clone();

    let state: Arc<Mutex<AppState>> = Arc::new(Mutex::new(AppState::new(config)));

    let window = AppWindow::new()?;

    // Set initial property values
    window.set_server_url(server_url.into());
    window.set_display_name(display_name.into());
    if is_authed {
        window.set_current_page("today".into());
    }

    // ── login-submit ──────────────────────────────────────────────
    {
        let state = state.clone();
        let ww = window.as_weak();
        window.on_login_submit(move |server_url, email, password| {
            let state = state.clone();
            let ww = ww.clone();
            let _ = ww.upgrade_in_event_loop(|w| {
                w.set_auth_loading(true);
                w.set_auth_error("".into());
            });
            tokio::spawn(async move {
                {
                    let mut st = state.lock().unwrap();
                    st.update_client_base_url(server_url.to_string());
                }
                let client = state.lock().unwrap().client.clone();
                let result = api::auth::login(&client, &email, &password).await;
                let _ = ww.upgrade_in_event_loop(move |w| {
                    w.set_auth_loading(false);
                    match result {
                        Ok(user) => {
                            let mut st = state.lock().unwrap();
                            st.set_token(Some(user.access_token.clone()));
                            st.config.display_name = Some(user.display_name.clone());
                            st.config.save().ok();
                            w.set_display_name(user.display_name.into());
                            w.set_current_page("today".into());
                            w.set_auth_error("".into());
                            // Trigger initial data fetch
                            w.invoke_navigate("today".into());
                        }
                        Err(e) => {
                            w.set_auth_error(e.to_string().into());
                        }
                    }
                });
            });
        });
    }

    // ── logout ────────────────────────────────────────────────────
    {
        let state = state.clone();
        let ww = window.as_weak();
        window.on_logout(move || {
            let mut st = state.lock().unwrap();
            st.set_token(None);
            st.config.clear_auth();
            st.config.save().ok();
            st.tasks.clear();
            st.projects.clear();
            st.expanded.clear();
            let _ = ww.upgrade_in_event_loop(|w| {
                w.set_current_page("login".into());
                w.set_display_name("".into());
                w.set_tasks(ModelRc::default());
                w.set_projects(ModelRc::default());
            });
        });
    }

    // ── navigate ──────────────────────────────────────────────────
    {
        let state = state.clone();
        let ww = window.as_weak();
        window.on_navigate(move |page| {
            let state = state.clone();
            let ww = ww.clone();
            let page_str = page.to_string();

            // Update active page immediately
            let _ = ww.upgrade_in_event_loop({
                let page_str = page_str.clone();
                move |w| {
                    w.set_current_page(page_str.clone().into());
                    w.set_tasks_loading(true);
                }
            });

            tokio::spawn(async move {
                let (client, project_id) = {
                    let mut st = state.lock().unwrap();
                    let proj_id = if page_str.starts_with("project:") {
                        let id = page_str.trim_start_matches("project:").to_string();
                        st.current_project_id = Some(id.clone());
                        Some(id)
                    } else {
                        st.current_project_id = None;
                        None
                    };
                    (st.client.clone(), proj_id)
                };

                // Fetch tasks
                let tasks_result = if let Some(proj_id) = &project_id {
                    api::tasks::get_project_tasks(&client, proj_id).await
                } else {
                    let view = page_str
                        .trim_start_matches("project:")
                        .to_lowercase();
                    api::tasks::get_tasks(&client, &view).await
                };

                // Fetch projects (always refresh sidebar)
                let projects_result = api::projects::get_projects(&client).await;

                let _ = ww.upgrade_in_event_loop(move |w| {
                    w.set_tasks_loading(false);

                    if let Ok(proj_list) = projects_result {
                        let mut st = state.lock().unwrap();
                        st.projects = proj_list;
                        let model = build_project_model(&st.projects);
                        w.set_projects(model);
                    }

                    match tasks_result {
                        Ok(task_list) => {
                            let mut st = state.lock().unwrap();
                            st.tasks = task_list;
                            let model = build_task_model(&st);
                            w.set_tasks(model);
                        }
                        Err(e) => {
                            eprintln!("Failed to load tasks: {e}");
                        }
                    }
                });
            });
        });
    }

    // ── tick-task ─────────────────────────────────────────────────
    {
        let state = state.clone();
        let ww = window.as_weak();
        window.on_tick_task(move |id| {
            let state = state.clone();
            let ww = ww.clone();
            let id_str = id.to_string();
            tokio::spawn(async move {
                let client = state.lock().unwrap().client.clone();
                let result = api::tasks::tick_task(&client, &id_str).await;
                let _ = ww.upgrade_in_event_loop(move |w| {
                    if let Ok(updated) = result {
                        let mut st = state.lock().unwrap();
                        replace_task_in_vec(&mut st.tasks, updated);
                        let model = build_task_model(&st);
                        w.set_tasks(model);
                    }
                });
            });
        });
    }

    // ── toggle-expand ─────────────────────────────────────────────
    {
        let state = state.clone();
        let ww = window.as_weak();
        window.on_toggle_expand(move |id| {
            let id_str = id.to_string();
            let mut st = state.lock().unwrap();
            if st.expanded.contains(&id_str) {
                st.expanded.remove(&id_str);
            } else {
                st.expanded.insert(id_str);
            }
            let model = build_task_model(&st);
            let _ = ww.upgrade_in_event_loop(move |w| {
                w.set_tasks(model);
            });
        });
    }

    // ── open-detail ───────────────────────────────────────────────
    {
        let state = state.clone();
        let ww = window.as_weak();
        window.on_open_detail(move |id| {
            let st = state.lock().unwrap();
            if let Some(task) = find_task_by_id(&st.tasks, &id) {
                let td = task_to_slint(task, 0, false);
                let _ = ww.upgrade_in_event_loop(move |w| {
                    w.set_detail_task(td);
                    w.set_detail_error("".into());
                    w.set_detail_open(true);
                });
            }
        });
    }

    // ── close-detail ──────────────────────────────────────────────
    {
        let ww = window.as_weak();
        window.on_close_detail(move || {
            let _ = ww.upgrade_in_event_loop(|w| {
                w.set_detail_open(false);
                w.set_detail_error("".into());
            });
        });
    }

    // ── save-task ─────────────────────────────────────────────────
    {
        let state = state.clone();
        let ww = window.as_weak();
        window.on_save_task(
            move |id, title, desc, priority, status, task_type, start_at, due_at| {
                let state = state.clone();
                let ww = ww.clone();
                let _ = ww.upgrade_in_event_loop(|w| w.set_detail_saving(true));
                tokio::spawn(async move {
                    let client = state.lock().unwrap().client.clone();
                    let payload = models::task::UpdateTaskPayload {
                        title: Some(title.to_string()),
                        description: Some(desc.to_string()),
                        priority: Some(priority.to_string()),
                        status: Some(status.to_string()),
                        task_type: Some(task_type.to_string()),
                        start_at: Some(start_at.to_string()),
                        due_at: Some(due_at.to_string()),
                        ..Default::default()
                    };
                    let result = api::tasks::update_task(&client, &id, payload).await;
                    let _ = ww.upgrade_in_event_loop(move |w| {
                        w.set_detail_saving(false);
                        match result {
                            Ok(updated) => {
                                let mut st = state.lock().unwrap();
                                replace_task_in_vec(&mut st.tasks, updated);
                                let model = build_task_model(&st);
                                w.set_tasks(model);
                                w.set_detail_open(false);
                            }
                            Err(e) => {
                                w.set_detail_error(e.to_string().into());
                            }
                        }
                    });
                });
            },
        );
    }

    // ── open-add-task ─────────────────────────────────────────────
    {
        let ww = window.as_weak();
        window.on_open_add_task(move |project_id, _parent_id| {
            let _ = ww.upgrade_in_event_loop(move |w| {
                w.set_add_project_id(project_id);
                w.set_add_error("".into());
                w.set_add_open(true);
            });
        });
    }

    // ── close-add-task ────────────────────────────────────────────
    {
        let ww = window.as_weak();
        window.on_close_add_task(move || {
            let _ = ww.upgrade_in_event_loop(|w| {
                w.set_add_open(false);
                w.set_add_error("".into());
            });
        });
    }

    // ── submit-add-task ───────────────────────────────────────────
    {
        let state = state.clone();
        let ww = window.as_weak();
        window.on_submit_add_task(
            move |title, desc, project_id, parent_id, priority, task_type, start_at, due_at| {
                let state = state.clone();
                let ww = ww.clone();
                let _ = ww.upgrade_in_event_loop(|w| w.set_add_saving(true));
                tokio::spawn(async move {
                    let client = state.lock().unwrap().client.clone();
                    let now_tasks_len = state.lock().unwrap().tasks.len() as i32;
                    let payload = models::task::CreateTaskPayload {
                        title: title.to_string(),
                        description: {
                            let s = desc.to_string();
                            if s.is_empty() { None } else { Some(s) }
                        },
                        project_id: {
                            let s = project_id.to_string();
                            if s.is_empty() { None } else { Some(s) }
                        },
                        parent_id: {
                            let s = parent_id.to_string();
                            if s.is_empty() { None } else { Some(s) }
                        },
                        task_type: task_type.to_string(),
                        weight: 1.0,
                        priority: priority.to_string(),
                        start_at: {
                            let s = start_at.to_string();
                            if s.is_empty() { default_start_at() } else { s }
                        },
                        due_at: {
                            let s = due_at.to_string();
                            if s.is_empty() { default_due_at() } else { s }
                        },
                        sort_order: now_tasks_len,
                    };
                    let result = api::tasks::create_task(&client, payload).await;
                    let _ = ww.upgrade_in_event_loop(move |w| {
                        w.set_add_saving(false);
                        match result {
                            Ok(new_task) => {
                                let mut st = state.lock().unwrap();
                                if let Some(pid) = &new_task.parent_id.clone() {
                                    // insert as child
                                    fn insert_child(tasks: &mut Vec<Task>, parent_id: &str, child: Task) -> bool {
                                        for t in tasks.iter_mut() {
                                            if t.id == parent_id {
                                                t.children.push(child);
                                                return true;
                                            }
                                            if insert_child(&mut t.children, parent_id, child.clone()) {
                                                return true;
                                            }
                                        }
                                        false
                                    }
                                    insert_child(&mut st.tasks, pid, new_task);
                                } else {
                                    st.tasks.push(new_task);
                                }
                                let model = build_task_model(&st);
                                w.set_tasks(model);
                                w.set_add_open(false);
                            }
                            Err(e) => {
                                w.set_add_error(e.to_string().into());
                            }
                        }
                    });
                });
            },
        );
    }

    // ── Boot: if already authenticated, fetch initial data ────────
    if is_authed {
        window.invoke_navigate("today".into());
    }

    window.run()?;
    Ok(())
}
