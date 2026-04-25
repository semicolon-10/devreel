use std::sync::atomic::{AtomicBool, Ordering};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

static CAPTURING: AtomicBool = AtomicBool::new(false);
static PAUSED: AtomicBool = AtomicBool::new(false);

pub fn start_capture() -> Result<(), String> {
    CAPTURING.store(true, Ordering::SeqCst);
    PAUSED.store(false, Ordering::SeqCst);

    let host = cpal::default_host();

    let device = host
        .default_input_device()
        .ok_or("No input device found")?;

    let config = device
        .default_input_config()
        .map_err(|e| e.to_string())?;

    let stream = device
        .build_input_stream(
            &config.into(),
            move |data: &[f32], _: &cpal::InputCallbackInfo| {
                if PAUSED.load(Ordering::SeqCst) {
                    return;
                }
                process_audio_chunk(data);
            },
            move |err| {
                eprintln!("Audio stream error: {}", err);
            },
            None,
        )
        .map_err(|e| e.to_string())?;

    stream.play().map_err(|e| e.to_string())?;

    while CAPTURING.load(Ordering::SeqCst) {
        std::thread::sleep(std::time::Duration::from_millis(100));
    }

    drop(stream);
    Ok(())
}

pub fn pause_capture() {
    PAUSED.store(true, Ordering::SeqCst);
}

pub fn resume_capture() {
    PAUSED.store(false, Ordering::SeqCst);
}

pub fn stop_capture() {
    CAPTURING.store(false, Ordering::SeqCst);
}

fn process_audio_chunk(data: &[f32]) {
    let _ = data;
}