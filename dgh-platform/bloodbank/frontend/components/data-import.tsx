"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
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
  Eye,
  Clock,
  BarChart3,
} from "lucide-react"
import { useImportCSV, useValidateCSV, useDownloadTemplate, useFileValidation } from "@/lib/hooks/useApi"
import { toast } from "sonner"

export function DataImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Hooks personnalisés
  const importCSVMutation = useImportCSV()
  const validateCSVMutation = useValidateCSV()
  const downloadTemplateMutation = useDownloadTemplate()
  const fileValidation = useFileValidation()

  // État dérivé
  const importing = importCSVMutation.isPending
  const validating = validateCSVMutation.isPending
  const importResult = importCSVMutation.data
  const importError = importCSVMutation.error

  const handleFileSelect = useCallback((file: File) => {
    // Validation côté client
    const validation = fileValidation.validateFile(file)

    if (!validation.valid) {
      toast.error(validation.errors[0])
      return
    }

    setSelectedFile(file)
    setValidationResult(null)
    setShowPreview(false)

    // Auto-validation après sélection
    validateCSVMutation.mutate(file, {
      onSuccess: (result) => {
        setValidationResult(result)
        if (result.preview && result.preview.length > 0) {
          setShowPreview(true)
        }
      }
    })
  }, [fileValidation, validateCSVMutation])

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragActive(false)

    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleImport = () => {
    if (!selectedFile) return

    importCSVMutation.mutate(selectedFile, {
      onSuccess: () => {
        // Reset après succès
        setSelectedFile(null)
        setValidationResult(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    })
  }

  const handleDownloadTemplate = () => {
    downloadTemplateMutation.mutate()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getValidationStatusIcon = () => {
    if (validating) return <LoadingSpinner className="w-4 h-4" />
    if (!validationResult) return <Clock className="w-4 h-4 text-gray-400" />
    if (validationResult.valid) return <CheckCircle className="w-4 h-4 text-green-500" />
    return <AlertTriangle className="w-4 h-4 text-red-500" />
  }

  const getValidationStatusText = () => {
    if (validating) return "Validation en cours..."
    if (!validationResult) return "En attente de validation"
    if (validationResult.valid) return `Fichier valide (${validationResult.valid_rows}/${validationResult.total_rows} lignes)`
    return `Erreurs détectées (${validationResult.errors?.length || 0})`
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Import de Données
          </h1>
          <p className="text-muted-foreground mt-1">
            Importez vos données de banque de sang depuis des fichiers CSV
          </p>
        </div>
        <Button
          onClick={handleDownloadTemplate}
          disabled={downloadTemplateMutation.isPending}
          variant="outline"
          className="hover:scale-105 transition-transform bg-transparent group"
        >
          {downloadTemplateMutation.isPending ? (
            <LoadingSpinner className="w-4 h-4 mr-2" />
          ) : (
            <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
          )}
          Télécharger le Modèle
        </Button>
      </div>

      {/* Instructions détaillées */}
      <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-600">
            <Info className="w-5 h-5 mr-2" />
            Instructions d'Import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Format CSV Requis:</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs mr-2">record_id</code>
                  Identifiant unique de l'enregistrement
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs mr-2">donor_id</code>
                  Identifiant unique du donneur
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs mr-2">collection_site</code>
                  Nom du site de collecte
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs mr-2">blood_type</code>
                  Groupe sanguin (A+, A-, B+, B-, AB+, AB-, O+, O-)
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs mr-2">donation_date</code>
                  Date de don (YYYY-MM-DD)
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Points Importants:</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Taille maximum: 10MB</li>
                <li>• Encodage: UTF-8 recommandé</li>
                <li>• Les doublons seront ignorés</li>
                <li>• Validation automatique avant import</li>
                <li>• Sauvegardez vos données avant l'import</li>
                <li>• Les erreurs seront signalées en détail</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone d'upload */}
      <Card className="hover:shadow-lg transition-all duration-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10" />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2 text-blue-600" />
            Téléverser le Fichier CSV
          </CardTitle>
          <CardDescription>
            Sélectionnez ou glissez-déposez votre fichier CSV
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer group ${
              dragActive 
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="space-y-4">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                dragActive 
                  ? 'bg-blue-200 dark:bg-blue-800 scale-110' 
                  : 'bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110'
              }`}>
                <FileSpreadsheet className="w-8 h-8 text-blue-600 group-hover:animate-pulse" />
              </div>

              {selectedFile ? (
                <div className="space-y-3">
                  <p className="text-lg font-semibold text-green-600">Fichier Sélectionné</p>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-md mx-auto border">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div className="text-left flex-1">
                        <p className="font-medium text-gray-800 dark:text-gray-200">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      {getValidationStatusIcon()}
                    </div>

                    {/* Status de validation */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {getValidationStatusText()}
                        </span>
                      </div>

                      {validationResult && !validationResult.valid && (
                        <div className="mt-2">
                          <Badge variant="destructive" className="text-xs">
                            {validationResult.errors?.length || 0} erreurs
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-semibold">
                    {dragActive ? 'Déposez votre fichier ici' : 'Glissez votre fichier CSV ici'}
                  </p>
                  <p className="text-muted-foreground">ou cliquez pour parcourir vos fichiers</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Aperçu des données */}
          {showPreview && validationResult?.preview && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  Aperçu des Données ({validationResult.preview.length} premières lignes)
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? 'Masquer' : 'Afficher'} l'aperçu
                </Button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      {Object.keys(validationResult.preview[0] || {}).map((key) => (
                        <th key={key} className="text-left p-2 font-semibold text-gray-700 dark:text-gray-300">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validationResult.preview.slice(0, 3).map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                        {Object.values(row).map((value: any, cellIdx) => (
                          <td key={cellIdx} className="p-2 text-gray-600 dark:text-gray-400">
                            {String(value).slice(0, 20)}{String(value).length > 20 ? '...' : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          {selectedFile && (
            <div className="mt-6 flex justify-center space-x-4">
              {!validationResult?.valid && (
                <Button
                  onClick={() => validateCSVMutation.mutate(selectedFile!)}
                  disabled={validating}
                  variant="outline"
                  className="bg-transparent"
                >
                  {validating ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      Validation...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Valider le Fichier
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={handleImport}
                disabled={importing || (validationResult && !validationResult.valid)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-200 hover:scale-105 relative overflow-hidden"
              >
                {importing ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Importer les Données
                  </>
                )}
                {importing && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse" />
                )}
              </Button>
            </div>
          )}

          {/* Barre de progression */}
          {importing && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Traitement en cours...</span>
                <span>Veuillez patienter</span>
              </div>
              <Progress value={undefined} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Erreurs de validation détaillées */}
      {validationResult && !validationResult.valid && (
        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all duration-200 animate-slide-in-up">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Erreurs de Validation Détectées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-red-600">
                  {validationResult.errors?.length || 0} erreur(s) trouvée(s):
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {validationResult.errors?.map((error: string, index: number) => (
                    <p key={index} className="text-sm text-red-700 dark:text-red-300">
                      • {error}
                    </p>
                  ))}
                </div>
              </div>

              {validationResult.warnings && validationResult.warnings.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-yellow-600">
                    Avertissements:
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {validationResult.warnings.map((warning: string, index: number) => (
                      <p key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                        • {warning}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Veuillez corriger les erreurs dans votre fichier CSV avant de procéder à l'import.
                  Vous pouvez télécharger le modèle pour voir le format requis.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultats d'import */}
      {importResult && (
        <Card className={`border-l-4 ${
          importResult.success ? 'border-l-green-500' : 'border-l-red-500'
        } hover:shadow-lg transition-all duration-200 animate-slide-in-up`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${
              importResult.success ? 'text-green-600' : 'text-red-600'
            }`}>
              {importResult.success ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Import Réussi
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Échec de l'Import
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {importResult.success ? (
              <div className="space-y-4">
                {/* Statistiques d'import */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {importResult.imported_records || 0}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      Enregistrements Importés
                    </div>
                  </div>

                  {importResult.skipped_records !== undefined && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {importResult.skipped_records}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Enregistrements Ignorés
                      </div>
                    </div>
                  )}

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {importResult.total_errors || 0}
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">
                      Avertissements
                    </div>
                  </div>

                  {importResult.processing_time && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {importResult.processing_time}s
                      </div>
                      <div className="text-sm text-purple-700 dark:text-purple-300">
                        Temps de Traitement
                      </div>
                    </div>
                  )}
                </div>

                {/* Détails de création */}
                {importResult.summary && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3 flex items-center">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Détail des Créations:
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Donneurs:</span> {importResult.summary.donors_created || 0}
                      </div>
                      <div>
                        <span className="font-medium">Unités de Sang:</span> {importResult.summary.blood_units_created || 0}
                      </div>
                      <div>
                        <span className="font-medium">Sites:</span> {importResult.summary.sites_created || 0}
                      </div>
                      <div>
                        <span className="font-medium">Mises à Jour:</span> {importResult.summary.records_updated || 0}
                      </div>
                    </div>
                  </div>
                )}

                {/* Erreurs et avertissements */}
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-yellow-600">
                      Avertissements lors de l'import:
                    </h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importResult.errors.slice(0, 10).map((error: string, index: number) => (
                        <p key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                          • {error}
                        </p>
                      ))}
                      {importResult.errors.length > 10 && (
                        <p className="text-sm text-yellow-600 font-medium">
                          ... et {importResult.errors.length - 10} autres avertissements
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Les données ont été importées avec succès dans le système de banque de sang.
                    Vous pouvez maintenant consulter les enregistrements importés dans la section inventaire.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {importResult.error || "Une erreur s'est produite lors de l'import. Veuillez vérifier le format de votre fichier et réessayer."}
                  </AlertDescription>
                </Alert>

                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-red-600">Solutions Possibles:</h4>
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                    <li>• Vérifiez que toutes les colonnes requises sont présentes</li>
                    <li>• Assurez-vous que les formats de date sont corrects (YYYY-MM-DD)</li>
                    <li>• Vérifiez que les groupes sanguins sont valides</li>
                    <li>• Contrôlez les IDs pour éviter les doublons</li>
                    <li>• Vérifiez l'encodage du fichier (UTF-8 recommandé)</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Erreur globale d'import */}
      {importError && (
        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all duration-200 animate-slide-in-up">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Erreur d'Import
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {importError.message || "Une erreur inattendue s'est produite lors de l'import."}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-6 h-6 text-blue-600 group-hover:animate-pulse" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Modèle CSV</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Téléchargez le modèle CSV standard avec toutes les colonnes requises
            </p>
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              disabled={downloadTemplateMutation.isPending}
              className="w-full bg-transparent"
            >
              {downloadTemplateMutation.isPending ? 'Téléchargement...' : 'Télécharger le Modèle'}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Database className="w-6 h-6 text-green-600 group-hover:animate-pulse" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Import en Masse</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Importez des milliers d'enregistrements en une seule fois avec validation
            </p>
            <Badge variant="secondary" className="w-full justify-center">
              Jusqu'à 10 000 enregistrements
            </Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-purple-600 group-hover:animate-pulse" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Validation Intelligente</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Validation instantanée et rapport d'erreurs détaillé pendant l'import
            </p>
            <Badge variant="secondary" className="w-full justify-center">
              Validation en Temps Réel
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}