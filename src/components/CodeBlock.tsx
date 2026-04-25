"use client"

import { useEffect, useState } from "react"
import { codeToHtml } from "shiki"
import { useStore } from "@/store"
import { Play, X, ChevronDown, ChevronUp, Terminal } from "lucide-react"

const DEFAULTS: Record<string, string> = {
  rust: `use std::fmt;

#[derive(Debug)]
struct Point {
    x: f64,
    y: f64,
}

impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

fn main() {
    let p = Point { x: 3.0, y: 4.0 };
    let dist = (p.x * p.x + p.y * p.y).sqrt();
    println!("Point: {}", p);
    println!("Distance: {:.2}", dist);
}`,
  python: `from dataclasses import dataclass
from math import sqrt

@dataclass
class Point:
    x: float
    y: float

    def distance(self) -> float:
        return sqrt(self.x ** 2 + self.y ** 2)

    def __str__(self) -> str:
        return f"({self.x}, {self.y})"

def main():
    p = Point(x=3.0, y=4.0)
    print(f"Point: {p}")
    print(f"Distance: {p.distance():.2f}")

if __name__ == "__main__":
    main()`,
}

const OUTPUTS: Record<string, string[]> = {
  rust: [
    "   Compiling devreel v0.1.0",
    "    Finished dev profile in 0.84s",
    "     Running `target/debug/devreel`",
    "Point: (3, 4)",
    "Distance: 5.00",
  ],
  python: [
    "Point: (3.0, 4.0)",
    "Distance: 5.00",
  ],
}

export default function CodeBlock() {
  const { showCode, codeLanguage, codeContent, setShowCode, setCodeContent } = useStore()
  const [html, setHtml] = useState("")
  const [editing, setEditing] = useState(false)
  const [showTerminal, setShowTerminal] = useState(false)
  const [terminalLines, setTerminalLines] = useState<string[]>([])
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (showCode && !codeContent) {
      setCodeContent(DEFAULTS[codeLanguage])
    }
  }, [showCode])

  useEffect(() => {
    if (!showCode) return
    setCodeContent(DEFAULTS[codeLanguage])
  }, [codeLanguage])

  useEffect(() => {
    if (!codeContent) return
    codeToHtml(codeContent, {
      lang: codeLanguage,
      theme: "catppuccin-mocha",
    }).then(setHtml)
  }, [codeContent, codeLanguage])

  function handleRun() {
    setShowTerminal(true)
    setRunning(true)
    setTerminalLines([])
    const lines = OUTPUTS[codeLanguage]
    lines.forEach((line, i) => {
      setTimeout(() => {
        setTerminalLines((prev) => [...prev, line])
        if (i === lines.length - 1) setRunning(false)
      }, i * 200)
    })
  }

  if (!showCode) return null

  const lines = codeContent.split("\n")

  return (
    <div style={{
      position: "absolute",
      inset: 0,
      zIndex: 20,
      display: "flex",
      flexDirection: "column",
      background: "#1e1e2e",
      borderRadius: 36,
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        background: "#181825",
        borderBottom: "0.5px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          {(["rust", "python"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => useStore.getState().setCodeLanguage(lang)}
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: codeLanguage === lang ? "var(--accent-light)" : "var(--text-muted)",
                padding: "2px 7px",
                borderRadius: 4,
                background: codeLanguage === lang ? "var(--accent-dim)" : "transparent",
                border: `0.5px solid ${codeLanguage === lang ? "var(--border-accent)" : "transparent"}`,
              }}
            >
              {lang}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            onClick={handleRun}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              borderRadius: 5,
              background: "rgba(16,185,129,0.15)",
              border: "0.5px solid rgba(16,185,129,0.3)",
              color: "#10b981",
              fontSize: 9,
              fontWeight: 600,
            }}
          >
            <Play size={9} /> Run
          </button>
          <button
            onClick={() => setEditing(!editing)}
            style={{
              fontSize: 9,
              color: editing ? "var(--accent-light)" : "var(--text-muted)",
              padding: "3px 6px",
              borderRadius: 4,
              background: editing ? "var(--accent-dim)" : "transparent",
            }}
          >
            {editing ? "Preview" : "Edit"}
          </button>
          <button onClick={() => setShowCode(false)}>
            <X size={12} color="var(--text-muted)" />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flex: 1 }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            padding: "12px 0",
            background: "#181825",
            borderRight: "0.5px solid rgba(255,255,255,0.05)",
            minWidth: 32,
            alignItems: "flex-end",
            paddingRight: 8,
            paddingLeft: 8,
            userSelect: "none",
            flexShrink: 0,
          }}>
            {lines.map((_, i) => (
              <div key={i} style={{
                fontSize: 9,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.2)",
                fontFamily: "monospace",
              }}>
                {i + 1}
              </div>
            ))}
          </div>

          {editing ? (
            <textarea
              value={codeContent}
              onChange={(e) => setCodeContent(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1,
                background: "transparent",
                color: "#cdd6f4",
                fontSize: 10,
                fontFamily: "monospace",
                lineHeight: 1.7,
                padding: "12px 10px",
                border: "none",
                outline: "none",
                resize: "none",
              }}
            />
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: html }}
              style={{
                fontSize: 10,
                lineHeight: 1.7,
                padding: "12px 10px",
                overflowX: "auto",
                flex: 1,
              }}
            />
          )}
        </div>
      </div>

      <div style={{
        background: "#11111b",
        borderTop: "0.5px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <button
          onClick={() => setShowTerminal(!showTerminal)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            color: "var(--text-muted)",
            fontSize: 9,
            fontWeight: 500,
          }}
        >
          <Terminal size={10} />
          Terminal
          {running && (
            <span style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#10b981",
              animation: "pulse 1s infinite",
              marginLeft: 2,
            }} />
          )}
          <span style={{ marginLeft: "auto" }}>
            {showTerminal ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
          </span>
        </button>

        {showTerminal && (
          <div style={{
            height: 120,
            overflowY: "auto",
            padding: "6px 10px",
            fontFamily: "monospace",
            fontSize: 9,
            borderTop: "0.5px solid rgba(255,255,255,0.04)",
          }}>
            <div style={{ color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>
              $ {codeLanguage === "rust" ? "cargo run" : "python main.py"}
            </div>
            {terminalLines.map((line, i) => (
              <div key={i} style={{
                color: line.startsWith("error") ? "#f38ba8"
                  : line.startsWith("   Compiling") ? "#89b4fa"
                  : line.startsWith("    Finished") ? "#a6e3a1"
                  : line.startsWith("     Running") ? "#cba6f7"
                  : "#cdd6f4",
                lineHeight: 1.6,
              }}>
                {line}
              </div>
            ))}
            {running && (
              <span style={{ color: "#a6e3a1", animation: "pulse 1s infinite" }}>▋</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}