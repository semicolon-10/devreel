mod recorder;
mod caption;
mod encoder;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let handle = app.handle().clone();
            recorder::init(handle);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            recorder::start_recording,
            recorder::pause_recording,
            recorder::stop_recording,
            recorder::get_recording_status,
            caption::start_caption_stream,
            caption::stop_caption_stream,
            encoder::export_reel,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}