"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Loader2, 
  ArrowLeft, 
  Home, 
  Hash, 
  Ruler, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  Plus,
  Save
} from "lucide-react"
import { offlineStorage } from "@/lib/offline-storage"
import Link from "next/link"

interface FormData {
  name: string
  number: string
  area: string
  description: string
}

interface FormErrors {
  name?: string
  number?: string
  area?: string
}

export default function AddRoom() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    number: "",
    area: "",
    description: "",
  })
  
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isFormValid, setIsFormValid] = useState(false)
  const router = useRouter()

  // Real-time form validation
  useEffect(() => {
    const errors: FormErrors = {}
    
  

    setFormErrors(errors)
    setIsFormValid(
      Object.keys(errors).length === 0 &&
      formData.name.trim().length > 0 &&
      formData.number.trim().length > 0 &&
      formData.area.trim().length > 0
    )
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) return

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000))

      await offlineStorage.addRoom({
        id: crypto.randomUUID(),
        name: formData.name.trim(),
        number: formData.number.trim(),
        area: formData.area.trim(),
        description: formData.description.trim() || undefined,
        createdAt: new Date().toISOString(),
      })

      setSuccess("Room created successfully!")

      // Reset form
      setFormData({
        name: "",
        number: "",
        area: "",
        description: "",
      })

      // Redirect after 2.5 seconds
      setTimeout(() => {
        router.push("/admin/dashboard")
      }, 2500)
    } catch (err) {
      setError("Failed to create room. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear specific field error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const getFieldStatus = (field: keyof FormErrors) => {
    if (!formData[field]) return null
    return formErrors[field] ? 'error' : 'success'
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8 space-y-8">
          
          {/* Header Section */}
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="transition-transform hover:scale-105">
              <Button variant="outline" size="lg" className="shadow-sm hover:shadow-md">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900">Add New Room</h1>
              </div>
              <p className="text-lg text-gray-600">Register a new harvesting room to your facility</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  <Plus className="h-3 w-3 mr-1" />
                  New Registration
                </Badge>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">Room Registration</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-sm text-gray-500">Step 1 of 1</span>
              </div>
            </CardContent>
          </Card>

          {/* Main Form Card */}
          <Card className="max-w-4xl mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
              <CardTitle className="text-2xl flex items-center gap-3">
                <Home className="h-6 w-6 text-green-600" />
                Room Information
              </CardTitle>
              <CardDescription className="text-base">
                Provide detailed information about the harvesting room you want to register
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Status Alerts */}
                {error && (
                  <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="font-medium">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50 text-green-800 animate-in slide-in-from-top-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription className="font-medium">{success}</AlertDescription>
                  </Alert>
                )}

                {/* Form Fields */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Room Name */}
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-base font-semibold flex items-center gap-2">
                      <Home className="h-4 w-4 text-gray-500" />
                      Room Name
                    </Label>
                    <div className="relative">
                      <Input
                        id="name"
                        type="text"
                        placeholder="e.g., Harvest Room A1"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className={`text-base py-3 pr-10 transition-all duration-200 ${
                          getFieldStatus('name') === 'error' ? 'border-red-300 focus:border-red-500' :
                          getFieldStatus('name') === 'success' ? 'border-green-300 focus:border-green-500' :
                          'focus:border-blue-500'
                        }`}
                        required
                      />
                      {getFieldStatus('name') === 'success' && (
                        <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                      )}
                    </div>
                    {formErrors.name && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Room Number */}
                  <div className="space-y-3">
                    <Label htmlFor="number" className="text-base font-semibold flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-500" />
                      Room Number
                    </Label>
                    <div className="relative">
                      <Input
                        id="number"
                        type="text"
                        placeholder="e.g., A001, R-25"
                        value={formData.number}
                        onChange={(e) => handleInputChange("number", e.target.value)}
                        className={`text-base py-3 pr-10 transition-all duration-200 ${
                          getFieldStatus('number') === 'error' ? 'border-red-300 focus:border-red-500' :
                          getFieldStatus('number') === 'success' ? 'border-green-300 focus:border-green-500' :
                          'focus:border-blue-500'
                        }`}
                        required
                      />
                      {getFieldStatus('number') === 'success' && (
                        <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                      )}
                    </div>
                    {formErrors.number && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {formErrors.number}
                      </p>
                    )}
                  </div>

                  {/* Room Area */}
                  <div className="space-y-3 lg:col-span-2">
                    <Label htmlFor="area" className="text-base font-semibold flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-gray-500" />
                      Area (Square Feet)
                    </Label>
                    <div className="relative max-w-md">
                      <Input
                        id="area"
                        type="number"
                        placeholder="e.g., 500"
                        value={formData.area}
                        onChange={(e) => handleInputChange("area", e.target.value)}
                        className={`text-base py-3 pr-16 transition-all duration-200 ${
                          getFieldStatus('area') === 'error' ? 'border-red-300 focus:border-red-500' :
                          getFieldStatus('area') === 'success' ? 'border-green-300 focus:border-green-500' :
                          'focus:border-blue-500'
                        }`}
                        min="1"
                        required
                      />
                      <div className="absolute right-3 top-3 flex items-center gap-1">
                        {getFieldStatus('area') === 'success' && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                        <span className="text-sm text-gray-500">sq ft</span>
                      </div>
                    </div>
                    {formErrors.area && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {formErrors.area}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-3 lg:col-span-2">
                    <Label htmlFor="description" className="text-base font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      Description <span className="text-sm font-normal text-gray-500">(Optional)</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Add any additional details about this room, such as equipment, special features, or usage notes..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={4}
                      className="text-base resize-none transition-all duration-200 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500">
                      {formData.description.length}/500 characters
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button 
                    type="submit" 
                    size="lg"
                    className={`flex-1 sm:flex-none text-base py-3 px-8 transition-all duration-200 ${
                      isFormValid 
                        ? 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl' 
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    disabled={isLoading || !isFormValid}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Room...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        Create Room
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="lg"
                    className="flex-1 sm:flex-none text-base py-3 px-8 transition-all duration-200 hover:bg-gray-50"
                    onClick={() => router.back()}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>

                {/* Form Validation Summary */}
                {!isFormValid && (formData.name || formData.number || formData.area) && (
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-amber-800">Please complete the form</h4>
                          <p className="text-sm text-amber-700 mt-1">
                            Fill in all required fields with valid information to create the room.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="max-w-4xl mx-auto bg-blue-50 border-blue-200">
            <CardContent className="py-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Room names should be descriptive and unique</li>
                    <li>• Room numbers can include letters and numbers (e.g., A001, R-25)</li>
                    <li>• Area should be entered in square feet as a whole number</li>
                    <li>• Description helps other users understand the room's purpose</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}