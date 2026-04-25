mod recorder;
mod caption;
mod encoder;

#[tauri::command]
fn save_and_encode(data: Vec<u8>, output_path: String) -> Result<String, String> {
    use std::io::Write;

    if output_path.is_empty() {
        return Err("Output path is empty".into());
    }

    let webm_path = format!("{}.webm", output_path.trim_end_matches(".mp4"));
    let mut file = std::fs::File::create(&webm_path)
        .map_err(|e| e.to_string())?;
    file.write_all(&data).map_err(|e| e.to_string())?;

    eprintln!("Saved webm to: {}", webm_path);

    let ffmpeg = encoder::ffmpeg::find_ffmpeg()?;

    let status = std::process::Command::new(&ffmpeg)
        .args([
            "-y",
            "-i", &webm_path,
            "-c:v", "hevc_videotoolbox",
            "-b:v", "10M",
            "-tag:v", "hvc1",
            "-c:a", "aac",
            "-b:a", "192k",
            "-movflags", "+faststart",
            &output_path,
        ])
        .status()
        .map_err(|e| e.to_string())?;

    std::fs::remove_file(&webm_path).ok();

    if status.success() {
        Ok(output_path)
    } else {
        Err("FFmpeg encoding failed".into())
    }
}

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
            save_and_encode,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}