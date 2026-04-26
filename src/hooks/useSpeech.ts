import { useRef, useEffect } from "react"
import { useStore } from "@/store"

export function useSpeech() {
  const recognitionRef = useRef<any>(null)
  const { status, showCaptions, setActiveCaptions, addCaption } = useStore()

  useEffect(() => {
    if (!showCaptions || status !== "recording") {
      recognitionRef.current?.stop()
      setActiveCaptions([])
      return
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: any) => {
      let interim = ""
      let final = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }

      if (final) {
        const caption = {
          id: Date.now().toString(),
          text: final.trim().toUpperCase(),
          startTime: Date.now() / 1000,
          endTime: Date.now() / 1000 + 3,
        }
        addCaption(caption)
        setActiveCaptions([caption])
        setTimeout(() => setActiveCaptions([]), 2500)
      } else if (interim) {
        setActiveCaptions([{
          id: "interim",
          text: interim.trim().toUpperCase(),
          startTime: Date.now() / 1000,
          endTime: Date.now() / 1000 + 3,
        }])
      }
    }

    recognition.onerror = (e: any) => {
      if (e.error !== "no-speech") console.warn("Speech error:", e.error)
    }

    recognition.onend = () => {
      if (showCaptions && useStore.getState().status === "recording") {
        recognition.start()
      }
    }

    recognition.start()
    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      setActiveCaptions([])
    }
  }, [showCaptions, status])
}