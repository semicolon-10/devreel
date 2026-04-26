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

  async function exportVideo(
    recordingBlob: Blob,
    position: { x: number; y: number; w: number; h: number } | null,
    browserW: number,
  ): Promise<Blob> {
    if (!ffmpegInstance || !ffmpegLoaded) throw new Error("FFmpeg not loaded")
    const { fetchFile } = await import("@ffmpeg/util")

    setExportStage("Writing input file")
    setExportProgress(0)

    const inputData = await fetchFile(recordingBlob)
    await ffmpegInstance.writeFile("input.webm", inputData)

    setExportStage("Detecting video dimensions")

    let actualW = 0
    let actualH = 0
    const logHandler = ({ message }: { message: string }) => {
      const match = message.match(/Video:.*?(\d{3,5})x(\d{3,5})/)
      if (match) {
        actualW = parseInt(match[1])
        actualH = parseInt(match[2])
      }
    }
    ffmpegInstance.on("log", logHandler)
    await ffmpegInstance.exec(["-i", "input.webm", "-f", "null", "-frames:v", "1", "-"]).catch(() => {})
    ffmpegInstance.off("log", logHandler)

    if (!actualW || !actualH) {
      actualW = 2900
      actualH = 1626
    }

    console.log(`Actual video: ${actualW}x${actualH}`)
    console.log(`Browser doc width: ${browserW}`)

    let filterComplex: string

    if (position && browserW > 0) {
      const scale = actualW / browserW

      let x = Math.round(position.x * scale)
      let y = Math.round(position.y * scale)
      let w = Math.round(position.w * scale)
      let h = Math.round(position.h * scale)

      x = Math.max(0, x)
      y = Math.max(0, y)
      if (x + w > actualW) w = actualW - x
      if (y + h > actualH) h = actualH - y

      console.log(`Scale: ${scale.toFixed(3)}`)
      console.log(`Crop: x=${x} y=${y} w=${w} h=${h}`)

      filterComplex = `crop=${w}:${h}:${x}:${y},scale=1080:1920`
    } else {
      filterComplex = `scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2`
    }

    setExportStage("Encoding")

    await ffmpegInstance.exec([
      "-i", "input.webm",
      "-vf", filterComplex,
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