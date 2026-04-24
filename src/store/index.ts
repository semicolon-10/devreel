import { create } from "zustand"

type RecordingStatus = "idle" | "recording" | "paused"

type CaptionStyle = "bold-yellow" | "white" | "kinetic"

type Tool = "cursor" | "draw" | "text" | "shape" | "code" | "caption"

type Template = "quick-tip" | "bug-fix" | "whiteboard" | "live-code"

interface Caption {
  id: string
  text: string
  startTime: number
  endTime: number
}

interface StoreState {
  status: RecordingStatus
  duration: number
  tool: Tool
  captionStyle: CaptionStyle
  template: Template
  captions: Caption[]
  activeCaptions: Caption[]
  brushColor: string
  brushSize: number
  showCode: boolean
  codeLanguage: "rust" | "python"
  codeContent: string

  setStatus: (s: RecordingStatus) => void
  setDuration: (d: number) => void
  setTool: (t: Tool) => void
  setCaptionStyle: (s: CaptionStyle) => void
  setTemplate: (t: Template) => void
  addCaption: (c: Caption) => void
  setActiveCaptions: (c: Caption[]) => void
  setBrushColor: (c: string) => void
  setBrushSize: (s: number) => void
  setShowCode: (v: boolean) => void
  setCodeLanguage: (l: "rust" | "python") => void
  setCodeContent: (c: string) => void
}

export const useStore = create<StoreState>((set) => ({
  status: "idle",
  duration: 0,
  tool: "cursor",
  captionStyle: "bold-yellow",
  template: "quick-tip",
  captions: [],
  activeCaptions: [],
  brushColor: "#f97316",
  brushSize: 3,
  showCode: false,
  codeLanguage: "rust",
  codeContent: "",

  setStatus: (status) => set({ status }),
  setDuration: (duration) => set({ duration }),
  setTool: (tool) => set({ tool }),
  setCaptionStyle: (captionStyle) => set({ captionStyle }),
  setTemplate: (template) => set({ template }),
  addCaption: (c) => set((s) => ({ captions: [...s.captions, c] })),
  setActiveCaptions: (activeCaptions) => set({ activeCaptions }),
  setBrushColor: (brushColor) => set({ brushColor }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setShowCode: (showCode) => set({ showCode }),
  setCodeLanguage: (codeLanguage) => set({ codeLanguage }),
  setCodeContent: (codeContent) => set({ codeContent }),
}))