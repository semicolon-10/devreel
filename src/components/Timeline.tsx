"use client"

import { useStore } from "@/store"
import { useRecorder } from "@/hooks/useRecorder"
import { useFFmpeg } from "@/hooks/useFFmpeg"

const TRACKS = [
  { label: "video", color: "rgba(139,92,246,0.35)" },
  { label: "captions", color: "rgba(250,204,21,0.3)" },
  { label: "drawing", color: "rgba(249,115,22,0.35)" },
  { label: "code", color: "rgba(52,211,153,0.25)" },
]

function TrackRow({ label, color, progress }: {
  label: string
  color: string
  progress: number
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, height: 16 }}>
      <div className="label" style={{ width: 44, textAlign: "right" }}>{label}</div>
      <div style={{
        flex: 1,
        height: 10,
        background: "rgba(255,255,255,0.03)",
        borderRadius: 3,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${progress}%`,
          height: "100%",
          background: color,
          borderRadius: 3,
          transition: "width 1s linear",
        }} />
        <div style={{
          position: "absolute",
          top: -3,
          bottom: -3,
          left: `${Math.min(progress, 99)}%`,
          width: 1.5,
          background: "var(--accent-light)",
          transition: "left 1s linear",
          opacity: progress > 0 ? 1 : 0,
        }} />
      </div>
    </div>
  )
}

export default function Timeline() {
  const { status, duration, hasRecording, recordingBlob } = useStore()
  const { startRecording, pauseRecording, stopRecording } = useRecorder()
  const { exportVideo, ffmpegLoaded } = useFFmpeg()

  const maxDuration = 60
  const progress = Math.min((duration / maxDuration) * 100, 100)
  const isRecording = status === "recording"
  const isPaused = status === "paused"

  const mins = String(Math.floor(duration / 60)).padStart(2, "0")
  const secs = String(duration % 60).padStart(2, "0")

  async function handleRecord() {
    try {
      if (status === "idle") await startRecording()
      else pauseRecording()
    } catch (e) {
      console.error("Record error:", e)
    }
  }

  async function handleStop() {
    try {
      await stopRecording()
    } catch (e) {
      console.error("Stop error:", e)
    }
  }

  async function handleExport() {
    if (!recordingBlob || !ffmpegLoaded) return
    try {
      const mp4 = await exportVideo(recordingBlob)
      const url = URL.createObjectURL(mp4)
      const a = document.createElement("a")
      a.href = url
      a.download = `devreel_${Date.now()}.mp4`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error("Export error:", e)
    }
  }

  return (
    <div style={{
      height: "var(--timeline-h)",
      background: "#0a0a0c",
      borderTop: "0.5px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "6px 14px",
        gap: 8,
        borderBottom: "0.5px solid rgba(255,255,255,0.04)",
        height: "var(--transport-h)",
      }}>
        <button
          className="icon-btn"
          onClick={handleRecord}
          disabled={hasRecording && status === "idle"}
          style={{
            background: isRecording ? "rgba(239,68,68,0.15)" : "var(--bg-elevated)",
            borderColor: isRecording ? "rgba(239,68,68,0.3)" : "var(--border)",
            width: 28,
            height: 28,
            opacity: hasRecording && status === "idle" ? 0.3 : 1,
          }}
        >
          {isRecording ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="1" y="1" width="3" height="8" rx="0.5" fill="rgba(255,255,255,0.7)" />
              <rect x="6" y="1" width="3" height="8" rx="0.5" fill="rgba(255,255,255,0.7)" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <circle cx="5" cy="5" r="4" fill="var(--red)" />
            </svg>
          )}
        </button>

        <button
          className="icon-btn"
          onClick={handleStop}
          disabled={status === "idle"}
          style={{
            width: 28,
            height: 28,
            opacity: status === "idle" ? 0.3 : 1,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect x="1" y="1" width="8" height="8" rx="1" fill="rgba(255,255,255,0.6)" />
          </svg>
        </button>

        <span className="mono" style={{
          fontSize: 11,
          color: isRecording ? "var(--red)" : "var(--text-secondary)",
          marginLeft: 4,
          animation: isRecording ? "pulse 1.2s infinite" : "none",
        }}>
          {mins}:{secs}
        </span>

        {isPaused && (
          <span style={{ fontSize: 9, color: "var(--amber)", letterSpacing: 1 }}>
            PAUSED
          </span>
        )}

        {hasRecording && status === "idle" && (
          <span style={{ fontSize: 9, color: "var(--green)" }}>
            ● ready
          </span>
        )}

        <button
          className="btn btn-accent"
          onClick={handleExport}
          disabled={!hasRecording || !ffmpegLoaded}
          style={{
            marginLeft: "auto",
            fontSize: 11,
            padding: "4px 14px",
          }}
        >
          Export MP4 ↗
        </button>
      </div>

      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 5,
        padding: "0 14px",
      }}>
        {TRACKS.map((t) => (
          <TrackRow
            key={t.label}
            label={t.label}
            color={t.color}
            progress={isRecording || isPaused || hasRecording ? progress : 0}
          />
        ))}
      </div>
    </div>
  )
}