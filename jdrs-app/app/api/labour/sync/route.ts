import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-middleware"

// Mock database - in production, this would connect to MySQL
const labour: any[] = []

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }

    const { action, data } = await request.json()

    switch (action) {
      case "create":
        // Check if labour already exists
        const existingLabour = labour.find((l) => l.id === data.id)
        if (existingLabour) {
          return NextResponse.json({ success: false, error: "Labour already exists" }, { status: 400 })
        }

        labour.push({
          ...data,
          syncedAt: new Date().toISOString(),
        })

        return NextResponse.json({ success: true, message: "Labour synced successfully" })

      case "update":
        const labourIndex = labour.findIndex((l) => l.id === data.id)
        if (labourIndex === -1) {
          return NextResponse.json({ success: false, error: "Labour not found" }, { status: 404 })
        }

        labour[labourIndex] = {
          ...labour[labourIndex],
          ...data,
          syncedAt: new Date().toISOString(),
        }

        return NextResponse.json({ success: true, message: "Labour updated successfully" })

      case "delete":
        const deleteIndex = labour.findIndex((l) => l.id === data.id)
        if (deleteIndex === -1) {
          return NextResponse.json({ success: false, error: "Labour not found" }, { status: 404 })
        }

        labour.splice(deleteIndex, 1)

        return NextResponse.json({ success: true, message: "Labour deleted successfully" })

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Sync labour error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
