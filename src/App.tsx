import Sidebar from "@/components/Sidebar"
import Preview from "@/components/Preview"
import SidePanel from "@/components/SidePanel"
import Timeline from "@/components/Timeline"

export default function App() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      width: "100vw",
      background: "var(--bg-base)",
      overflow: "hidden",
    }}>
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