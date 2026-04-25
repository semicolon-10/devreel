import { createContext, useContext, useRef, ReactNode } from "react"
import { useRecorder } from "@/hooks/useRecorder"

const RecorderContext = createContext<ReturnType<typeof useRecorder> & {
  phoneFrameRef: React.RefObject<HTMLDivElement>
  recordingBlobRef: React.RefObject<Blob | null>
} | null>(null)

export function RecorderProvider({ children }: { children: ReactNode }) {
  const phoneFrameRef = useRef<HTMLDivElement>(null)
  const recordingBlobRef = useRef<Blob | null>(null)
  const recorder = useRecorder(phoneFrameRef)

  return (
    <RecorderContext.Provider value={{ ...recorder, phoneFrameRef, recordingBlobRef }}>
      {children}
    </RecorderContext.Provider>
  )
}

export function useRecorderContext() {
  const ctx = useContext(RecorderContext)
  if (!ctx) throw new Error("useRecorderContext must be used within RecorderProvider")
  return ctx
}