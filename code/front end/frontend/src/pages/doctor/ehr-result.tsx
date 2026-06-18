import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, Chip, Container, Grid, Paper, Skeleton, Stack, Tooltip, Typography, IconButton } from '@mui/material'
import { AlertCircle, ChevronLeft, Download, FileText, Activity, Pill, TestTube, Thermometer } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { EHR_KEYS, EHR_UI } from '../../constants/ehr'
import ehrApi from '../../services/ehr-service'
import type { EhrEntity, EhrExtractionResult } from '../../types/ehr'

const ENTITY_STYLES: Record<string, { border: string; chipColor: 'error' | 'info' | 'primary' | 'success' | 'warning', icon: React.ReactNode }> = {
  CONDITION: { border: 'var(--color-warning)', chipColor: 'warning', icon: <Activity size={18} /> },
  DOSAGE: { border: 'var(--color-primary-500)', chipColor: 'primary', icon: <Pill size={18} /> },
  LAB_TEST: { border: 'var(--color-info)', chipColor: 'info', icon: <TestTube size={18} /> },
  MEDICATION: { border: 'var(--color-info)', chipColor: 'info', icon: <Pill size={18} /> },
  PROCEDURE: { border: 'var(--color-accent-500)', chipColor: 'error', icon: <Activity size={18} /> },
  SYMPTOM: { border: 'var(--color-danger)', chipColor: 'error', icon: <Thermometer size={18} /> },
}

type HighlightSegment =
  | string
  | {
      content: string
      entity: EhrEntity
      type: 'highlight'
    }

const getAllEntities = (result: EhrExtractionResult) => {
  const combinedEntities = [
    ...(result.entities ?? []),
    ...(result.medications ?? []),
    ...(result.symptoms ?? []),
    ...(result.conditions ?? []),
    ...(result.dosages ?? []),
    ...(result.labTests ?? []),
    ...(result.procedures ?? []),
  ]

  const seen = new Set<string>()
  return combinedEntities.filter((entity) => {
    const entityKey = `${entity.entityType}__${entity.entityValue}`
    if (seen.has(entityKey)) {
      return false
    }
    seen.add(entityKey)
    return true
  })
}

const createHighlightedSegments = (rawText: string, entities: EhrEntity[]): HighlightSegment[] => {
  if (!rawText || entities.length === 0) {
    return [rawText]
  }

  const processedEntities = entities
    .map((entity) => {
      let start = entity.startPosition ?? -1
      let end = entity.endPosition ?? -1

      // Validate the indices. AI often returns byte-based indices, causing misalignment with JS UTF-16 strings.
      const isMisaligned = start >= 0 && end >= 0 && rawText.substring(start, end) !== entity.entityValue

      if (start < 0 || end < 0 || isMisaligned) {
        let fallbackIndex = -1
        const searchStart = Math.max(0, start - 30) // Search near the expected start
        
        fallbackIndex = rawText.indexOf(entity.entityValue, searchStart)
        
        if (fallbackIndex < 0) {
          fallbackIndex = rawText.indexOf(entity.entityValue)
        }
        
        if (fallbackIndex < 0) {
          // Fallback to case-insensitive search if exact match fails
          const lowerRaw = rawText.toLowerCase()
          const lowerVal = entity.entityValue.toLowerCase()
          fallbackIndex = lowerRaw.indexOf(lowerVal, searchStart)
          if (fallbackIndex < 0) {
            fallbackIndex = lowerRaw.indexOf(lowerVal)
          }
        }

        if (fallbackIndex >= 0) {
          start = fallbackIndex
          end = fallbackIndex + entity.entityValue.length
        } else {
          start = -1
          end = -1
        }
      }

      return {
        ...entity,
        end,
        start,
      }
    })
    .filter((entity) => entity.start >= 0 && entity.end > entity.start)
    .sort((left, right) => left.start - right.start)

  const nonOverlappingEntities: typeof processedEntities = []
  processedEntities.forEach((entity) => {
    const previousEntity = nonOverlappingEntities.at(-1)
    if (!previousEntity || entity.start >= previousEntity.end) {
      nonOverlappingEntities.push(entity)
    }
  })

  const segments: HighlightSegment[] = []
  let lastIndex = 0

  nonOverlappingEntities.forEach((entity) => {
    if (entity.start > lastIndex) {
      segments.push(rawText.substring(lastIndex, entity.start))
    }

    segments.push({
      content: rawText.substring(entity.start, entity.end),
      entity,
      type: 'highlight',
    })

    lastIndex = entity.end
  })

  if (lastIndex < rawText.length) {
    segments.push(rawText.substring(lastIndex))
  }

  return segments
}

const getStatusColor = (status?: string | null): 'success' | 'error' | 'warning' => {
  if (status === 'COMPLETED') return 'success'
  if (status === 'FAILED') return 'error'
  return 'warning'
}

export default function EHRResult() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { noteId } = useParams<{ noteId: string }>()
  const [result, setResult] = useState<EhrExtractionResult | null>(null)
  const [entities, setEntities] = useState<EhrEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchResult = async () => {
      if (!noteId) {
        setError(t(EHR_KEYS.result.loadError))
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await ehrApi.getEntitiesByNote(noteId)
        const extractionResult = (response.data?.data ?? response.data) as EhrExtractionResult
        setResult(extractionResult)
        setEntities(getAllEntities(extractionResult))
      } catch (caughtError) {
        console.error('Failed to fetch EHR result', caughtError)
        setError(t(EHR_KEYS.result.loadError))
      } finally {
        setLoading(false)
      }
    }

    void fetchResult()
  }, [noteId, t])

  const highlightedSegments = useMemo(() => {
    return createHighlightedSegments(result?.rawText ?? '', entities)
  }, [entities, result?.rawText])

  const categorizedEntities = useMemo(() => {
    return entities.reduce<Record<string, EhrEntity[]>>((accumulator, entity) => {
      const categoryKey = entity.entityType
      if (!accumulator[categoryKey]) {
        accumulator[categoryKey] = []
      }
      accumulator[categoryKey].push(entity)
      return accumulator
    }, {})
  }, [entities])

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={2}>
              {EHR_UI.skeletonCards.map((item) => (
                <Skeleton key={item} variant="rectangular" height={150} sx={{ borderRadius: 4 }} />
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 10, textAlign: 'center' }}>
        <AlertCircle size={64} style={{ color: 'var(--color-danger)' }} />
        <Typography variant="h5" sx={{ mt: 2, fontWeight: 700 }}>
          {error}
        </Typography>
        <Button variant="contained" sx={{ mt: 4, borderRadius: 8, px: 4 }} onClick={() => globalThis.location.reload()}>
          {t(EHR_KEYS.common.retry)}
        </Button>
      </Container>
    )
  }

  return (
    <Box sx={{ bgcolor: 'var(--color-surface-50)', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Button
            variant="text"
            startIcon={<ChevronLeft size={18} />}
            onClick={() => navigate(EHR_KEYS.navigation.upload)}
            sx={{ color: 'text.secondary', fontWeight: 600, mb: 1 }}
          >
            {t(EHR_KEYS.result.listLabel)}
          </Button>
          <Stack 
            direction="row" 
            justifyContent="space-between" 
            alignItems="flex-start" 
            spacing={3}
            flexWrap="wrap"
            sx={{ mt: 1 }}
          >
            <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" sx={{ mb: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--color-text-900)', fontSize: { xs: '2rem', md: '2.5rem' }, wordBreak: 'break-word' }}>
                  {t(EHR_KEYS.common.extractedTitle)}
                </Typography>
                <Chip
                  label={result?.extractionStatus ?? 'PROCESSING'}
                  color={getStatusColor(result?.extractionStatus)}
                  sx={{ fontWeight: 700, borderRadius: 2, px: 1, flexShrink: 0 }}
                />
              </Stack>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {t(EHR_KEYS.common.patientIdentifierPrefix)} <strong style={{ color: 'var(--color-primary-600)' }}>#{result?.patientId || 'N/A'}</strong>
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flexShrink: 0, mt: { xs: 2, sm: 0 } }}>
              <Tooltip title={t(EHR_KEYS.result.downloadPdf)}>
                <IconButton sx={{ bgcolor: 'var(--color-surface-200)' }}>
                  <Download size={20} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 3, md: 5 }, 
                borderRadius: 4, 
                border: '1px solid var(--color-surface-200)', 
                borderTop: '4px solid var(--color-primary-500)',
                bgcolor: 'background.paper', 
                height: '100%',
                boxShadow: '0px 12px 24px -4px rgba(16, 24, 40, 0.04)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4, pb: 2, borderBottom: '1px solid var(--color-surface-200)' }}>
                <Box sx={{ p: 1, bgcolor: 'var(--color-primary-50)', borderRadius: 2, color: 'var(--color-primary-600)' }}>
                  <FileText size={24} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--color-text-900)' }}>
                  {t(EHR_KEYS.common.originalTextTitle)}
                </Typography>
              </Box>

              <Box sx={{ 
                lineHeight: 1.8, 
                fontSize: '1.05rem', 
                whiteSpace: 'pre-wrap', 
                color: 'var(--color-text-700)',
                fontFamily: 'var(--font-sans)',
              }}>
                {highlightedSegments.map((segment, index) => {
                  if (typeof segment === 'string') {
                    // eslint-disable-next-line react/no-array-index-key
                    return <span key={index}>{segment}</span>
                  }

                  const entityStyle = ENTITY_STYLES[segment.entity.entityType] ?? ENTITY_STYLES.CONDITION
                  const confidenceScore = Math.round(
                    (segment.entity.confidenceScore ?? 0) * EHR_UI.fullPercent,
                  )

                  return (
                    <Tooltip
                      // eslint-disable-next-line react/no-array-index-key
                      key={index}
                      title={
                        <Stack spacing={0.5} sx={{ p: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', opacity: 0.8 }}>
                            {segment.entity.entityType}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {t(EHR_KEYS.result.confidencePrefix)} {confidenceScore}{t(EHR_KEYS.common.percentSuffix)}
                          </Typography>
                        </Stack>
                      }
                      arrow
                      placement="top"
                    >
                      <Box
                        component="mark"
                        sx={{
                          bgcolor: `var(--color-${entityStyle.chipColor}-50)`,
                          color: `var(--color-${entityStyle.chipColor}-700)`,
                          borderBottom: `2px solid ${entityStyle.border}`,
                          px: 0.8,
                          mx: 0.2,
                          py: 0.2,
                          borderRadius: 1,
                          cursor: 'help',
                          fontWeight: 700,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: `var(--color-${entityStyle.chipColor}-100)`,
                            transform: 'translateY(-1px)',
                            boxShadow: `0 4px 6px -1px var(--color-${entityStyle.chipColor}-100)`
                          }
                        }}
                      >
                        {segment.content}
                      </Box>
                    </Tooltip>
                  )
                })}
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={3}>
              {Object.entries(categorizedEntities).map(([type, list]) => {
                const entityStyle = ENTITY_STYLES[type] ?? ENTITY_STYLES.CONDITION
                return (
                  <Paper 
                    key={type} 
                    elevation={0}
                    sx={{ 
                      borderRadius: 4, 
                      overflow: 'hidden', 
                      border: '1px solid var(--color-surface-200)', 
                      bgcolor: 'background.paper',
                      boxShadow: '0px 4px 12px -2px rgba(16, 24, 40, 0.02)'
                    }}
                  >
                    <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-surface-100)', bgcolor: 'var(--color-surface-50)' }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ color: `var(--color-${entityStyle.chipColor}-500)` }}>
                          {entityStyle.icon}
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'var(--color-text-900)' }}>
                          {type}
                        </Typography>
                      </Stack>
                      <Chip 
                        size="small" 
                        label={list.length} 
                        sx={{ 
                          bgcolor: `var(--color-${entityStyle.chipColor}-100)`, 
                          color: `var(--color-${entityStyle.chipColor}-700)`,
                          fontWeight: 800
                        }} 
                      />
                    </Box>
                    <Stack spacing={2} sx={{ p: 2.5 }}>
                      {list.map((entity) => {
                        const confidenceScore = Math.round(
                          (entity.confidenceScore ?? 0) * EHR_UI.fullPercent,
                        )
                        return (
                          <Box 
                            key={`${entity.entityType}-${entity.entityValue}`} 
                            sx={{ 
                              p: 2, 
                              borderRadius: 3, 
                              border: '1px solid var(--color-surface-200)',
                              transition: 'all 0.2s',
                              '&:hover': {
                                borderColor: `var(--color-${entityStyle.chipColor}-300)`,
                                bgcolor: `var(--color-${entityStyle.chipColor}-50)`,
                              }
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                              <Box>
                                <Typography sx={{ fontWeight: 700, color: 'var(--color-text-900)' }}>
                                  {entity.entityValue}
                                </Typography>
                                {entity.normalizedValue && entity.normalizedValue !== entity.entityValue ? (
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', mt: 0.5 }}>
                                    Standard: {entity.normalizedValue}
                                  </Typography>
                                ) : null}
                              </Box>
                              <Chip
                                size="small"
                                label={`${confidenceScore}${t(EHR_KEYS.common.percentSuffix)}`}
                                color={confidenceScore >= EHR_UI.successConfidenceThreshold ? 'success' : 'warning'}
                                sx={{ fontWeight: 800, borderRadius: 2 }}
                              />
                            </Stack>
                          </Box>
                        )
                      })}
                    </Stack>
                  </Paper>
                )
              })}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
