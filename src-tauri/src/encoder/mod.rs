use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

pub mod ffmpeg;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportConfig {
    pub input_path: String,
    pub output_path: String,
    pub width: u32,
    pub height: u32,
    pub fps: u32,
    pub quality: ExportQuality,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExportQuality {
    Draft,
    High,
    Ultra,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportProgress {
    pub percent: f32,
    pub stage: String,
    pub eta_secs: u32,
}

#[tauri::command]
pub fn export_reel(app: AppHandle, config: ExportConfig) -> Result<String, String> {
    if config.output_path.is_empty() {
        return Err("Output path is empty".into());
    }

    eprintln!("export_reel called with path: {}", config.output_path);

    let app_clone = app.clone();

    std::thread::spawn(move || {
        let stages = vec![
            (10.0, "Preparing frames"),
            (30.0, "Compositing overlays"),
            (60.0, "Encoding video"),
            (85.0, "Muxing audio"),
            (100.0, "Finalizing"),
        ];

        for (percent, stage) in &stages {
            let _ = app_clone.emit("export_progress", ExportProgress {
                percent: *percent,
                stage: stage.to_string(),
                eta_secs: ((100.0 - percent) / 10.0) as u32,
            });
            std::thread::sleep(std::time::Duration::from_millis(300));
        }

        match ffmpeg::encode(&app_clone, config) {
            Ok(path) => {
                let _ = app_clone.emit("export_complete", path);
            }
            Err(e) => {
                eprintln!("Export error: {}", e);
                let _ = app_clone.emit("export_error", e);
            }
        }
    });

    Ok("export_started".into())
}