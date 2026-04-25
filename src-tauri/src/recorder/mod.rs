pub mod screen;
pub mod audio;

use std::sync::{Arc, Mutex};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RecordingStatus {
    Idle,
    Recording,
    Paused,
}

pub struct RecordingState {
    pub status: RecordingStatus,
    pub duration_secs: u64,
    pub output_path: Option<String>,
}

impl RecordingState {
    pub fn new() -> Self {
        Self {
            status: RecordingStatus::Idle,
            duration_secs: 0,
            output_path: None,
        }
    }
}

pub type SharedState = Arc<Mutex<RecordingState>>;

static RECORDING_STATE: once_cell::sync::Lazy<SharedState> =
    once_cell::sync::Lazy::new(|| Arc::new(Mutex::new(RecordingState::new())));

pub fn init(app: AppHandle) {
    let state = RECORDING_STATE.clone();
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(std::time::Duration::from_secs(1));
            let mut s = state.lock().unwrap();
            if s.status == RecordingStatus::Recording {
                s.duration_secs += 1;
                let _ = app.emit("duration_tick", s.duration_secs);
            }
        }
    });
}

#[tauri::command]
pub fn start_recording(app: AppHandle, output_path: String) -> Result<(), String> {
    let mut state = RECORDING_STATE.lock().map_err(|e| e.to_string())?;
    if state.status == RecordingStatus::Recording {
        return Err("Already recording".into());
    }
    state.status = RecordingStatus::Recording;
    state.output_path = Some(output_path.clone());
    state.duration_secs = 0;

    let app_clone = app.clone();
    std::thread::spawn(move || {
        if let Err(e) = screen::start_capture(output_path) {
            let _ = app_clone.emit("recording_error", e);
        }
    });

    let app_clone = app.clone();
    std::thread::spawn(move || {
        if let Err(e) = audio::start_capture() {
            let _ = app_clone.emit("recording_error", e);
        }
    });

    let _ = app.emit("recording_status", "recording");
    Ok(())
}

#[tauri::command]
pub fn pause_recording(app: AppHandle) -> Result<(), String> {
    let mut state = RECORDING_STATE.lock().map_err(|e| e.to_string())?;
    match state.status {
        RecordingStatus::Recording => {
            state.status = RecordingStatus::Paused;
            screen::pause_capture();
            audio::pause_capture();
            let _ = app.emit("recording_status", "paused");
            Ok(())
        }
        RecordingStatus::Paused => {
            state.status = RecordingStatus::Recording;
            screen::resume_capture();
            audio::resume_capture();
            let _ = app.emit("recording_status", "recording");
            Ok(())
        }
        _ => Err("Not recording".into()),
    }
}

#[tauri::command]
pub fn stop_recording(app: AppHandle) -> Result<String, String> {
    let mut state = RECORDING_STATE.lock().map_err(|e| e.to_string())?;
    if state.status == RecordingStatus::Idle {
        return Err("Not recording".into());
    }
    state.status = RecordingStatus::Idle;
    let path = state.output_path.clone().unwrap_or_default();
    state.duration_secs = 0;

    screen::stop_capture();
    audio::stop_capture();

    let _ = app.emit("recording_status", "idle");
    let _ = app.emit("recording_stopped", path.clone());
    Ok(path)
}

#[tauri::command]
pub fn get_recording_status() -> String {
    let state = RECORDING_STATE.lock().unwrap();
    match state.status {
        RecordingStatus::Idle => "idle".into(),
        RecordingStatus::Recording => "recording".into(),
        RecordingStatus::Paused => "paused".into(),
    }
}