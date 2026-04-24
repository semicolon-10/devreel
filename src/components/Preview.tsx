import { useStore } from "@/store"
import CaptionOverlay from "@/components/CaptionOverlay"
import Whiteboard from "@/components/Whiteboard"
import CodeBlock from "@/components/CodeBlock"

function RecIndicator() {
  const { status, duration } = useStore()

  const mins = String(Math.floor(duration / 60)).padStart(2, "0")
  const secs = String(duration % 60).padStart(2, "0")

  if (status === "idle") return null

  return (
    <>
      <div style={{
        position: "absolute",
        top: 12,
        left: 12,
        display: "flex",
        alignItems: "center",
        gap: 5,
        zIndex: 10,
      }}>
        <div style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: status === "paused" ? "var(--amber)" : "var(--red)",
          animation: status === "recording" ? "pulse 1.2s infinite" : "none",
        }} />
        <span style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: 1,
          textTransform: "uppercase",
          fontFamily: "monospace",
        }}>
          {status === "paused" ? "paused" : "rec"}
        </span>
      </div>
      <div style={{
        position: "absolute",
        top: 12,
        right: 12,
        fontSize: 9,
        color: "rgba(255,255,255,0.4)",
        fontFamily: "monospace",
        zIndex: 10,
      }}>
        {mins}:{secs}
      </div>
    </>
  )
}

function StatsPanel() {
  const { status } = useStore()

  return (
    <div style={{
      position: "absolute",
      right: 16,
      top: "50%",
      transform: "translateY(-50%)",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}>
      {[
        { label: "resolution", value: "8K · 9:16" },
        { label: "fps", value: "60 fps" },
        { label: "whisper", value: status === "recording" ? "● live" : "○ off", accent: status === "recording" },
      ].map((s) => (
        <div key={s.label} style={{
          background: s.accent ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
          border: `0.5px solid ${s.accent ? "rgba(239,68,68,0.2)" : "var(--border)"}`,
          borderRadius: "var(--radius-md)",
          padding: "6px 10px",
          minWidth: 76,
        }}>
          <div className="label" style={{ marginBottom: 3 }}>{s.label}</div>
          <div style={{
            fontSize: 10,
            fontFamily: "monospace",
            color: s.accent ? "rgba(239,68,68,0.8)" : "var(--text-primary)",
          }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Preview() {
  const { tool } = useStore()

  return (
    <div style={{
      flex: 1,
      background: "#080809",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at 30% 50%, rgba(139,92,246,0.04) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: 200,
        height: 356,
        background: "var(--bg-base)",
        borderRadius: 10,
        border: "0.5px solid rgba(255,255,255,0.1)",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #0d0d1a 0%, #0a0a12 100%)",
        }} />

        <RecIndicator />

        <CodeBlock />

        <Whiteboard />

        <CaptionOverlay />
      </div>

      <StatsPanel />
    </div>
  )
}