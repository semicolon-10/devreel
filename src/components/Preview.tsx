import { useStore } from "@/store"
import CaptionOverlay from "@/components/CaptionOverlay"
import Whiteboard from "@/components/Whiteboard"
import CodeBlock from "@/components/CodeBlock"
import { useRecorderContext } from "@/context/RecorderContext"

function RecIndicator() {
  const { status, duration } = useStore()
  const mins = String(Math.floor(duration / 60)).padStart(2, "0")
  const secs = String(duration % 60).padStart(2, "0")
  if (status === "idle") return null
  return (
    <>
      <div style={{
        position: "absolute",
        top: 16,
        left: 16,
        display: "flex",
        alignItems: "center",
        gap: 6,
        zIndex: 30,
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: status === "paused" ? "var(--amber)" : "var(--red)",
          animation: status === "recording" ? "pulse 1.2s infinite" : "none",
        }} />
        <span style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.6)",
          letterSpacing: 1,
          textTransform: "uppercase",
          fontFamily: "monospace",
        }}>
          {status === "paused" ? "paused" : "rec"}
        </span>
      </div>
      <div style={{
        position: "absolute",
        top: 16,
        right: 16,
        fontSize: 11,
        color: "rgba(255,255,255,0.5)",
        fontFamily: "monospace",
        zIndex: 30,
      }}>
        {mins}:{secs}
      </div>
    </>
  )
}

export default function Preview() {
  const { phoneFrameRef } = useRecorderContext()

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
        background: "radial-gradient(ellipse at 40% 50%, rgba(139,92,246,0.05) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      <div
        ref={phoneFrameRef}
        style={{
          width: 360,
          height: 640,
          borderRadius: 36,
          border: "1.5px solid rgba(255,255,255,0.12)",
          background: "linear-gradient(180deg, #0d0d1a 0%, #0a0a12 100%)",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        <RecIndicator />
        <CodeBlock />
        <Whiteboard />
        <CaptionOverlay />
      </div>

      <div style={{
        position: "absolute",
        bottom: 20,
        right: 20,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}>
        {[
          { label: "resolution", value: "360 · 9:16" },
          { label: "fps", value: "30 fps" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "rgba(0,0,0,0.5)",
            border: "0.5px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "5px 10px",
            backdropFilter: "blur(8px)",
          }}>
            <div className="label" style={{ marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-primary)" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}