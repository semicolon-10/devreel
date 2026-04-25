import { useEffect, useState } from "react"
import { codeToHtml } from "shiki"
import { useStore } from "@/store"

const DEFAULT_RUST = `async fn fetch(url: &str) {
  let res = reqwest::get(url)
    .await?;
  let body = res.text().await?;
  println!("{}", body);
}`

const DEFAULT_PYTHON = `async def fetch(url: str):
  async with aiohttp.ClientSession() as s:
    async with s.get(url) as res:
      body = await res.text()
      print(body)`

export default function CodeBlock() {
  const { tool, showCode, codeLanguage, codeContent, setShowCode, setCodeContent } = useStore()
  const [html, setHtml] = useState("")
  const [editing, setEditing] = useState(false)

  const isCodeTool = tool === "code"

  useEffect(() => {
    if (isCodeTool && !showCode) {
      setShowCode(true)
      setCodeContent(codeLanguage === "rust" ? DEFAULT_RUST : DEFAULT_PYTHON)
    }
  }, [isCodeTool])

  useEffect(() => {
    if (!codeContent) return
    codeToHtml(codeContent, {
      lang: codeLanguage,
      theme: "catppuccin-mocha",
    }).then(setHtml)
  }, [codeContent, codeLanguage])

  useEffect(() => {
    if (!showCode) return
    const defaultCode = codeLanguage === "rust" ? DEFAULT_RUST : DEFAULT_PYTHON
    setCodeContent(defaultCode)
  }, [codeLanguage])

  if (!showCode) return null

  return (
    <div style={{
      position: "absolute",
      top: 20,
      left: 10,
      right: 10,
      background: "rgba(0,0,0,0.75)",
      borderRadius: 6,
      border: "0.5px solid rgba(255,255,255,0.08)",
      backdropFilter: "blur(4px)",
      zIndex: 12,
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 8px",
        borderBottom: "0.5px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          display: "flex",
          gap: 6,
        }}>
          {(["rust", "python"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => useStore.getState().setCodeLanguage(lang)}
              style={{
                fontSize: 8,
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: codeLanguage === lang ? "var(--accent-light)" : "var(--text-muted)",
                padding: "1px 4px",
                borderRadius: 3,
                background: codeLanguage === lang ? "var(--accent-dim)" : "transparent",
              }}
            >
              {lang}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => setEditing(!editing)}
            style={{
              fontSize: 8,
              color: editing ? "var(--accent-light)" : "var(--text-muted)",
            }}
          >
            {editing ? "done" : "edit"}
          </button>
          <button
            onClick={() => setShowCode(false)}
            style={{ fontSize: 8, color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>
      </div>

      {editing ? (
        <textarea
          value={codeContent}
          onChange={(e) => setCodeContent(e.target.value)}
          spellCheck={false}
          style={{
            width: "100%",
            minHeight: 120,
            background: "transparent",
            color: "var(--text-primary)",
            fontSize: 8,
            fontFamily: "monospace",
            lineHeight: 1.7,
            padding: "8px 10px",
            border: "none",
            outline: "none",
            resize: "none",
          }}
        />
      ) : (
        <div
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            fontSize: 8,
            lineHeight: 1.7,
            padding: "8px 10px",
            overflowX: "auto",
          }}
        />
      )}
    </div>
  )
}