import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-middleware"

// Mock database - in production, this would connect to MySQL
const harvesting: any[] = []

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }

    const { action, data } = await request.json()

    switch (action) {
      case "create":
        // Check if harvesting record already exists
        const existingHarvesting = harvesting.find((h) => h.id === data.id)
        if (existingHarvesting) {
          return NextResponse.json({ success: false, error: "Harvesting record already exists" }, { status: 400 })
        }

        harvesting.push({
          ...data,
          syncedAt: new Date().toISOString(),
        })

        return NextResponse.json({ success: true, message: "Harvesting record synced successfully" })

      case "update":
        const harvestingIndex = harvesting.findIndex((h) => h.id === data.id)
        if (harvestingIndex === -1) {
          return NextResponse.json({ success: false, error: "Harvesting record not found" }, { status: 404 })
        }

        harvesting[harvestingIndex] = {
          ...harvesting[harvestingIndex],
          ...data,
          syncedAt: new Date().toISOString(),
        }

        return NextResponse.json({ success: true, message: "Harvesting record updated successfully" })

      case "delete":
        const deleteIndex = harvesting.findIndex((h) => h.id === data.id)
        if (deleteIndex === -1) {
          return NextResponse.json({ success: false, error: "Harvesting record not found" }, { status: 404 })
        }

        harvesting.splice(deleteIndex, 1)

        return NextResponse.json({ success: true, message: "Harvesting record deleted successfully" })

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Sync harvesting error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
