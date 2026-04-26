import { useEffect, useRef } from "react"
import { useStore } from "@/store"

let ffmpegInstance: any = null

export function useFFmpeg() {
  const {
    ffmpegLoaded, ffmpegLoading,
    setFfmpegLoaded, setFfmpegLoading,
    setExportProgress, setExportStage,
  } = useStore()
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current || ffmpegLoaded || ffmpegLoading) return
    load()
  }, [])

  async function load() {
    setFfmpegLoading(true)
    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg")
      const { toBlobURL } = await import("@ffmpeg/util")
      ffmpegInstance = new FFmpeg()
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd"
      ffmpegInstance.on("log", ({ message }: { message: string }) => {
        console.log("[FFmpeg]", message)
      })
      ffmpegInstance.on("progress", ({ progress }: { progress: number }) => {
        setExportProgress(Math.round(progress * 100))
      })
      await ffmpegInstance.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      })
      loadedRef.current = true
      setFfmpegLoaded(true)
    } catch (e) {
      console.error("FFmpeg load error:", e)
    } finally {
      setFfmpegLoading(false)
    }
  }

  async function exportVideo(recordingBlob: Blob): Promise<Blob> {
    if (!ffmpegInstance || !ffmpegLoaded) throw new Error("FFmpeg not loaded")
    const { fetchFile } = await import("@ffmpeg/util")

    setExportStage("Writing input file")
    setExportProgress(0)

    const inputData = await fetchFile(recordingBlob)
    await ffmpegInstance.writeFile("input.webm", inputData)

    setExportStage("Encoding")

    // The recording is already cropped to the phone frame at 1080×1920.
    // Just re-encode to H.264 MP4.
    await ffmpegInstance.exec([
      "-i", "input.webm",
      "-vf", "scale=1080:1920",
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "18",
      "-c:a", "aac",
      "-b:a", "192k",
      "-movflags", "+faststart",
      "-y",
      "output.mp4",
    ])

    setExportStage("Finalizing")
    const data = await ffmpegInstance.readFile("output.mp4")
    await ffmpegInstance.deleteFile("input.webm")
    await ffmpegInstance.deleteFile("output.mp4")

    setExportProgress(100)
    setExportStage("Done")

    useStore.getState().setHasRecording(false)
    useStore.getState().setRecordingBlob(null)

    return new Blob([data], { type: "video/mp4" })
  }

  return { ffmpegLoaded, ffmpegLoading, exportVideo, load }
}
