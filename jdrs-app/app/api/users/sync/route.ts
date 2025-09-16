import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-middleware"

// Mock database - in production, this would connect to MySQL
const users: any[] = []

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }

    const { action, data } = await request.json()

    switch (action) {
      case "create":
        // Check if user already exists
        const existingUser = users.find((u) => u.id === data.id || u.email === data.email)
        if (existingUser) {
          return NextResponse.json({ success: false, error: "User already exists" }, { status: 400 })
        }

        users.push({
          ...data,
          syncedAt: new Date().toISOString(),
        })

        return NextResponse.json({ success: true, message: "User synced successfully" })

      case "update":
        const userIndex = users.findIndex((u) => u.id === data.id)
        if (userIndex === -1) {
          return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
        }

        users[userIndex] = {
          ...users[userIndex],
          ...data,
          syncedAt: new Date().toISOString(),
        }

        return NextResponse.json({ success: true, message: "User updated successfully" })

      case "delete":
        const deleteIndex = users.findIndex((u) => u.id === data.id)
        if (deleteIndex === -1) {
          return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
        }

        users.splice(deleteIndex, 1)

        return NextResponse.json({ success: true, message: "User deleted successfully" })

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Sync users error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
