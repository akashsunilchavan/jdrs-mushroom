"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Loader2, 
  ArrowLeft, 
  UserPlus, 
  Mail, 
  Phone, 
  Lock, 
  User,
  Check,
  X,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  CheckCircle2,
  Info
} from "lucide-react"
import Link from "next/link"

interface FormField {
  name: keyof FormData
  label: string
  type: string
  placeholder: string
  icon: React.ComponentType<any>
  required: boolean
  validation?: (value: string) => string | null
}

interface FormData {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  isActive: boolean
}

interface ValidationState {
  name: string | null
  email: string | null
  phone: string | null
  password: string | null
  confirmPassword: string | null
}

interface ApiResponse {
  success: boolean
  message: string
  data?: any
  errors?: Record<string, string[]>
}

// API Configuration
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
  endpoints: {
    supervisors: '/supervisors/supervisor_register',
    checkEmail: '/supervisors/check-email'
  },
  timeout: 10000, // 10 seconds
}

// API Service Class
class ApiService {
  private static async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    try {
      const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout. Please try again.')
        }
        throw error
      }
      
      throw new Error('An unexpected error occurred')
    }
  }

  static async createSupervisor(data: Omit<FormData, 'confirmPassword'>): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(API_CONFIG.endpoints.supervisors, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static async checkEmailExists(email: string): Promise<{ exists: boolean }> {
    return this.makeRequest<{ exists: boolean }>(
      `${API_CONFIG.endpoints.checkEmail}?email=${encodeURIComponent(email)}`,
      { method: 'GET' }
    )
  }
}

export default function AddSupervisor() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    isActive: true,
  })
  
  const [validationState, setValidationState] = useState<ValidationState>({
    name: null,
    email: null,
    phone: null,
    password: null,
    confirmPassword: null,
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formProgress, setFormProgress] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const router = useRouter()

  const formFields: FormField[] = [
    {
      name: "name",
      label: "Full Name",
      type: "text",
      placeholder: "Enter supervisor's full name",
      icon: User,
      required: true,
      validation: (value: string) => {
        if (value.length < 2) return "Name must be at least 2 characters"
        if (!/^[a-zA-Z\s]+$/.test(value)) return "Name can only contain letters and spaces"
        return null
      }
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "supervisor@company.com",
      icon: Mail,
      required: true,
      validation: (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return "Please enter a valid email address"
        return null
      }
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "tel",
      placeholder: "+1 (555) 123-4567",
      icon: Phone,
      required: true,
      validation: (value: string) => {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) return "Please enter a valid phone number"
        return null
      }
    }
  ]

  const validatePassword = (password: string) => {
    if (password.length < 8) return "Password must be at least 8 characters"
    if (!/(?=.*[a-z])/.test(password)) return "Password must contain at least one lowercase letter"
    if (!/(?=.*[A-Z])/.test(password)) return "Password must contain at least one uppercase letter"
    if (!/(?=.*\d)/.test(password)) return "Password must contain at least one number"
    if (!/(?=.*[@$!%*?&])/.test(password)) return "Password must contain at least one special character"
    return null
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 20
    if (/(?=.*[a-z])/.test(password)) strength += 20
    if (/(?=.*[A-Z])/.test(password)) strength += 20
    if (/(?=.*\d)/.test(password)) strength += 20
    if (/(?=.*[@$!%*?&])/.test(password)) strength += 20
    return strength
  }

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength < 40) return { label: "Weak", color: "text-red-500" }
    if (strength < 60) return { label: "Fair", color: "text-yellow-500" }
    if (strength < 80) return { label: "Good", color: "text-blue-500" }
    return { label: "Strong", color: "text-green-500" }
  }

  const validateField = (field: keyof FormData, value: string) => {
    const fieldConfig = formFields.find(f => f.name === field)
    
    if (field === "password") {
      return validatePassword(value)
    }
    
    if (field === "confirmPassword") {
      if (value !== formData.password) return "Passwords do not match"
      return null
    }
    
    if (fieldConfig?.validation) {
      return fieldConfig.validation(value)
    }
    
    return null
  }

  // Email validation with API check
  const checkEmailAvailability = async (email: string) => {
    if (!email || validationState.email) return

    setIsCheckingEmail(true)
    try {
      const result = await ApiService.checkEmailExists(email)
      if (result.exists) {
        setValidationState(prev => ({ 
          ...prev, 
          email: "This email is already registered" 
        }))
      }
    } catch (error) {
      console.warn('Email check failed:', error)
      // Don't show error to user for email check failure
    } finally {
      setIsCheckingEmail(false)
    }
  }

  // Debounced email check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email && !validationState.email) {
        checkEmailAvailability(formData.email)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [formData.email, validationState.email])

  useEffect(() => {
    // Calculate form completion progress
    const fields = ["name", "email", "phone", "password", "confirmPassword"]
    const completedFields = fields.filter(field => formData[field as keyof FormData] !== "").length
    const progress = (completedFields / fields.length) * 100
    setFormProgress(progress)
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Client-side validation
      const validationErrors: Partial<ValidationState> = {}
      let hasErrors = false
      
      // Validate all fields
      Object.keys(formData).forEach(key => {
        if (key !== "isActive" && key !== "confirmPassword") {
          const error = validateField(key as keyof FormData, formData[key as keyof FormData] as string)
          if (error) {
            validationErrors[key as keyof ValidationState] = error
            hasErrors = true
          }
        }
      })

      // Validate confirm password separately
      if (formData.password !== formData.confirmPassword) {
        validationErrors.confirmPassword = "Passwords do not match"
        hasErrors = true
      }

      if (hasErrors) {
        setValidationState(prev => ({ ...prev, ...validationErrors }))
        setError("Please fix the validation errors")
        return
      }

      // Prepare API payload (exclude confirmPassword)
      const { confirmPassword, ...apiPayload } = formData

      // Call API to create supervisor
      const response = await ApiService.createSupervisor(apiPayload)

      if (response.success) {
        setSuccess(response.message || "Supervisor account created successfully!")
        
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          isActive: true,
        })
        
        setValidationState({
          name: null,
          email: null,
          phone: null,
          password: null,
          confirmPassword: null,
        })

        setRetryCount(0)

        // Redirect after showing success message
        setTimeout(() => {
          router.push("/admin/supervisors")
        }, 2500)
      } else {
        // Handle API validation errors
        if (response.errors) {
          const firstError = Object.values(response.errors)[0]?.[0]
          setError(firstError || response.message || "Validation failed")
        } else {
          setError(response.message || "Failed to create supervisor account")
        }
      }
    } catch (error) {
      console.error('Supervisor creation error:', error)
      
      let errorMessage = "Failed to create supervisor account. Please try again."
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = "Request timed out. Please check your connection and try again."
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection and try again."
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
      setRetryCount(prev => prev + 1)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Real-time validation for text fields
    if (typeof value === "string") {
      const error = validateField(field, value)
      setValidationState(prev => ({ ...prev, [field]: error }))
    }
    
    // Clear any existing errors
    if (error) setError("")
    if (success) setSuccess("")
  }

  const getFieldValidationIcon = (field: keyof FormData) => {
    const value = formData[field] as string
    const error = validationState[field as Exclude<keyof FormData, "isActive">]
    
    if (!value) return null
    
    // Show loading spinner for email check
    if (field === 'email' && isCheckingEmail) {
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
    }
    
    if (error) {
      return <X className="h-4 w-4 text-red-500" />
    } else {
      return <Check className="h-4 w-4 text-green-500" />
    }
  }

  const handleRetry = () => {
    setError("")
    setSuccess("")
    handleSubmit({ preventDefault: () => {} } as React.FormEvent)
  }

  const passwordStrength = getPasswordStrength(formData.password)
  const passwordStrengthInfo = getPasswordStrengthLabel(passwordStrength)

  return (
    <DashboardLayout requiredRole="admin">
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex items-center gap-4">
            <Link href="/admin/supervisors">
              <Button 
                variant="outline" 
                size="icon"
                className="bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:shadow-md transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
                  Add New Supervisor
                </h1>
                <p className="text-slate-600 dark:text-slate-400">Create a new supervisor account for your team</p>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Form Progress</span>
                <Badge variant="outline" className="bg-white/50 text-blue-700 border-blue-200">
                  {Math.round(formProgress)}% Complete
                </Badge>
              </div>
              <Progress value={formProgress} className="h-2" />
            </CardContent>
          </Card>

          {/* Form Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-xl">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Supervisor Information
                  </CardTitle>
                  <CardDescription>
                    Fill in the required information to create a new supervisor account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Alert Messages */}
                    {error && (
                      <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="font-medium flex items-center justify-between">
                          {error}
                          {retryCount > 0 && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={handleRetry}
                              disabled={isLoading}
                              className="ml-4"
                            >
                              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Retry"}
                            </Button>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {success && (
                      <Alert className="border-green-200 bg-green-50 text-green-800 dark:bg-green-950/50 dark:text-green-200">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription className="font-medium">{success}</AlertDescription>
                      </Alert>
                    )}

                    {/* Personal Information */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {formFields.map((field) => {
                            const Icon = field.icon
                            const hasError = validationState[field.name as Exclude<keyof FormData, "isActive">]
                            const value = formData[field.name] as string

                            return (
                              <div key={field.name} className="space-y-2">
                                <Label htmlFor={field.name} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {field.label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </Label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Icon className={`h-4 w-4 ${hasError ? 'text-red-400' : 'text-slate-400'}`} />
                                  </div>
                                  <Input
                                    id={field.name}
                                    type={field.type}
                                    placeholder={field.placeholder}
                                    value={value}
                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                    required={field.required}
                                    className={`pl-10 pr-10 ${hasError ? 'border-red-300 focus:border-red-500' : 'border-slate-200'}`}
                                  />
                                  {value && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                      {getFieldValidationIcon(field.name)}
                                    </div>
                                  )}
                                </div>
                                {hasError && (
                                  <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {hasError}
                                  </p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <Separator />

                      {/* Security Information */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Security Information</h3>
                        <div className="space-y-6">
                          {/* Password Field */}
                          <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Password <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-slate-400" />
                              </div>
                              <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter a strong password"
                                value={formData.password}
                                onChange={(e) => handleInputChange("password", e.target.value)}
                                required
                                className="pl-10 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                                ) : (
                                  <Eye className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                                )}
                              </button>
                            </div>
                            {formData.password && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-slate-600">Password Strength</span>
                                  <span className={`text-xs font-medium ${passwordStrengthInfo.color}`}>
                                    {passwordStrengthInfo.label}
                                  </span>
                                </div>
                                <Progress value={passwordStrength} className="h-2" />
                              </div>
                            )}
                            {validationState.password && (
                              <p className="text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {validationState.password}
                              </p>
                            )}
                          </div>

                          {/* Confirm Password Field */}
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Confirm Password <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-slate-400" />
                              </div>
                              <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm the password"
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                required
                                className="pl-10 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                                ) : (
                                  <Eye className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                                )}
                              </button>
                            </div>
                            {validationState.confirmPassword && (
                              <p className="text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {validationState.confirmPassword}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Account Status */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Account Status
                          </Label>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {formData.isActive ? "Active (can login immediately)" : "Inactive (cannot login)"}
                          </p>
                        </div>
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                        />
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                      <Button 
                        type="submit" 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Create Supervisor
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => router.back()}
                        className="px-8"
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Information Panel */}
            <div className="space-y-6">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="h-5 w-5 text-blue-500" />
                    Supervisor Credentials
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    The supervisor will use their email and password to log in to their dashboard.
                  </p>
                  <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Email:</span>
                      <span className="text-sm">{formData.email || "Not set"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Password:</span>
                      <span className="text-sm">{formData.password ? "••••••••" : "Not set"}</span>
                    </div>
                  </div>
                  <Alert className="bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700 dark:text-amber-300 text-xs">
                      Make sure to provide these credentials to the supervisor securely.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Password Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "At least 8 characters",
                    "One uppercase letter",
                    "One lowercase letter",
                    "One number",
                    "One special character (@$!%*?&)"
                  ].map((requirement, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${formData.password && validatePassword(formData.password) === null ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{requirement}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}