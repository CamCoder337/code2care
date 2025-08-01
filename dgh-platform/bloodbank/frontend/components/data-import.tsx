"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Upload,
  FileText,
  Download,
  CheckCircle,
  AlertTriangle,
  Info,
  Database,
  FileSpreadsheet,
  Zap,
} from "lucide-react"
import {useApi, useImportCSV} from "@/lib/hooks/useApi"

export function DataImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const api = useApi()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type === "text/csv") {
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setImporting(true)
    setUploadProgress(0)
    setImportResult(null)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const result = await api.useImportCSV(selectedFile)

      clearInterval(progressInterval)
      setUploadProgress(100)
      setImportResult(result)
    } catch (error) {
      setImportResult({
        success: false,
        error: error instanceof Error ? error.message : "Import failed",
      })
    } finally {
      setImporting(false)
      setTimeout(() => setUploadProgress(0), 2000)
    }
  }

  const downloadTemplate = () => {
    const csvContent = `record_id,donor_id,collection_site,donor_age,donor_gender,blood_type,donation_date,collection_volume_ml,hemoglobin_g_dl,expiry_date
BB000001,D000001,Centre Principal,35,M,O+,2024-01-15,450,14.2,2024-04-15
BB000002,D000002,Site Secondaire,28,F,A+,2024-01-16,450,13.8,2024-04-16
BB000003,D000003,Centre Principal,42,M,B-,2024-01-17,450,15.1,2024-04-17`

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "blood_bank_template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Data Import
          </h1>
          <p className="text-muted-foreground mt-1">Import blood bank data from CSV files</p>
        </div>
        <Button
          onClick={downloadTemplate}
          variant="outline"
          className="hover:scale-105 transition-transform bg-transparent group"
        >
          <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
          Download Template
        </Button>
      </div>

      {/* Import Instructions */}
      <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-600">
            <Info className="w-5 h-5 mr-2" />
            Import Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Required CSV Format:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• record_id: Unique identifier for blood record</li>
                <li>• donor_id: Unique donor identifier</li>
                <li>• collection_site: Collection site name</li>
                <li>• donor_age: Donor age in years</li>
                <li>• donor_gender: M or F</li>
                <li>• blood_type: A+, A-, B+, B-, AB+, AB-, O+, O-</li>
                <li>• donation_date: YYYY-MM-DD format</li>
                <li>• collection_volume_ml: Volume in milliliters</li>
                <li>• hemoglobin_g_dl: Hemoglobin level (optional)</li>
                <li>• expiry_date: YYYY-MM-DD format (optional)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Important Notes:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• File must be in CSV format</li>
                <li>• Maximum file size: 10MB</li>
                <li>• Duplicate records will be skipped</li>
                <li>• Invalid data will be reported</li>
                <li>• Backup your data before importing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card className="hover:shadow-lg transition-all duration-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10" />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2 text-blue-600" />
            Upload CSV File
          </CardTitle>
          <CardDescription>Select or drag and drop your CSV file</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer group"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-8 h-8 text-blue-600 group-hover:animate-pulse" />
              </div>

              {selectedFile ? (
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-green-600">File Selected</p>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 max-w-md mx-auto">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-green-600" />
                      <div className="text-left">
                        <p className="font-medium text-green-800 dark:text-green-200">{selectedFile.name}</p>
                        <p className="text-sm text-green-600">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-semibold">Drop your CSV file here</p>
                  <p className="text-muted-foreground">or click to browse files</p>
                </div>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
          </div>

          {selectedFile && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleImport}
                disabled={importing}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-200 hover:scale-105 relative overflow-hidden"
              >
                {importing ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Import Data
                  </>
                )}
                {importing && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse" />
                )}
              </Button>
            </div>
          )}

          {/* Progress Bar */}
          {importing && uploadProgress > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Results */}
      {importResult && (
        <Card
          className={`border-l-4 ${importResult.success ? "border-l-green-500" : "border-l-red-500"} hover:shadow-lg transition-all duration-200 animate-slide-in-up`}
        >
          <CardHeader>
            <CardTitle className={`flex items-center ${importResult.success ? "text-green-600" : "text-red-600"}`}>
              {importResult.success ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Import Successful
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Import Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {importResult.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{importResult.imported_records}</div>
                    <div className="text-sm text-green-700 dark:text-green-300">Records Imported</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{importResult.total_errors || 0}</div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">Errors</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">100%</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Success Rate</div>
                  </div>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2 text-yellow-600">Warnings:</h4>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 max-h-40 overflow-y-auto">
                      {importResult.errors.map((error: string, index: number) => (
                        <p key={index} className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">
                          • {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Data has been successfully imported into the blood bank system. You can now view the imported
                    records in the inventory section.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {importResult.error ||
                      "An error occurred during import. Please check your file format and try again."}
                  </AlertDescription>
                </Alert>

                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-red-600">Common Issues:</h4>
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                    <li>• Check that all required columns are present</li>
                    <li>• Verify date formats (YYYY-MM-DD)</li>
                    <li>• Ensure blood types are valid (A+, A-, B+, B-, AB+, AB-, O+, O-)</li>
                    <li>• Check for duplicate record IDs</li>
                    <li>• Verify file encoding (UTF-8 recommended)</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-6 h-6 text-blue-600 group-hover:animate-pulse" />
            </div>
            <h3 className="font-semibold text-lg mb-2">CSV Template</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Download the standard CSV template with all required columns
            </p>
            <Button variant="outline" onClick={downloadTemplate} className="w-full bg-transparent">
              Download Template
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Database className="w-6 h-6 text-green-600 group-hover:animate-pulse" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Bulk Import</h3>
            <p className="text-sm text-muted-foreground mb-4">Import thousands of records at once with validation</p>
            <Badge variant="secondary" className="w-full justify-center">
              Up to 10,000 records
            </Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-purple-600 group-hover:animate-pulse" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Real-time Validation</h3>
            <p className="text-sm text-muted-foreground mb-4">Instant validation and error reporting during import</p>
            <Badge variant="secondary" className="w-full justify-center">
              Smart Validation
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
