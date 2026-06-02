use serde::{Deserialize, Serialize};
use std::path::PathBuf;

const DEFAULT_SERVER_URL: &str = "http://localhost:5000/api/v1";
const APP_NAME: &str = "openplan";
const CONFIG_FILE: &str = "config.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub server_url: String,
    pub token: Option<String>,
    pub display_name: Option<String>,
    /// 0 = system, 1 = light, 2 = dark
    #[serde(default)]
    pub theme_mode: i32,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            server_url: DEFAULT_SERVER_URL.to_string(),
            token: None,
            display_name: None,
            theme_mode: 0,
        }
    }
}

impl Config {
    fn path() -> Option<PathBuf> {
        dirs::config_dir().map(|d| d.join(APP_NAME).join(CONFIG_FILE))
    }

    pub fn load() -> Self {
        let Some(path) = Self::path() else {
            return Self::default();
        };
        let Ok(data) = std::fs::read_to_string(&path) else {
            return Self::default();
        };
        serde_json::from_str(&data).unwrap_or_default()
    }

    pub fn save(&self) -> std::io::Result<()> {
        let Some(path) = Self::path() else {
            return Ok(());
        };
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let data = serde_json::to_string_pretty(self).expect("Config is always serializable");
        std::fs::write(path, data)
    }

    pub fn clear_auth(&mut self) {
        self.token = None;
        self.display_name = None;
    }
}
