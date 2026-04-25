import { Excalidraw } from "@excalidraw/excalidraw"
import { useStore } from "@/store"
import "@excalidraw/excalidraw/index.css"

export default function Whiteboard() {
  const { tool } = useStore()
  const isActive = tool === "draw" || tool === "text" || tool === "shape"

  if (!isActive) return null

  return (
    <div style={{
      position: "absolute",
      inset: 0,
      zIndex: 16,
    }}>
      <Excalidraw
        theme="dark"
        initialData={{
          appState: {
            viewBackgroundColor: "transparent",
          },
        }}
      />
    </div>
  )
}