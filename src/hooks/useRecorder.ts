import { useRef } from "react"
import { useStore } from "@/store"

export function useRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const displayStreamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const durationRef = useRef(0)
  const rafRef = useRef<number>(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const videoElRef = useRef<HTMLVideoElement | null>(null)

  const { setStatus, setDuration, setHasRecording, setRecordingBlob } = useStore()

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

  /**
   * On each animation frame, read the phone frame's current position,
   * crop that region from the tab capture, and draw it onto the canvas.
   * This makes the recording immune to browser resize/scroll.
   */
  function drawLoop(video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    const phoneFrame = document.querySelector("[data-phone-frame]") as HTMLElement | null
    if (!phoneFrame || video.paused || video.ended) return

    const frameRect = phoneFrame.getBoundingClientRect()

    // The display stream captures the tab at device-pixel-ratio resolution.
    // getBoundingClientRect gives CSS pixels, so scale by devicePixelRatio.
    const dpr = window.devicePixelRatio || 1
    const sx = frameRect.left * dpr
    const sy = frameRect.top * dpr
    const sw = frameRect.width * dpr
    const sh = frameRect.height * dpr

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

    rafRef.current = requestAnimationFrame(() => drawLoop(video, canvas, ctx))
  }

  async function startRecording() {
    chunksRef.current = []
    setHasRecording(false)
    setRecordingBlob(null)

    // Capture the current browser tab
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 30 } },
      audio: true,
      // @ts-expect-error -- preferCurrentTab is supported in Chromium
      preferCurrentTab: true,
    })

    displayStreamRef.current = displayStream

    // Set up a hidden video element to play the tab capture
    const video = document.createElement("video")
    video.srcObject = displayStream
    video.muted = true
    await video.play()
    videoElRef.current = video

    // Create an offscreen canvas at 1080×1920 (final output resolution)
    const canvas = document.createElement("canvas")
    canvas.width = 1080
    canvas.height = 1920
    canvasRef.current = canvas

    const ctx = canvas.getContext("2d", { willReadFrequently: false })!

    // Start the draw loop — re-samples phone frame position every frame
    drawLoop(video, canvas, ctx)

    // The canvas stream is what we actually record (phone frame only)
    const canvasStream = canvas.captureStream(30)

    // Mix in audio: tab audio + optional mic
    const audioCtx = new AudioContext()
    const dest = audioCtx.createMediaStreamDestination()

    const displayAudioTracks = displayStream.getAudioTracks()
    if (displayAudioTracks.length > 0) {
      const tabSource = audioCtx.createMediaStreamSource(
        new MediaStream(displayAudioTracks),
      )
      tabSource.connect(dest)
    }

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      const micSource = audioCtx.createMediaStreamSource(micStream)
      micSource.connect(dest)
    } catch {
      console.warn("Mic not available")
    }

    // Combine canvas video + mixed audio into one stream
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ])

    displayStream.getVideoTracks()[0].onended = () => {
      if (mediaRecorderRef.current?.state !== "inactive") stopRecording()
    }

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm"

    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: 8_000_000,
    })

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.start(500)
    mediaRecorderRef.current = recorder
    setStatus("recording")
    startTimer()
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
      // Stop the draw loop
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = 0

      // Clean up video element
      if (videoElRef.current) {
        videoElRef.current.pause()
        videoElRef.current.srcObject = null
        videoElRef.current = null
      }
      canvasRef.current = null

      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === "inactive") {
        resolve(new Blob())
        return
      }
      stopTimer()
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" })
        setRecordingBlob(blob)
        setHasRecording(true)
        resolve(blob)
      }
      recorder.stop()
      displayStreamRef.current?.getTracks().forEach((t) => t.stop())
      setStatus("idle")
    })
  }

  return { startRecording, pauseRecording, stopRecording }
}
