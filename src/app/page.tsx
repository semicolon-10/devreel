"use client"

import dynamic from "next/dynamic"
import Sidebar from "@/components/Sidebar"
import Timeline from "@/components/Timeline"
import SidePanel from "@/components/SidePanel"

const Preview = dynamic(() => import("@/components/Preview"), { ssr: false })
const FFmpegLoader = dynamic(() => import("@/components/FFmpegLoader"), { ssr: false })

export default function Page() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      width: "100vw",
      background: "var(--bg-base)",
      overflow: "hidden",
    }}>
      <FFmpegLoader />
      <div style={{
        display: "flex",
        flex: 1,
        overflow: "hidden",
      }}>
        <Sidebar />
        <Preview />
        <SidePanel />
      </div>
      <Timeline />
    </div>
  )
}