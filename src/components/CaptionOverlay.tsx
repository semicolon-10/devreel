"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useStore } from "@/store"

export default function CaptionOverlay() {
  const { activeCaptions, captionStyle, showCaptions } = useStore()
  const isYellow = captionStyle === "bold-yellow"
  const isKinetic = captionStyle === "kinetic"

  if (!showCaptions) return null

  return (
    <div style={{
      position: "absolute",
      bottom: 80,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
      padding: "0 20px",
      zIndex: 25,
      pointerEvents: "none",
    }}>
      <AnimatePresence mode="popLayout">
        {activeCaptions.map((caption) => {
          const words = caption.text.split(" ")

          if (isKinetic) {
            return (
              <motion.div
                key={caption.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                {words.map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.2 }}
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#fff",
                      textShadow: "0 2px 8px rgba(0,0,0,0.9)",
                      letterSpacing: 0.5,
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.div>
            )
          }

          return (
            <motion.div
              key={caption.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                textAlign: "center",
                fontSize: isYellow ? 22 : 18,
                fontWeight: isYellow ? 800 : 500,
                color: isYellow ? "var(--caption-yellow)" : "var(--caption-white)",
                textShadow: "0 2px 8px rgba(0,0,0,0.9)",
                lineHeight: 1.4,
                letterSpacing: isYellow ? 0.5 : 0.2,
              }}
            >
              {caption.text}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}