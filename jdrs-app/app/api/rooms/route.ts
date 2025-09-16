import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-middleware"

// Mock database - in production, this would connect to MySQL
const rooms: any[] = []

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      rooms,
    })
  } catch (error) {
    console.error("Get rooms error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }

    // Only admins can create rooms
    if (authResult.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const roomData = await request.json()
    const { name, number, area, description } = roomData

    // Validation
    if (!name || !number || !area) {
      return NextResponse.json({ success: false, error: "Name, number, and area are required" }, { status: 400 })
    }

    // Check if room number already exists
    const existingRoom = rooms.find((r) => r.number === number)
    if (existingRoom) {
      return NextResponse.json({ success: false, error: "Room number already exists" }, { status: 400 })
    }

    // Create new room
    const newRoom = {
      id: `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      number,
      area,
      description: description || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    rooms.push(newRoom)

    return NextResponse.json({
      success: true,
      room: newRoom,
    })
  } catch (error) {
    console.error("Create room error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
