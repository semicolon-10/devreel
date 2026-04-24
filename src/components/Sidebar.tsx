import { useStore } from "@/store"

type Tool = "cursor" | "draw" | "text" | "shape" | "code" | "caption"

const tools: { id: Tool; label: string; icon: string }[] = [
  { id: "cursor", label: "Cursor", icon: "⌖" },
  { id: "draw", label: "Draw", icon: "✏" },
  { id: "text", label: "Text", icon: "T" },
  { id: "shape", label: "Shape", icon: "◻" },
  { id: "code", label: "Code", icon: "</>" },
  { id: "caption", label: "Caption", icon: "CC" },
]

export default function Sidebar() {
  const { tool, setTool } = useStore()

  return (
    <div style={{
      width: "var(--sidebar-w)",
      background: "var(--bg-surface)",
      borderRight: "0.5px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "12px 0",
      gap: "4px",
      zIndex: 10,
    }}>
      {tools.map((t, i) => (
        <>
          {i === 4 && (
            <div key="div" style={{
              width: "28px",
              height: "0.5px",
              background: "var(--border)",
              margin: "6px 0",
            }} />
          )}
          <button
            key={t.id}
            className={`icon-btn ${tool === t.id ? "active" : ""}`}
            title={t.label}
            onClick={() => setTool(t.id)}
            style={{
              width: "36px",
              height: "36px",
              fontSize: t.id === "code" ? "9px" : "14px",
              fontWeight: "600",
              color: tool === t.id ? "var(--accent-light)" : "var(--text-secondary)",
            }}
          >
            {t.icon}
          </button>
        </>
      ))}
    </div>
  )
}