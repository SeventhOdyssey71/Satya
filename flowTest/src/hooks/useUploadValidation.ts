'use client'

import { useMemo } from 'react'

interface ModelUploadData {
  title: string
  description: string
  category: string
  tags: string[]
  price: string
  enableSample: boolean
  maxDownloads?: number
  modelFile?: File
  thumbnailFile?: File
  sampleFile?: File
  enableEncryption: boolean
  policyType: string
  accessDuration?: number
  isPrivate: boolean
  allowedBuyers?: string[]
  expiryDays?: number
}

interface ValidationIssue {
  field: string
  message: string
  level: 'error' | 'warning' | 'info'
}

interface ValidationResult {
  isValid: boolean
  issues: ValidationIssue[]
  errorCount: number
  warningCount: number
  infoCount: number
}

interface StepValidation {
  [stepName: string]: ValidationResult
}

const SUPPORTED_MODEL_EXTENSIONS = [
  '.pkl', '.pt', '.pth', '.h5', '.onnx', '.pb', '.zip', '.tar', '.tar.gz'
]

const SUPPORTED_IMAGE_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'
]

const MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1GB
const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024 // 10MB
const MIN_PRICE = 0.001
const MAX_PRICE = 1000000
const MIN_DESCRIPTION_LENGTH = 10
const MAX_DESCRIPTION_LENGTH = 2000
const MIN_TITLE_LENGTH = 1
const MAX_TITLE_LENGTH = 100

export function useUploadValidation(data: ModelUploadData) {
  
  const validateBasicInfo = useMemo((): ValidationResult => {
    const issues: ValidationIssue[] = []

    // Title validation
    if (!data.title?.trim()) {
      issues.push({
        field: 'title',
        message: 'Title is required',
        level: 'error'
      })
    } else if (data.title.length < MIN_TITLE_LENGTH) {
      issues.push({
        field: 'title',
        message: `Title must be at least ${MIN_TITLE_LENGTH} character`,
        level: 'error'
      })
    } else if (data.title.length > MAX_TITLE_LENGTH) {
      issues.push({
        field: 'title',
        message: `Title must not exceed ${MAX_TITLE_LENGTH} characters`,
        level: 'error'
      })
    }

    // Description validation
    if (!data.description?.trim()) {
      issues.push({
        field: 'description',
        message: 'Description is required',
        level: 'error'
      })
    } else if (data.description.length < MIN_DESCRIPTION_LENGTH) {
      issues.push({
        field: 'description',
        message: `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`,
        level: 'error'
      })
    } else if (data.description.length > MAX_DESCRIPTION_LENGTH) {
      issues.push({
        field: 'description',
        message: `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`,
        level: 'error'
      })
    }

    // Category validation
    if (!data.category?.trim()) {
      issues.push({
        field: 'category',
        message: 'Category is required',
        level: 'error'
      })
    }

    // Tags validation
    if (data.tags.length === 0) {
      issues.push({
        field: 'tags',
        message: 'At least one tag is recommended for discoverability',
        level: 'warning'
      })
    } else if (data.tags.length > 10) {
      issues.push({
        field: 'tags',
        message: 'Too many tags (maximum 10 recommended)',
        level: 'warning'
      })
    }

    if (data.tags.length > 0 && data.tags.length < 3) {
      issues.push({
        field: 'tags',
        message: 'Add more tags to improve discoverability',
        level: 'info'
      })
    }

    return {
      isValid: issues.filter(i => i.level === 'error').length === 0,
      issues,
      errorCount: issues.filter(i => i.level === 'error').length,
      warningCount: issues.filter(i => i.level === 'warning').length,
      infoCount: issues.filter(i => i.level === 'info').length
    }
  }, [data.title, data.description, data.category, data.tags])

  const validateFiles = useMemo((): ValidationResult => {
    const issues: ValidationIssue[] = []

    // Model file validation
    if (!data.modelFile) {
      issues.push({
        field: 'modelFile',
        message: 'Model file is required',
        level: 'error'
      })
    } else {
      // Check file size
      if (data.modelFile.size > MAX_FILE_SIZE) {
        issues.push({
          field: 'modelFile',
          message: `Model file exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`,
          level: 'error'
        })
      }

      // Check file extension
      const fileExtension = data.modelFile.name.toLowerCase().substring(data.modelFile.name.lastIndexOf('.'))
      if (!SUPPORTED_MODEL_EXTENSIONS.includes(fileExtension)) {
        issues.push({
          field: 'modelFile',
          message: `Unsupported file format. Supported formats: ${SUPPORTED_MODEL_EXTENSIONS.join(', ')}`,
          level: 'error'
        })
      }

      // File size warnings
      if (data.modelFile.size > 100 * 1024 * 1024) { // 100MB
        issues.push({
          field: 'modelFile',
          message: 'Large file size may affect download performance',
          level: 'warning'
        })
      }

      // Check for suspicious file names
      const suspiciousPatterns = [/test/i, /example/i, /sample/i, /demo/i]
      if (suspiciousPatterns.some(pattern => pattern.test(data.modelFile!.name))) {
        issues.push({
          field: 'modelFile',
          message: 'File name suggests this might be a test/demo file',
          level: 'warning'
        })
      }
    }

    // Thumbnail validation
    if (data.thumbnailFile) {
      if (data.thumbnailFile.size > MAX_THUMBNAIL_SIZE) {
        issues.push({
          field: 'thumbnailFile',
          message: `Thumbnail exceeds maximum size of ${MAX_THUMBNAIL_SIZE / (1024 * 1024)}MB`,
          level: 'error'
        })
      }

      const thumbExtension = data.thumbnailFile.name.toLowerCase().substring(data.thumbnailFile.name.lastIndexOf('.'))
      if (!SUPPORTED_IMAGE_EXTENSIONS.includes(thumbExtension)) {
        issues.push({
          field: 'thumbnailFile',
          message: `Unsupported image format. Supported formats: ${SUPPORTED_IMAGE_EXTENSIONS.join(', ')}`,
          level: 'error'
        })
      }
    } else {
      issues.push({
        field: 'thumbnailFile',
        message: 'Adding a thumbnail improves model discoverability',
        level: 'info'
      })
    }

    // Sample file validation
    if (data.enableSample && !data.sampleFile) {
      issues.push({
        field: 'sampleFile',
        message: 'Sample file is required when sample is enabled',
        level: 'error'
      })
    }

    if (data.sampleFile && data.sampleFile.size > 100 * 1024 * 1024) { // 100MB
      issues.push({
        field: 'sampleFile',
        message: 'Sample file should be smaller for faster downloads',
        level: 'warning'
      })
    }

    return {
      isValid: issues.filter(i => i.level === 'error').length === 0,
      issues,
      errorCount: issues.filter(i => i.level === 'error').length,
      warningCount: issues.filter(i => i.level === 'warning').length,
      infoCount: issues.filter(i => i.level === 'info').length
    }
  }, [data.modelFile, data.thumbnailFile, data.sampleFile, data.enableSample])

  const validatePricing = useMemo((): ValidationResult => {
    const issues: ValidationIssue[] = []

    // Price validation
    if (!data.price?.trim()) {
      issues.push({
        field: 'price',
        message: 'Price is required',
        level: 'error'
      })
    } else {
      const priceNum = parseFloat(data.price)
      
      if (isNaN(priceNum)) {
        issues.push({
          field: 'price',
          message: 'Price must be a valid number',
          level: 'error'
        })
      } else if (priceNum < MIN_PRICE) {
        issues.push({
          field: 'price',
          message: `Price must be at least ${MIN_PRICE} SUI`,
          level: 'error'
        })
      } else if (priceNum > MAX_PRICE) {
        issues.push({
          field: 'price',
          message: `Price cannot exceed ${MAX_PRICE} SUI`,
          level: 'error'
        })
      }

      // Pricing recommendations
      if (priceNum < 0.01) {
        issues.push({
          field: 'price',
          message: 'Very low price might indicate low value to buyers',
          level: 'info'
        })
      }

      if (priceNum > 100) {
        issues.push({
          field: 'price',
          message: 'High price might limit potential buyers',
          level: 'warning'
        })
      }
    }

    // Max downloads validation
    if (data.maxDownloads !== undefined) {
      if (data.maxDownloads <= 0) {
        issues.push({
          field: 'maxDownloads',
          message: 'Maximum downloads must be greater than 0',
          level: 'error'
        })
      } else if (data.maxDownloads > 10000) {
        issues.push({
          field: 'maxDownloads',
          message: 'Very high download limit might impact server resources',
          level: 'warning'
        })
      }

      if (data.maxDownloads === 1) {
        issues.push({
          field: 'maxDownloads',
          message: 'Single download limit might restrict usage',
          level: 'info'
        })
      }
    }

    // Access duration validation
    if (data.accessDuration !== undefined) {
      if (data.accessDuration < 1) {
        issues.push({
          field: 'accessDuration',
          message: 'Access duration must be at least 1 day',
          level: 'error'
        })
      } else if (data.accessDuration > 365) {
        issues.push({
          field: 'accessDuration',
          message: 'Access duration cannot exceed 365 days',
          level: 'error'
        })
      }

      if (data.accessDuration > 90) {
        issues.push({
          field: 'accessDuration',
          message: 'Long access duration might reduce recurring revenue',
          level: 'info'
        })
      }
    }

    return {
      isValid: issues.filter(i => i.level === 'error').length === 0,
      issues,
      errorCount: issues.filter(i => i.level === 'error').length,
      warningCount: issues.filter(i => i.level === 'warning').length,
      infoCount: issues.filter(i => i.level === 'info').length
    }
  }, [data.price, data.maxDownloads, data.accessDuration])

  const validateSecurity = useMemo((): ValidationResult => {
    const issues: ValidationIssue[] = []

    // Encryption recommendations
    if (!data.enableEncryption) {
      issues.push({
        field: 'enableEncryption',
        message: 'Enabling encryption is recommended for valuable models',
        level: 'warning'
      })
    }

    // Policy type validation
    if (data.enableEncryption && !data.policyType) {
      issues.push({
        field: 'policyType',
        message: 'Access policy is required when encryption is enabled',
        level: 'error'
      })
    }

    // Privacy recommendations
    if (data.isPrivate && (!data.allowedBuyers || data.allowedBuyers.length === 0)) {
      issues.push({
        field: 'allowedBuyers',
        message: 'Private listings should specify allowed buyers',
        level: 'warning'
      })
    }

    if (data.allowedBuyers && data.allowedBuyers.length > 100) {
      issues.push({
        field: 'allowedBuyers',
        message: 'Large allowlist might impact performance',
        level: 'warning'
      })
    }

    // Expiry validation
    if (data.expiryDays !== undefined) {
      if (data.expiryDays < 1) {
        issues.push({
          field: 'expiryDays',
          message: 'Expiry must be at least 1 day',
          level: 'error'
        })
      } else if (data.expiryDays > 3650) { // 10 years
        issues.push({
          field: 'expiryDays',
          message: 'Expiry cannot exceed 10 years',
          level: 'error'
        })
      }

      if (data.expiryDays < 7) {
        issues.push({
          field: 'expiryDays',
          message: 'Very short expiry might limit buyer interest',
          level: 'info'
        })
      }
    }

    return {
      isValid: issues.filter(i => i.level === 'error').length === 0,
      issues,
      errorCount: issues.filter(i => i.level === 'error').length,
      warningCount: issues.filter(i => i.level === 'warning').length,
      infoCount: issues.filter(i => i.level === 'info').length
    }
  }, [data.enableEncryption, data.policyType, data.isPrivate, data.allowedBuyers, data.expiryDays])

  const stepValidations: StepValidation = useMemo(() => ({
    basicInfo: validateBasicInfo,
    files: validateFiles,
    pricing: validatePricing,
    security: validateSecurity
  }), [validateBasicInfo, validateFiles, validatePricing, validateSecurity])

  const overallValidation = useMemo((): ValidationResult => {
    const allIssues = Object.values(stepValidations).flatMap(v => v.issues)
    
    return {
      isValid: allIssues.filter(i => i.level === 'error').length === 0,
      issues: allIssues,
      errorCount: allIssues.filter(i => i.level === 'error').length,
      warningCount: allIssues.filter(i => i.level === 'warning').length,
      infoCount: allIssues.filter(i => i.level === 'info').length
    }
  }, [stepValidations])

  const getStepValidation = (stepName: string): ValidationResult => {
    return stepValidations[stepName] || {
      isValid: true,
      issues: [],
      errorCount: 0,
      warningCount: 0,
      infoCount: 0
    }
  }

  const getFieldIssues = (fieldName: string): ValidationIssue[] => {
    return overallValidation.issues.filter(issue => issue.field === fieldName)
  }

  const isStepValid = (stepName: string): boolean => {
    return getStepValidation(stepName).isValid
  }

  const canProceedToStep = (stepIndex: number): boolean => {
    const stepNames = Object.keys(stepValidations)
    
    // Can always proceed to first step
    if (stepIndex === 0) return true
    
    // Check if all previous steps are valid
    for (let i = 0; i < stepIndex; i++) {
      if (!isStepValid(stepNames[i])) {
        return false
      }
    }
    
    return true
  }

  return {
    // Individual step validations
    stepValidations,
    
    // Overall validation
    overallValidation,
    
    // Utility functions
    getStepValidation,
    getFieldIssues,
    isStepValid,
    canProceedToStep,
    
    // Quick checks
    isValid: overallValidation.isValid,
    hasErrors: overallValidation.errorCount > 0,
    hasWarnings: overallValidation.warningCount > 0,
    hasInfo: overallValidation.infoCount > 0
  }
}