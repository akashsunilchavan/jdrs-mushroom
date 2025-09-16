import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-middleware"

// Mock database - in production, this would connect to MySQL
const users: any[] = []
const rooms: any[] = []
const labour: any[] = []
const harvesting: any[] = []

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }

    // Only admins can import data
    if (authResult.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const importData = await request.json()
    const { users: importUsers, rooms: importRooms, labour: importLabour, harvesting: importHarvesting } = importData

    let importedCount = 0

    // Import users (merge with existing, avoid duplicates)
    if (importUsers && Array.isArray(importUsers)) {
      for (const user of importUsers) {
        const existingIndex = users.findIndex((u) => u.id === user.id || u.email === user.email)
        if (existingIndex >= 0) {
          // Update existing user
          users[existingIndex] = { ...users[existingIndex], ...user, updatedAt: new Date().toISOString() }
        } else {
          // Add new user
          users.push({ ...user, importedAt: new Date().toISOString() })
        }
        importedCount++
      }
    }

    // Import rooms
    if (importRooms && Array.isArray(importRooms)) {
      for (const room of importRooms) {
        const existingIndex = rooms.findIndex((r) => r.id === room.id || r.number === room.number)
        if (existingIndex >= 0) {
          rooms[existingIndex] = { ...rooms[existingIndex], ...room, updatedAt: new Date().toISOString() }
        } else {
          rooms.push({ ...room, importedAt: new Date().toISOString() })
        }
        importedCount++
      }
    }

    // Import labour
    if (importLabour && Array.isArray(importLabour)) {
      for (const worker of importLabour) {
        const existingIndex = labour.findIndex((l) => l.id === worker.id)
        if (existingIndex >= 0) {
          labour[existingIndex] = { ...labour[existingIndex], ...worker, updatedAt: new Date().toISOString() }
        } else {
          labour.push({ ...worker, importedAt: new Date().toISOString() })
        }
        importedCount++
      }
    }

    // Import harvesting
    if (importHarvesting && Array.isArray(importHarvesting)) {
      for (const harvest of importHarvesting) {
        const existingIndex = harvesting.findIndex((h) => h.id === harvest.id)
        if (existingIndex >= 0) {
          harvesting[existingIndex] = { ...harvesting[existingIndex], ...harvest, updatedAt: new Date().toISOString() }
        } else {
          harvesting.push({ ...harvest, importedAt: new Date().toISOString() })
        }
        importedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedCount} records`,
      totalRecords: importedCount,
      breakdown: {
        users: importUsers?.length || 0,
        rooms: importRooms?.length || 0,
        labour: importLabour?.length || 0,
        harvesting: importHarvesting?.length || 0,
      },
    })
  } catch (error) {
    console.error("Import data error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
