import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, CircularProgress, Grid, Paper, Skeleton, Stack, Tooltip, Typography } from '@mui/material'
import { Activity, AlertCircle, Calendar, ChevronDown, ChevronLeft, FileText, Pill, PlusCircle, Thermometer } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { EHR_KEYS, EHR_UI } from '../../constants/ehr'
import PatientPageShell from '../../components/patient/patient-page-shell'
import ehrApi from '../../services/ehr-service'
import type { EhrEntity, EhrExtractionResult, EhrPatientSummary, EhrSummaryCacheItem, EhrSummaryNote } from '../../types/ehr'

const SUMMARY_STYLE = {
  cardBorder: '1px solid var(--color-surface-200)',
  cardRadius: 4,
  sectionGap: 3,
  hoverBorder: 'var(--color-primary-500)',
} as const

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
    const key = `${entity.entityType}__${entity.entityValue}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

type HighlightSegment =
  | string
  | {
      content: string
      entity: EhrEntity
      type: 'highlight'
    }

const createHighlightedSegments = (rawText: string, entities: EhrEntity[]): HighlightSegment[] => {
  if (!rawText || entities.length === 0) {
    return [rawText]
  }

  const processedEntities = entities
    .map((entity) => {
      let start = entity.startPosition ?? -1
      let end = entity.endPosition ?? -1

      if (start >= 0 && end >= 0) {
        const extracted = rawText.substring(start, end)
        if (extracted !== entity.entityValue) {
          let fallbackIndex = -1
          const searchStart = Math.max(0, start - 20)
          fallbackIndex = rawText.indexOf(entity.entityValue, searchStart)
          
          if (fallbackIndex < 0) {
            fallbackIndex = rawText.indexOf(entity.entityValue)
          }

          if (fallbackIndex < 0) {
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
          }
        }
      } else {
        const fallbackIndex = rawText.indexOf(entity.entityValue)
        if (fallbackIndex >= 0) {
          start = fallbackIndex
          end = fallbackIndex + entity.entityValue.length
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
    segments.push({ content: rawText.substring(entity.start, entity.end), entity, type: 'highlight' })
    lastIndex = entity.end
  })

  if (lastIndex < rawText.length) {
    segments.push(rawText.substring(lastIndex))
  }

  return segments
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) {
    return EHR_KEYS.common.unknownDate
  }

  try {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return dateString
  }
}

export default function EHRSummary() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { patientId } = useParams<{ patientId: string }>()
  const [summary, setSummary] = useState<EhrPatientSummary | null>(null)
  const [notes, setNotes] = useState<EhrSummaryNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [noteEntitiesCache, setNoteEntitiesCache] = useState<Record<number, EhrSummaryCacheItem>>({})

  useEffect(() => {
    const fetchSummary = async () => {
      if (!patientId) {
        setError(t(EHR_KEYS.summary.loadError))
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const [summaryResponse, notesResponse] = await Promise.all([
          ehrApi.getPatientSummary(patientId),
          ehrApi.getNotesByPatient(patientId),
        ])

        setSummary((summaryResponse.data?.data ?? summaryResponse.data) as EhrPatientSummary)
        setNotes(((notesResponse.data?.data ?? notesResponse.data ?? []) as EhrSummaryNote[]).sort(
          (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        ))
      } catch (caughtError) {
        console.error('Failed to fetch EHR summary', caughtError)
        setError(t(EHR_KEYS.summary.loadError))
      } finally {
        setLoading(false)
      }
    }

    void fetchSummary()
  }, [patientId])

  const loadNoteEntities = async (noteId: number) => {
    if (noteEntitiesCache[noteId]) {
      return
    }

    setNoteEntitiesCache((currentCache) => ({
      ...currentCache,
      [noteId]: { entities: [], error: '', loading: true },
    }))

    try {
      const response = await ehrApi.getEntitiesByNote(noteId)
      const extractionResult = (response.data?.data ?? response.data) as EhrExtractionResult
      setNoteEntitiesCache((currentCache) => ({
        ...currentCache,
        [noteId]: {
          entities: getAllEntities(extractionResult),
          error: '',
          loading: false,
        },
      }))
    } catch (caughtError) {
      console.error('Failed to load note entities', caughtError)
      setNoteEntitiesCache((currentCache) => ({
        ...currentCache,
        [noteId]: {
          entities: [],
      error: t(EHR_KEYS.summary.entityLoadError),
          loading: false,
        },
      }))
    }
  }

  const noteHighlights = useMemo(() => {
    return notes.reduce<Record<number, HighlightSegment[]>>((accumulator, note) => {
      const cachedItem = noteEntitiesCache[note.id]
      accumulator[note.id] = createHighlightedSegments(note.rawText ?? '', cachedItem?.entities ?? [])
      return accumulator
    }, {})
  }, [noteEntitiesCache, notes])

  if (loading) {
    return (
      <PatientPageShell title={t(EHR_KEYS.summary.loadingTitle)} subtitle={t(EHR_KEYS.summary.loadingSubtitle)} maxWidth="xl" transparent>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 4, mb: 3 }} />
            <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={3}>
              {EHR_UI.skeletonCards.map((item) => (
                <Skeleton key={item} variant="rectangular" height={180} sx={{ borderRadius: 4 }} />
              ))}
            </Stack>
          </Grid>
        </Grid>
      </PatientPageShell>
    )
  }

  if (error) {
    return (
      <PatientPageShell title={t(EHR_KEYS.summary.loadingTitle)} subtitle={t(EHR_KEYS.summary.errorSubtitle)} maxWidth="xl" transparent>
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <AlertCircle size={64} />
        <Typography variant="h5" sx={{ mt: 2, fontWeight: 700 }}>
          {error}
        </Typography>
        <Button variant="contained" sx={{ mt: 3 }} onClick={() => globalThis.location.reload()}>
          {t(EHR_KEYS.common.retry)}
        </Button>
      </Box>
    </PatientPageShell>
    )
  }

  return (
    <PatientPageShell
      title={`${t(EHR_KEYS.summary.titlePrefix)} ${summary?.patientName ?? ''}`}
      subtitle={t(EHR_KEYS.summary.overviewSubtitle)}
      maxWidth="xl"
      transparent
    >
      <Box sx={{ mb: 4 }}>
        <Button variant="text" startIcon={<ChevronLeft size={16} />} onClick={() => navigate(EHR_KEYS.navigation.search)}>
          {t(EHR_KEYS.summary.searchBack)}
        </Button>

        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mt: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {summary?.patientName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t(EHR_KEYS.common.patientIdentifierPrefix)} {summary?.patientId}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PlusCircle size={18} />}
            onClick={() => navigate(`${EHR_KEYS.navigation.upload}?patientId=${summary?.patientId}`)}
          >
            {t(EHR_KEYS.summary.newNote)}
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileText size={22} /> {t(EHR_KEYS.summary.clinicalHistory)} ({notes.length})
          </Typography>

          {notes.length === 0 ? (
            <Paper sx={{ p: 6, borderRadius: SUMMARY_STYLE.cardRadius, textAlign: 'center', border: SUMMARY_STYLE.cardBorder }}>
              <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {t(EHR_KEYS.summary.noNotes)}
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {notes.map((note) => {
                const cacheItem = noteEntitiesCache[note.id] ?? { entities: [], error: '', loading: false }
                return (
                  <Accordion
                    key={note.id}
                    onChange={(_event, expanded) => {
                      if (expanded) {
                        void loadNoteEntities(note.id)
                      }
                    }}
                    sx={{
                      borderRadius: `${SUMMARY_STYLE.cardRadius * EHR_UI.summaryAccordionRadiusMultiplier}px !important`,
                      border: SUMMARY_STYLE.cardBorder,
                    }}
                  >
                    <AccordionSummary expandIcon={<ChevronDown size={18} />}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
                        <Stack spacing={0.5}>
                          <Typography sx={{ fontWeight: 800 }}>{note.noteType ?? 'NOTE'}</Typography>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Calendar size={14} />
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                {formatDate(note.createdAt)}
                              </Typography>
                            </Box>
                            <Chip label={`${note.entityCount ?? 0} ${t(EHR_KEYS.summary.entityCountSuffix)}`} size="small" />
                          </Stack>
                        </Stack>
                        <Chip
                          label={note.extractionStatus ?? 'PROCESSING'}
                          color={
                            note.extractionStatus === 'COMPLETED'
                              ? 'success'
                              : note.extractionStatus === 'FAILED'
                                ? 'error'
                                : 'warning'
                          }
                          size="small"
                        />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      {cacheItem.loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                          <CircularProgress size={28} />
                        </Box>
                      ) : cacheItem.error ? (
                        <Alert severity="error">{cacheItem.error}</Alert>
                      ) : (
                        <Stack spacing={3}>
                          <Box sx={{ p: 3, borderRadius: SUMMARY_STYLE.cardRadius, border: SUMMARY_STYLE.cardBorder, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                            {noteHighlights[note.id]?.map((segment, index) => {
                              if (typeof segment === 'string') {
                                // eslint-disable-next-line react/no-array-index-key
                                return <span key={index}>{segment}</span>
                              }
                              return (
                                // eslint-disable-next-line react/no-array-index-key
                                <Tooltip key={index} title={segment.entity.entityType} arrow>
                                  <Box
                                    component="mark"
                                    sx={{
                                      bgcolor: 'var(--color-surface-100)',
                                      color: 'text.primary',
                                      borderBottom: '2px solid var(--color-primary-500)',
                                      px: 0.5,
                                      mx: 0.2,
                                      borderRadius: 1,
                                    }}
                                  >
                                    {segment.content}
                                  </Box>
                                </Tooltip>
                              )
                            })}
                          </Box>

                          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                            {cacheItem.entities.map((entity) => (
                              <Chip
                                key={`${entity.entityType}-${entity.entityValue}`}
                                label={`${entity.entityValue} (${entity.entityType})`}
                                size="small"
                              />
                            ))}
                          </Stack>
                        </Stack>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )
              })}
            </Stack>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={SUMMARY_STYLE.sectionGap}>
            <Paper sx={{ p: 3, borderRadius: SUMMARY_STYLE.cardRadius, border: SUMMARY_STYLE.cardBorder }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Activity size={20} /> {t(EHR_KEYS.summary.pageTitle)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t(EHR_KEYS.summary.overviewSubtitle)}
              </Typography>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: SUMMARY_STYLE.cardRadius, border: SUMMARY_STYLE.cardBorder }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Pill size={20} /> {t(EHR_KEYS.common.extractedTitle)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {notes.length} {t(EHR_KEYS.summary.entityCountSuffix)}
              </Typography>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: SUMMARY_STYLE.cardRadius, border: SUMMARY_STYLE.cardBorder }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Thermometer size={20} /> {t(EHR_KEYS.common.originalTextTitle)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {summary?.patientName ?? t(EHR_KEYS.common.noValue)}
              </Typography>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </PatientPageShell>
  )
}
