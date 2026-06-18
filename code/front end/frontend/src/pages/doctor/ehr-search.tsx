import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import { AlertTriangle, ExternalLink, Search, User } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useNavigate } from 'react-router-dom'

import { EHR_KEYS, EHR_UI } from '../../constants/ehr'
import PatientPageShell from '../../components/patient/patient-page-shell'
import ehrApi from '../../services/ehr-service'
import type { EhrSearchResultItem } from '../../types/ehr'

type SearchFormValues = {
  condition: string
  dateFrom: string
  dateTo: string
  medication: string
  severity: string
  symptom: string
}

export default function EHRSearch() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [results, setResults] = useState<EhrSearchResultItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  const loadAll = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await ehrApi.searchPatients({})
      setResults((response.data?.data ?? response.data ?? []) as EhrSearchResultItem[])
      setSearched(true)
    } catch (caughtError) {
      console.error('Failed to load EHR patients', caughtError)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  const copy = {
    common: {
      reset: t(EHR_KEYS.common.reset),
    },
    search: {
      title: t(EHR_KEYS.search.title),
      subtitle: t(EHR_KEYS.search.subtitle),
      validation: t(EHR_KEYS.search.validation),
      searchError: t(EHR_KEYS.search.searchError),
      symptom: t(EHR_KEYS.search.symptom),
      symptomPlaceholder: t(EHR_KEYS.search.symptomPlaceholder),
      medication: t(EHR_KEYS.search.medication),
      medicationPlaceholder: t(EHR_KEYS.search.medicationPlaceholder),
      condition: t(EHR_KEYS.search.condition),
      conditionPlaceholder: t(EHR_KEYS.search.conditionPlaceholder),
      dateFrom: t(EHR_KEYS.search.dateFrom),
      dateTo: t(EHR_KEYS.search.dateTo),
      severity: t(EHR_KEYS.search.severity),
      viewEhr: t(EHR_KEYS.search.viewEhr),
      submit: t(EHR_KEYS.search.submit),
      columns: {
        patient: t(EHR_KEYS.search.columns.patient),
        email: t(EHR_KEYS.search.columns.email),
        totalNotes: t(EHR_KEYS.search.columns.totalNotes),
        findings: t(EHR_KEYS.search.columns.findings),
        actions: t(EHR_KEYS.search.columns.actions),
      },
      severityOptions: {
        all: t(EHR_KEYS.search.severityOptions.all),
        mild: t(EHR_KEYS.search.severityOptions.mild),
        moderate: t(EHR_KEYS.search.severityOptions.moderate),
        severe: t(EHR_KEYS.search.severityOptions.severe),
      },
    },
  }

  const searchSchema = yup.object({
    condition: yup.string(),
    dateFrom: yup.string(),
    dateTo: yup.string(),
    medication: yup.string(),
    severity: yup.string(),
    symptom: yup.string(),
  })

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<SearchFormValues>({
    defaultValues: {
      condition: '',
      dateFrom: '',
      dateTo: '',
      medication: '',
      severity: '',
      symptom: '',
    },
    resolver: yupResolver(searchSchema),
  })

  const columns: GridColDef<EhrSearchResultItem>[] = [
    {
      field: 'patientName',
      headerName: copy.search.columns.patient,
      flex: 2,
      minWidth: 220,
      renderCell: ({ row }: GridRenderCellParams<EhrSearchResultItem>) => (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ height: '100%' }}>
          <Box sx={{ bgcolor: 'var(--color-primary-100)', p: 0.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{row.patientName}</Typography>
        </Stack>
      ),
    },
    {
      field: 'email',
      headerName: copy.search.columns.email,
      flex: 1.5,
      minWidth: 180,
    },
    {
      field: 'totalNotes',
      headerName: copy.search.columns.totalNotes,
      flex: 1,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ value }: GridRenderCellParams<EhrSearchResultItem, number>) => (
        <Chip label={value ?? 0} size="small" />
      ),
    },
    {
      field: 'findings',
      headerName: copy.search.columns.findings,
      flex: 3,
      minWidth: 300,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<EhrSearchResultItem>) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} alignItems="center" sx={{ height: '100%', width: '100%' }}>
          {[...(row.matchedConditions ?? []), ...(row.matchedMedications ?? []), ...(row.matchedSymptoms ?? [])]
            .slice(0, EHR_UI.previewEntityCount)
            .map((item) => (
              <Chip key={`${row.patientId}-${item}`} label={item} size="small" />
            ))}
        </Stack>
      ),
    },
    {
      field: 'actions',
      headerName: copy.search.columns.actions,
      flex: 1.2,
      minWidth: 140,
      align: 'right',
      headerAlign: 'right',
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<EhrSearchResultItem>) => (
        <Button
          size="small"
          variant="text"
          startIcon={<ExternalLink size={16} />}
          onClick={() => navigate(`${EHR_KEYS.navigation.summaryBase}/${row.patientId}`)}
        >
          {copy.search.viewEhr}
        </Button>
      ),
    },
  ]

  const handleSearch = async (data: SearchFormValues) => {
    setLoading(true)
    setError('')

    try {
      const queryParams = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== ''),
      )
      const response = await ehrApi.searchPatients(queryParams)
      setResults((response.data?.data ?? response.data ?? []) as EhrSearchResultItem[])
      setSearched(true)
    } catch (caughtError) {
      console.error('Failed to search EHR patients', caughtError)
      setError(copy.search.searchError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PatientPageShell title={copy.search.title} subtitle={copy.search.subtitle} maxWidth="xl" transparent>
      <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid var(--color-surface-200)', bgcolor: 'background.paper', mb: 5, width: '100%' }}>
        <form onSubmit={handleSubmit(handleSearch)}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Controller
                name="symptom"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label={copy.search.symptom} placeholder={copy.search.symptomPlaceholder} />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Controller
                name="medication"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label={copy.search.medication} placeholder={copy.search.medicationPlaceholder} />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Controller
                name="condition"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label={copy.search.condition} placeholder={copy.search.conditionPlaceholder} />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Controller
                name="dateFrom"
                control={control}
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    fullWidth 
                    label={copy.search.dateFrom} 
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& input::-webkit-datetime-edit': {
                        color: field.value ? 'inherit' : 'transparent'
                      },
                      '& input:focus::-webkit-datetime-edit': {
                        color: 'inherit'
                      }
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Controller
                name="dateTo"
                control={control}
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    fullWidth 
                    label={copy.search.dateTo} 
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& input::-webkit-datetime-edit': {
                        color: field.value ? 'inherit' : 'transparent'
                      },
                      '& input:focus::-webkit-datetime-edit': {
                        color: 'inherit'
                      }
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Controller
                name="severity"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label={copy.search.severity}>
                    <MenuItem value="">{copy.search.severityOptions.all}</MenuItem>
                    <MenuItem value="MILD">{copy.search.severityOptions.mild}</MenuItem>
                    <MenuItem value="MODERATE">{copy.search.severityOptions.moderate}</MenuItem>
                    <MenuItem value="SEVERE">{copy.search.severityOptions.severe}</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={12}>
              {errors.root?.message ? (
                <Alert severity="warning" icon={<AlertTriangle size={20} />} sx={{ mb: 2 }}>
                  {errors.root.message}
                </Alert>
              ) : null}
              {error ? <Alert severity="error">{error}</Alert> : null}
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => {
                    reset()
                    void loadAll()
                    setError('')
                  }}
                >
                  {copy.common.reset}
                </Button>
                <Button type="submit" variant="contained" startIcon={loading ? undefined : <Search size={18} />}>
                  {loading ? <CircularProgress size={18} color="inherit" /> : copy.search.submit}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {searched ? (
        <Paper sx={{ height: 640, borderRadius: 4, border: '1px solid var(--color-surface-200)', bgcolor: 'background.paper' }}>
          <DataGrid
            rows={results}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.patientId}
            pageSizeOptions={EHR_UI.searchPageSizeOptions}
          />
        </Paper>
      ) : null}
    </PatientPageShell>
  )
}
