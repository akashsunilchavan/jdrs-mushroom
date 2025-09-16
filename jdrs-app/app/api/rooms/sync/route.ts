import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-middleware"

// Mock database - in production, this would connect to MySQL
const rooms: any[] = []

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }

    const { action, data } = await request.json()

    switch (action) {
      case "create":
        // Check if room already exists
        const existingRoom = rooms.find((r) => r.id === data.id || r.number === data.number)
        if (existingRoom) {
          return NextResponse.json({ success: false, error: "Room already exists" }, { status: 400 })
        }

        rooms.push({
          ...data,
          syncedAt: new Date().toISOString(),
        })

        return NextResponse.json({ success: true, message: "Room synced successfully" })

      case "update":
        const roomIndex = rooms.findIndex((r) => r.id === data.id)
        if (roomIndex === -1) {
          return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 })
        }

        rooms[roomIndex] = {
          ...rooms[roomIndex],
          ...data,
          syncedAt: new Date().toISOString(),
        }

        return NextResponse.json({ success: true, message: "Room updated successfully" })

      case "delete":
        const deleteIndex = rooms.findIndex((r) => r.id === data.id)
        if (deleteIndex === -1) {
          return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 })
        }

        rooms.splice(deleteIndex, 1)

        return NextResponse.json({ success: true, message: "Room deleted successfully" })

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Sync rooms error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
