"use client"

import { useEffect, useRef, useState } from "react"
import { useStore } from "@/store"
import { Eraser, Minus, Square, Circle, Pen } from "lucide-react"

type DrawTool = "pen" | "line" | "rect" | "circle" | "eraser"

interface Point { x: number; y: number }
interface Stroke {
  tool: DrawTool
  color: string
  size: number
  points: Point[]
}

export default function Whiteboard() {
  const { tool, brushColor, brushSize } = useStore()
  const isActive = tool === "draw"
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawTool, setDrawTool] = useState<DrawTool>("pen")
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [current, setCurrent] = useState<Stroke | null>(null)
  const isDrawing = useRef(false)
  const startPoint = useRef<Point | null>(null)

  useEffect(() => {
    redraw()
  }, [strokes])

  function redraw(preview?: Stroke) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const all = preview ? [...strokes, preview] : strokes
    for (const stroke of all) {
      drawStroke(ctx, stroke)
    }
  }

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if (stroke.points.length < 1) return
    ctx.strokeStyle = stroke.tool === "eraser" ? "#0d0d1a" : stroke.color
    ctx.lineWidth = stroke.tool === "eraser" ? stroke.size * 4 : stroke.size
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    if (stroke.tool === "pen" || stroke.tool === "eraser") {
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (const p of stroke.points.slice(1)) {
        ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()
    } else if (stroke.tool === "line" && stroke.points.length >= 2) {
      const a = stroke.points[0]
      const b = stroke.points[stroke.points.length - 1]
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    } else if (stroke.tool === "rect" && stroke.points.length >= 2) {
      const a = stroke.points[0]
      const b = stroke.points[stroke.points.length - 1]
      ctx.beginPath()
      ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y)
    } else if (stroke.tool === "circle" && stroke.points.length >= 2) {
      const a = stroke.points[0]
      const b = stroke.points[stroke.points.length - 1]
      const rx = Math.abs(b.x - a.x) / 2
      const ry = Math.abs(b.y - a.y) / 2
      const cx = a.x + (b.x - a.x) / 2
      const cy = a.y + (b.y - a.y) / 2
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  function getPos(e: React.MouseEvent | React.TouchEvent): Point {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    }
  }

  function onDown(e: React.MouseEvent | React.TouchEvent) {
    isDrawing.current = true
    const pos = getPos(e)
    startPoint.current = pos
    const stroke: Stroke = {
      tool: drawTool,
      color: brushColor,
      size: brushSize,
      points: [pos],
    }
    setCurrent(stroke)
  }

  function onMove(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing.current || !current) return
    const pos = getPos(e)
    const updated = { ...current, points: [...current.points, pos] }
    setCurrent(updated)
    redraw(updated)
  }

  function onUp() {
    if (!isDrawing.current || !current) return
    isDrawing.current = false
    setStrokes((prev) => [...prev, current])
    setCurrent(null)
  }

  if (!isActive) return null

  return (
    <div style={{
      position: "absolute",
      inset: 0,
      zIndex: 16,
    }}>
      <div style={{
        position: "absolute",
        top: 8,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        border: "0.5px solid var(--border)",
        borderRadius: 10,
        padding: "4px 8px",
      }}>
        {([
          { id: "pen", icon: <Pen size={11} /> },
          { id: "line", icon: <Minus size={11} /> },
          { id: "rect", icon: <Square size={11} /> },
          { id: "circle", icon: <Circle size={11} /> },
          { id: "eraser", icon: <Eraser size={11} /> },
        ] as { id: DrawTool; icon: React.ReactNode }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setDrawTool(t.id)}
            style={{
              width: 24,
              height: 24,
              borderRadius: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: drawTool === t.id ? "var(--accent-dim)" : "transparent",
              border: `0.5px solid ${drawTool === t.id ? "var(--border-accent)" : "transparent"}`,
              color: drawTool === t.id ? "var(--accent-light)" : "var(--text-secondary)",
            }}
          >
            {t.icon}
          </button>
        ))}
        <div style={{ width: 0.5, height: 16, background: "var(--border)", margin: "0 2px" }} />
        <button
          onClick={() => setStrokes([])}
          style={{
            fontSize: 8,
            color: "var(--text-muted)",
            padding: "2px 4px",
            borderRadius: 4,
          }}
        >
          clear
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={360}
        height={640}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={onDown}
        onTouchMove={onMove}
        onTouchEnd={onUp}
        style={{
          position: "absolute",
          inset: 0,
          cursor: drawTool === "eraser" ? "cell" : "crosshair",
          touchAction: "none",
        }}
      />
    </div>
  )
}