import { useRef } from "react"
import { useStore } from "@/store"

interface PositionSample {
  x: number
  y: number
  w: number
  h: number
}

export function useRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const durationRef = useRef(0)
  const positionRef = useRef<PositionSample | null>(null)
  const browserWRef = useRef<number>(0)

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

  function samplePosition() {
    const phoneFrame = document.querySelector("[data-phone-frame]") as HTMLElement
    if (!phoneFrame) return

    const frameRect = phoneFrame.getBoundingClientRect()
    const docRect = document.documentElement.getBoundingClientRect()

    browserWRef.current = docRect.width

    positionRef.current = {
      x: frameRect.left - docRect.left,
      y: Math.max(0, frameRect.top - docRect.top),
      w: frameRect.width,
      h: frameRect.height,
    }

    console.log("Position sampled:", positionRef.current)
    console.log("Browser doc width:", browserWRef.current)
  }

  async function startRecording() {
    chunksRef.current = []
    setHasRecording(false)
    setRecordingBlob(null)

    samplePosition()

    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 30 } },
      audio: true,
    })

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      micStream.getAudioTracks().forEach((t) => displayStream.addTrack(t))
    } catch {
      console.warn("Mic not available")
    }

    streamRef.current = displayStream

    displayStream.getVideoTracks()[0].onended = () => {
      if (mediaRecorderRef.current?.state !== "inactive") stopRecording()
    }

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm"

    const recorder = new MediaRecorder(displayStream, {
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
      streamRef.current?.getTracks().forEach((t) => t.stop())
      setStatus("idle")
    })
  }

  function getPositionData() {
    return {
      position: positionRef.current,
      browserW: browserWRef.current,
    }
  }

  return { startRecording, pauseRecording, stopRecording, getPositionData }
}