import { useEffect, useRef } from "react"
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { useStore } from "@/store"

const TRACKS = [
  { label: "video", color: "rgba(139,92,246,0.35)", width: "70%" },
  { label: "captions", color: "rgba(250,204,21,0.3)", segments: ["4%", "28%", "50%"] },
  { label: "drawing", color: "rgba(249,115,22,0.35)", offset: "30%", width: "22%" },
  { label: "code", color: "rgba(52,211,153,0.25)", width: "60%" },
]

function TrackRow({ label, color, width, offset, segments }: {
  label: string
  color: string
  width?: string
  offset?: string
  segments?: string[]
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
        {segments ? segments.map((s, i) => (
          <div key={i} style={{
            position: "absolute",
            top: 0,
            left: s,
            width: "16%",
            height: "100%",
            background: color,
            borderRadius: 3,
          }} />
        )) : (
          <div style={{
            position: "absolute",
            top: 0,
            left: offset ?? 0,
            width: width ?? "100%",
            height: "100%",
            background: color,
            borderRadius: 3,
          }} />
        )}
        <div style={{
          position: "absolute",
          top: -3,
          bottom: -3,
          left: "38%",
          width: 1.5,
          background: "var(--accent-light)",
        }} />
      </div>
    </div>
  )
}

export default function Timeline() {
  const { status, duration, setStatus, setDuration } = useStore()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const unlistenRef = useRef<(() => void)[]>([])

  const mins = String(Math.floor(duration / 60)).padStart(2, "0")
  const secs = String(duration % 60).padStart(2, "0")

  useEffect(() => {
    async function setupListeners() {
      const unlistenDuration = await listen<number>("duration_tick", (e) => {
        setDuration(e.payload)
      })

      const unlistenStatus = await listen<string>("recording_status", (e) => {
        setStatus(e.payload as "idle" | "recording" | "paused")
      })

      const unlistenError = await listen<string>("recording_error", (e) => {
        console.error("Recording error:", e.payload)
      })

      unlistenRef.current = [unlistenDuration, unlistenStatus, unlistenError]
    }

    setupListeners()

    return () => {
      unlistenRef.current.forEach((u) => u())
    }
  }, [])

  async function handleRecord() {
    try {
      if (status === "idle") {
        const outputPath = `${Date.now()}_devreel.mp4`
        await invoke("start_recording", { outputPath })
        await invoke("start_caption_stream")
      } else if (status === "recording" || status === "paused") {
        await invoke("pause_recording")
      }
    } catch (e) {
      console.error("Record error:", e)
    }
  }

  async function handleStop() {
    try {
      await invoke("stop_recording")
      await invoke("stop_caption_stream")
      setDuration(0)
    } catch (e) {
      console.error("Stop error:", e)
    }
  }

  async function handleExport() {
    try {
      await invoke("export_reel", {
        config: {
          input_path: "",
          output_path: `${Date.now()}_devreel_export.mp4`,
          width: 7680,
          height: 4320,
          fps: 60,
          quality: "Ultra",
        }
      })
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
          style={{
            background: status === "recording" ? "rgba(239,68,68,0.15)" : "var(--bg-elevated)",
            borderColor: status === "recording" ? "rgba(239,68,68,0.3)" : "var(--border)",
            width: 28,
            height: 28,
          }}
        >
          {status === "recording" ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="1" y="1" width="3" height="8" rx="0.5" fill="rgba(255,255,255,0.7)"/>
              <rect x="6" y="1" width="3" height="8" rx="0.5" fill="rgba(255,255,255,0.7)"/>
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <circle cx="5" cy="5" r="4" fill="var(--red)"/>
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
            <rect x="1" y="1" width="8" height="8" rx="1" fill="rgba(255,255,255,0.6)"/>
          </svg>
        </button>

        <span className="mono" style={{
          fontSize: 11,
          color: "var(--text-secondary)",
          marginLeft: 4,
        }}>
          {mins}:{secs}
        </span>

        <button
          className="btn btn-accent"
          onClick={handleExport}
          style={{ marginLeft: "auto", fontSize: 11, padding: "4px 14px" }}
        >
          Export 8K ↗
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
          <TrackRow key={t.label} {...t} />
        ))}
      </div>
    </div>
  )
}