import html2canvas from "html2canvas"
import { useRef } from "react"
import { useStore } from "@/store"

export function useRecorder(phoneFrameRef: React.RefObject<HTMLDivElement>) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const animFrameRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { setStatus, setDuration } = useStore()
  const durationRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startTimer() {
    timerRef.current = setInterval(() => {
      durationRef.current += 1
      setDuration(durationRef.current)
    }, 1000)
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    durationRef.current = 0
    setDuration(0)
  }

  async function startRecording() {
    if (!phoneFrameRef.current) return

    chunksRef.current = []

    const canvas = document.createElement("canvas")
    canvas.width = 360
    canvas.height = 640
    canvasRef.current = canvas

    const stream = canvas.captureStream(30)
    streamRef.current = stream

    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioStream.getAudioTracks().forEach((t) => stream.addTrack(t))

    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 8_000_000,
    })

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.start(100)
    mediaRecorderRef.current = recorder

    setStatus("recording")
    startTimer()

    function drawLoop() {
      if (!phoneFrameRef.current || !canvasRef.current) return
      html2canvas(phoneFrameRef.current, {
        canvas: canvasRef.current,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 1,
        logging: false,
      })
      animFrameRef.current = requestAnimationFrame(drawLoop)
    }

    drawLoop()
  }

  function pauseRecording() {
    const recorder = mediaRecorderRef.current
    if (!recorder) return
    if (recorder.state === "recording") {
      recorder.pause()
      setStatus("paused")
      stopTimer()
    } else if (recorder.state === "paused") {
      recorder.resume()
      setStatus("recording")
      startTimer()
    }
  }

  function stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder) return

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      stopTimer()

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" })
        resolve(blob)
      }

      recorder.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      setStatus("idle")
    })
  }

  async function exportRecording(blob: Blob, outputPath: string) {
    const arrayBuffer = await blob.arrayBuffer()
    const uint8 = new Uint8Array(arrayBuffer)

    const { invoke } = await import("@tauri-apps/api/core")
    await invoke("save_and_encode", {
      data: Array.from(uint8),
      outputPath,
    })
  }

  return { startRecording, pauseRecording, stopRecording, exportRecording }
}