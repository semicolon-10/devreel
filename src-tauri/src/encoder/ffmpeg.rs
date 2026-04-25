use tauri::AppHandle;
use std::process::Command;
use super::ExportConfig;

pub fn encode(_app: &AppHandle, config: ExportConfig) -> Result<String, String> {
    let output = config.output_path.clone();
    
    eprintln!("=== FFmpeg encode starting ===");
    eprintln!("Output path: {}", output);
    
    if output.is_empty() {
        return Err("Output path is empty".into());
    }

    let ffmpeg_path = find_ffmpeg()?;
    eprintln!("FFmpeg path: {}", ffmpeg_path);

    let args = vec![
        "-y".to_string(),
        "-f".to_string(), "avfoundation".to_string(),
        "-framerate".to_string(), "30".to_string(),
        "-pixel_format".to_string(), "uyvy422".to_string(),
        "-t".to_string(), "10".to_string(),
        "-i".to_string(), "2:0".to_string(),
        "-c:v".to_string(), "hevc_videotoolbox".to_string(),
        "-b:v".to_string(), "10M".to_string(),
        "-tag:v".to_string(), "hvc1".to_string(),
        "-c:a".to_string(), "aac".to_string(),
        "-b:a".to_string(), "192k".to_string(),
        "-movflags".to_string(), "+faststart".to_string(),
        output.clone(),
    ];

    eprintln!("FFmpeg args: {:?}", args);

    let output_result = Command::new(&ffmpeg_path)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to run ffmpeg: {}", e))?;

    eprintln!("FFmpeg stdout: {}", String::from_utf8_lossy(&output_result.stdout));
    eprintln!("FFmpeg stderr: {}", String::from_utf8_lossy(&output_result.stderr));
    eprintln!("FFmpeg exit: {}", output_result.status);

    if output_result.status.success() {
        Ok(output)
    } else {
        Err(format!(
            "FFmpeg failed: {}",
            String::from_utf8_lossy(&output_result.stderr)
        ))
    }
}

pub fn find_ffmpeg() -> Result<String, String> {
    let candidates = vec![
        "/opt/homebrew/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
        "ffmpeg",
    ];

    for path in candidates {
        if std::path::Path::new(path).exists() {
            return Ok(path.to_string());
        }
    }

    Err("FFmpeg not found. Install with: brew install ffmpeg".into())
}