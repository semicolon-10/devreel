"use client"

import { useState } from "react"
import { useStore } from "@/store"

const COLORS = ["#f97316", "#ef4444", "#a78bfa", "#10b981", "#facc15", "#fff"]

const TEMPLATES = [
  { id: "quick-tip", icon: "⚡", label: "Quick tip" },
  { id: "bug-fix", icon: "🐛", label: "Bug → Fix" },
  { id: "whiteboard", icon: "🖊", label: "Whiteboard" },
  { id: "live-code", icon: "💻", label: "Live code" },
] as const

type Tab = "caption" | "draw" | "templates"

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="label" style={{ marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  )
}

export default function SidePanel() {
  const [tab, setTab] = useState<Tab>("caption")
  const {
    captionStyle, setCaptionStyle,
    template, setTemplate,
    brushColor, setBrushColor,
    brushSize, setBrushSize,
    activeCaptions,
    ffmpegLoaded, ffmpegLoading,
    exportProgress, exportStage,
  } = useStore()

  return (
    <div style={{
      width: "var(--panel-w)",
      background: "var(--bg-surface)",
      borderLeft: "0.5px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      flexShrink: 0,
    }}>
      <div style={{
        display: "flex",
        borderBottom: "0.5px solid var(--border)",
        flexShrink: 0,
      }}>
        {(["caption", "draw", "templates"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "9px 4px",
              fontSize: 10,
              fontWeight: 500,
              textAlign: "center",
              textTransform: "capitalize",
              color: tab === t ? "var(--accent-light)" : "var(--text-muted)",
              borderBottom: tab === t ? "1.5px solid var(--accent-light)" : "1.5px solid transparent",
              transition: "color 0.15s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        {tab === "caption" && (
          <>
            <Section label="Style">
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {([
                  { id: "bold-yellow", label: "Bold yellow" },
                  { id: "white", label: "White" },
                  { id: "kinetic", label: "Kinetic" },
                ] as const).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setCaptionStyle(s.id)}
                    className="chip"
                    style={{
                      background: captionStyle === s.id
                        ? s.id === "bold-yellow" ? "rgba(250,204,21,0.12)" : "var(--accent-dim)"
                        : "rgba(255,255,255,0.04)",
                      color: captionStyle === s.id
                        ? s.id === "bold-yellow" ? "var(--caption-yellow)" : "var(--accent-light)"
                        : "var(--text-secondary)",
                      borderColor: captionStyle === s.id
                        ? s.id === "bold-yellow" ? "rgba(250,204,21,0.25)" : "var(--border-accent)"
                        : "var(--border)",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Section>

            <Section label="Live transcript">
              <div style={{
                background: "rgba(0,0,0,0.3)",
                borderRadius: 6,
                padding: 8,
                border: "0.5px solid var(--border)",
                minHeight: 64,
              }}>
                {activeCaptions.length > 0 ? (
                  activeCaptions.map((c) => (
                    <p key={c.id} style={{
                      fontSize: 9,
                      color: "var(--text-secondary)",
                      lineHeight: 1.6,
                    }}>
                      {c.text}
                    </p>
                  ))
                ) : (
                  <p style={{ fontSize: 9, color: "var(--text-muted)" }}>
                    Enable captions and start recording to see transcript...
                  </p>
                )}
              </div>
            </Section>
          </>
        )}

        {tab === "draw" && (
          <>
            <Section label="Color">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setBrushColor(c)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: c,
                      border: brushColor === c ? "2px solid white" : "2px solid transparent",
                      outline: brushColor === c ? "2px solid var(--accent)" : "none",
                      outlineOffset: 1,
                    }}
                  />
                ))}
              </div>
            </Section>

            <Section label="Brush size">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: 10, color: "var(--text-muted)", minWidth: 20 }}>
                  {brushSize}
                </span>
              </div>
            </Section>
          </>
        )}

        {tab === "templates" && (
          <Section label="Templates">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  style={{
                    background: template === t.id ? "var(--bg-active)" : "rgba(255,255,255,0.03)",
                    border: `0.5px solid ${template === t.id ? "var(--border-accent)" : "var(--border)"}`,
                    borderRadius: "var(--radius-md)",
                    padding: "8px 6px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{t.icon}</div>
                  <div style={{ fontSize: 9, color: "var(--text-secondary)" }}>{t.label}</div>
                </button>
              ))}
            </div>
          </Section>
        )}
      </div>

      <div style={{
        padding: 12,
        borderTop: "0.5px solid var(--border)",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 6,
        }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: ffmpegLoaded ? "var(--green)" : ffmpegLoading ? "var(--amber)" : "var(--red)",
          }} />
          <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
            FFmpeg {ffmpegLoaded ? "ready" : ffmpegLoading ? "loading..." : "not loaded"}
          </span>
        </div>

        {exportStage && exportStage !== "Done" && (
          <>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>
              {exportStage}
            </div>
            <div style={{
              height: 3,
              background: "var(--bg-elevated)",
              borderRadius: 2,
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${exportProgress}%`,
                background: "var(--accent)",
                borderRadius: 2,
                transition: "width 0.3s",
              }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}