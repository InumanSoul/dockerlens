use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    /// Storage limit in GB. Warn/act when total unused images exceed this.
    pub limit_gb: f64,
    /// Whether to automatically clean when limit is hit (vs just notify).
    pub auto_clean: bool,
    /// How often to poll Docker in seconds.
    pub poll_interval_secs: u64,
    /// Whether the user has been notified about the current breach
    /// (reset when usage drops below threshold).
    pub breach_notified: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            limit_gb: 5.0,
            auto_clean: false,
            poll_interval_secs: 60,
            breach_notified: false,
        }
    }
}
