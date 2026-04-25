use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

static CAPTURING: AtomicBool = AtomicBool::new(false);
static PAUSED: AtomicBool = AtomicBool::new(false);

pub fn start_capture(output_path: String) -> Result<(), String> {
    CAPTURING.store(true, Ordering::SeqCst);
    PAUSED.store(false, Ordering::SeqCst);

    let capturing = Arc::new(&CAPTURING);
    let paused = Arc::new(&PAUSED);

    while CAPTURING.load(Ordering::SeqCst) {
        if PAUSED.load(Ordering::SeqCst) {
            std::thread::sleep(std::time::Duration::from_millis(100));
            continue;
        }

        capture_frame(&output_path)?;
        std::thread::sleep(std::time::Duration::from_millis(16));
    }

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
    PAUSED.store(false, Ordering::SeqCst);
}

fn capture_frame(_output_path: &str) -> Result<(), String> {
    Ok(())
}