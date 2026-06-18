import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import { DataGrid, type GridColDef, type GridRowParams } from '@mui/x-data-grid'
import {
  Close,
  FilterList,
  HistoryEdu,
  LocalHospital,
  Person,
  Search,
  Timeline,
  Visibility,
} from '@mui/icons-material'

import TableActionCell from '../../components/common/table-action-cell'
import PatientPageShell from '../../components/patient/patient-page-shell'
import { DOCTOR_PATIENTS_KEYS, DOCTOR_PATIENTS_UI } from '../../constants/doctor-patients'
import doctorApi from '../../services/doctor-service'
import type {
  DoctorPatientDetail,
  DoctorPatientDetailResponse,
  DoctorPatientKpiFilter,
  DoctorPatientListItem,
  DoctorPatientsPageResponse,
  DoctorPatientRelationshipSource,
  DoctorPatientTicketStatus,
} from '../../types/doctor-patients'

const STATUS_CHIP_COLORS = {
  NEW: 'info',
  IN_TRIAGE: 'warning',
  TRIAGED: 'success',
  CLOSED: 'default',
  REJECTED: 'error',
} as const

const PAGE_STYLE = {
  glassBackground: 'var(--glass-surface)',
  glassBorder: '1px solid var(--glass-border)',
  cardShadow: 'var(--shadow-card)',
  drawerShadow: 'var(--shadow-elevated)',
  borderRadius: 4,
  compactBorderRadius: 3,
  iconSize: 22,
  avatarSize: 56,
  detailAvatarSize: 96,
  panelPadding: 3,
  sectionGap: 3,
  largeGap: 4,
} as const

type CountsState = {
  all: number
  upcoming: number
  records: number
  triage: number
}

const EMPTY_COUNTS: CountsState = {
  all: 0,
  upcoming: 0,
  records: 0,
  triage: 0,
}

const getPatientRows = (response: DoctorPatientsPageResponse) => response.data?.data?.content ?? []
const getPatientTotal = (response: DoctorPatientsPageResponse) => response.data?.data?.totalElements ?? 0
const getPatientDetail = (response: DoctorPatientDetailResponse) => response.data?.data ?? null

export default function DoctorPatients() {
  const theme = useTheme()
  const { t } = useTranslation()
  const [patients, setPatients] = useState<DoctorPatientListItem[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(DOCTOR_PATIENTS_UI.firstPage)
  const [pageSize, setPageSize] = useState(DOCTOR_PATIENTS_UI.defaultPageSize)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [relationshipSource, setRelationshipSource] = useState<DoctorPatientRelationshipSource>('ALL')
  const [ticketStatus, setTicketStatus] = useState<DoctorPatientTicketStatus>('ALL')
  const [kpiFilter, setKpiFilter] = useState<DoctorPatientKpiFilter>('ALL')
  const [detailOpen, setDetailOpen] = useState(false)
  const [patientDetail, setPatientDetail] = useState<DoctorPatientDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [counts, setCounts] = useState<CountsState>(EMPTY_COUNTS)

  const copy = {
    pageTitle: t(DOCTOR_PATIENTS_KEYS.pageTitle),
    subtitle: t(DOCTOR_PATIENTS_KEYS.subtitle),
    searchPlaceholder: t(DOCTOR_PATIENTS_KEYS.searchPlaceholder),
    sourceFilterLabel: t(DOCTOR_PATIENTS_KEYS.sourceFilterLabel),
    ticketStatusLabel: t(DOCTOR_PATIENTS_KEYS.ticketStatusLabel),
    allStatuses: t(DOCTOR_PATIENTS_KEYS.allStatuses),
    loadingDetail: t(DOCTOR_PATIENTS_KEYS.loadingDetail),
    loadError: t(DOCTOR_PATIENTS_KEYS.loadError),
    detailError: t(DOCTOR_PATIENTS_KEYS.detailError),
    table: {
      patient: t(DOCTOR_PATIENTS_KEYS.table.patient),
      ageGender: t(DOCTOR_PATIENTS_KEYS.table.ageGender),
      relationshipSource: t(DOCTOR_PATIENTS_KEYS.table.relationshipSource),
      lastInteraction: t(DOCTOR_PATIENTS_KEYS.table.lastInteraction),
      nextAppointment: t(DOCTOR_PATIENTS_KEYS.table.nextAppointment),
      latestTicketStatus: t(DOCTOR_PATIENTS_KEYS.table.latestTicketStatus),
      actions: t(DOCTOR_PATIENTS_KEYS.table.actions),
    },
    source: {
      appointment: t(DOCTOR_PATIENTS_KEYS.source.appointment),
      medicalRecord: t(DOCTOR_PATIENTS_KEYS.source.medicalRecord),
      triageTicket: t(DOCTOR_PATIENTS_KEYS.source.triageTicket),
      unknown: t(DOCTOR_PATIENTS_KEYS.source.unknown),
    },
    gender: {
      male: t(DOCTOR_PATIENTS_KEYS.gender.male),
      female: t(DOCTOR_PATIENTS_KEYS.gender.female),
      other: t(DOCTOR_PATIENTS_KEYS.gender.other),
      missingAge: t(DOCTOR_PATIENTS_KEYS.gender.missingAge),
      ageSuffix: t(DOCTOR_PATIENTS_KEYS.gender.ageSuffix),
      separator: t(DOCTOR_PATIENTS_KEYS.gender.separator),
    },
    latestTicketStatus: {
      none: t(DOCTOR_PATIENTS_KEYS.latestTicketStatus.none),
      NEW: t(DOCTOR_PATIENTS_KEYS.latestTicketStatus.NEW),
      IN_TRIAGE: t(DOCTOR_PATIENTS_KEYS.latestTicketStatus.IN_TRIAGE),
      TRIAGED: t(DOCTOR_PATIENTS_KEYS.latestTicketStatus.TRIAGED),
      CLOSED: t(DOCTOR_PATIENTS_KEYS.latestTicketStatus.CLOSED),
      REJECTED: t(DOCTOR_PATIENTS_KEYS.latestTicketStatus.REJECTED),
    },
    relationshipFilter: {
      all: t(DOCTOR_PATIENTS_KEYS.relationshipFilter.all),
      appointment: t(DOCTOR_PATIENTS_KEYS.relationshipFilter.appointment),
      medicalRecord: t(DOCTOR_PATIENTS_KEYS.relationshipFilter.medicalRecord),
      triageTicket: t(DOCTOR_PATIENTS_KEYS.relationshipFilter.triageTicket),
    },
    kpi: {
      all: t(DOCTOR_PATIENTS_KEYS.kpi.all),
      upcoming: t(DOCTOR_PATIENTS_KEYS.kpi.upcoming),
      records: t(DOCTOR_PATIENTS_KEYS.kpi.records),
      triage: t(DOCTOR_PATIENTS_KEYS.kpi.triage),
    },
    details: {
      overview: t(DOCTOR_PATIENTS_KEYS.details.overview),
      appointments: t(DOCTOR_PATIENTS_KEYS.details.appointments),
      records: t(DOCTOR_PATIENTS_KEYS.details.records),
      tickets: t(DOCTOR_PATIENTS_KEYS.details.tickets),
      identifierPrefix: t(DOCTOR_PATIENTS_KEYS.details.identifierPrefix),
      identifierSeparator: t(DOCTOR_PATIENTS_KEYS.details.identifierSeparator),
      adminInfo: t(DOCTOR_PATIENTS_KEYS.details.adminInfo),
      clinicalInfo: t(DOCTOR_PATIENTS_KEYS.details.clinicalInfo),
      fullName: t(DOCTOR_PATIENTS_KEYS.details.fullName),
      email: t(DOCTOR_PATIENTS_KEYS.details.email),
      phone: t(DOCTOR_PATIENTS_KEYS.details.phone),
      address: t(DOCTOR_PATIENTS_KEYS.details.address),
      bloodType: t(DOCTOR_PATIENTS_KEYS.details.bloodType),
      insurance: t(DOCTOR_PATIENTS_KEYS.details.insurance),
      allergies: t(DOCTOR_PATIENTS_KEYS.details.allergies),
      chronicConditions: t(DOCTOR_PATIENTS_KEYS.details.chronicConditions),
      emergencyContact: t(DOCTOR_PATIENTS_KEYS.details.emergencyContact),
      noValue: t(DOCTOR_PATIENTS_KEYS.details.noValue),
      unknownBloodType: t(DOCTOR_PATIENTS_KEYS.details.unknownBloodType),
      noInsurance: t(DOCTOR_PATIENTS_KEYS.details.noInsurance),
      noAllergy: t(DOCTOR_PATIENTS_KEYS.details.noAllergy),
      noChronicCondition: t(DOCTOR_PATIENTS_KEYS.details.noChronicCondition),
      noEmergencyContact: t(DOCTOR_PATIENTS_KEYS.details.noEmergencyContact),
    },
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'APPOINTMENT':
        return copy.source.appointment
      case 'MEDICAL_RECORD':
        return copy.source.medicalRecord
      case 'TRIAGE_TICKET':
        return copy.source.triageTicket
      default:
        return copy.source.unknown
    }
  }

  const getGenderLabel = (gender?: string | null) => {
    if (gender === 'MALE') return copy.gender.male
    if (gender === 'FEMALE') return copy.gender.female
    return copy.gender.other
  }

  const getLatestTicketLabel = (status?: string | null) => {
    if (!status) return copy.latestTicketStatus.none
    return copy.latestTicketStatus[status as keyof typeof copy.latestTicketStatus] ?? status
  }

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return copy.details.noValue
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const formatDateOnly = (dateString?: string | null) => {
    if (!dateString) return copy.details.noValue
    try {
      return new Date(dateString).toLocaleDateString('vi-VN')
    } catch {
      return dateString
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearch(search)
    }, DOCTOR_PATIENTS_UI.debounceMs)
    return () => clearTimeout(debounceTimer)
  }, [search])

  useEffect(() => {
    const resetTimer = setTimeout(() => {
      setPage(DOCTOR_PATIENTS_UI.firstPage)
    }, 0)
    return () => clearTimeout(resetTimer)
  }, [debouncedSearch, kpiFilter, relationshipSource, ticketStatus])

  const buildParams = useCallback(() => {
    const params: Record<string, string | number | boolean> = {
      search: debouncedSearch,
      page,
      size: pageSize,
    }
    if (relationshipSource !== 'ALL') params.relationshipSource = relationshipSource
    if (ticketStatus !== 'ALL') params.ticketStatus = ticketStatus
    if (kpiFilter === 'UPCOMING') params.hasUpcomingAppointment = true
    if (kpiFilter === 'RECORDS') params.hasMedicalRecord = true
    if (kpiFilter === 'TRIAGE') params.relationshipSource = 'TRIAGE_TICKET'
    return params
  }, [debouncedSearch, kpiFilter, page, pageSize, relationshipSource, ticketStatus])

  const fetchCounts = useCallback(async () => {
    try {
      const [allResponse, upcomingResponse, recordsResponse, triageResponse] = await Promise.all([
        doctorApi.getDoctorPatients({ search: debouncedSearch, size: DOCTOR_PATIENTS_UI.countProbeSize }),
        doctorApi.getDoctorPatients({ search: debouncedSearch, hasUpcomingAppointment: true, size: DOCTOR_PATIENTS_UI.countProbeSize }),
        doctorApi.getDoctorPatients({ search: debouncedSearch, hasMedicalRecord: true, size: DOCTOR_PATIENTS_UI.countProbeSize }),
        doctorApi.getDoctorPatients({ search: debouncedSearch, relationshipSource: 'TRIAGE_TICKET', size: DOCTOR_PATIENTS_UI.countProbeSize }),
      ])
      setCounts({
        all: getPatientTotal(allResponse),
        upcoming: getPatientTotal(upcomingResponse),
        records: getPatientTotal(recordsResponse),
        triage: getPatientTotal(triageResponse),
      })
    } catch (caughtError) {
      console.error('Failed to update KPI counters', caughtError)
    }
  }, [debouncedSearch])

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response: DoctorPatientsPageResponse = await doctorApi.getDoctorPatients(buildParams())
      setPatients(getPatientRows(response))
      setTotalElements(getPatientTotal(response))
    } catch (caughtError) {
      console.error('Failed to fetch doctor patients', caughtError)
      setError(copy.loadError)
    } finally {
      setLoading(false)
    }
  }, [buildParams, copy.loadError])

  useEffect(() => {
    const fetchTimer = setTimeout(() => {
      void fetchPatients()
      void fetchCounts()
    }, 0)
    return () => clearTimeout(fetchTimer)
  }, [fetchCounts, fetchPatients])

  const openDetailDrawer = async (params: GridRowParams<DoctorPatientListItem>) => {
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const response: DoctorPatientDetailResponse = await doctorApi.getDoctorPatientDetail(params.row.patientId)
      setPatientDetail(getPatientDetail(response))
      setActiveTab(0)
    } catch (caughtError) {
      console.error('Failed to fetch patient detail', caughtError)
      setDetailOpen(false)
      setError(copy.detailError)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleKpiClick = (nextFilter: DoctorPatientKpiFilter) => {
    setKpiFilter((currentFilter) => (currentFilter === nextFilter ? 'ALL' : nextFilter))
  }

  const handleRelationshipFilter = (_event: SyntheticEvent, value: DoctorPatientRelationshipSource | null) => {
    if (value) setRelationshipSource(value)
  }

  const columns = useMemo<GridColDef<DoctorPatientListItem>[]>(() => [
    {
      field: 'fullName',
      headerName: copy.table.patient,
      flex: 2,
      minWidth: 240,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
            <Avatar
              src={row.avatarUrl ?? undefined}
              sx={{
                width: 52, height: 52,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                fontSize: '1.2rem',
                fontWeight: 900,
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                border: '2px solid #fff'
              }}
            >
              {row.fullName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.1, color: 'text.primary', fontSize: '1.05rem' }}>
                {row.fullName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.8rem' }}>
                {row.email || copy.details.noValue}
              </Typography>
            </Box>
          </Stack>
        </Box>
      ),
    },
    {
      field: 'ageGender',
      headerName: copy.table.ageGender,
      flex: 1.2,
      minWidth: 180,
      sortable: false,
      renderCell: ({ row }) => (
        <Typography variant="body2" color="text.secondary">
          {row.age ? `${row.age} ${copy.gender.ageSuffix}` : copy.gender.missingAge} {copy.gender.separator} {getGenderLabel(row.gender)}
        </Typography>
      ),
    },
    {
      field: 'relationshipSources',
      headerName: copy.table.relationshipSource,
      flex: 1.6,
      minWidth: 200,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          {(row.relationshipSources ?? []).map((source) => <Chip key={source} size="small" label={getSourceLabel(source)} />)}
        </Stack>
      ),
    },
    {
      field: 'lastInteractionAt',
      headerName: copy.table.lastInteraction,
      flex: 1.3,
      minWidth: 180,
      renderCell: ({ row }) => <Typography variant="body2">{formatDateTime(row.lastInteractionAt)}</Typography>,
    },
    {
      field: 'nextAppointmentDate',
      headerName: copy.table.nextAppointment,
      flex: 1.3,
      minWidth: 180,
      renderCell: ({ row }) => <Typography variant="body2" color={row.nextAppointmentDate ? 'primary.main' : 'text.secondary'}>{formatDateTime(row.nextAppointmentDate)}</Typography>,
    },
    {
      field: 'latestTicketStatus',
      headerName: copy.table.latestTicketStatus,
      flex: 1.2,
      minWidth: 160,
      renderCell: ({ row }) => <Chip size="small" label={getLatestTicketLabel(row.latestTicketStatus)} color={STATUS_CHIP_COLORS[row.latestTicketStatus as keyof typeof STATUS_CHIP_COLORS] ?? 'default'} />,
    },
    {
      field: 'actions',
      headerName: copy.table.actions,
      minWidth: 100,
      sortable: false,
      renderCell: ({ row }) => (
        <TableActionCell>
          <Tooltip title={copy.table.actions}>
            <IconButton size="small" onClick={() => void openDetailDrawer({ row } as GridRowParams<DoctorPatientListItem>)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableActionCell>
      ),
    },
  ], [copy])

  return (
    <PatientPageShell title={copy.pageTitle} subtitle={copy.subtitle} maxWidth="xl" transparent>
      <Grid container spacing={PAGE_STYLE.largeGap} sx={{ mb: PAGE_STYLE.largeGap }}>
        {[
          { key: 'ALL' as const, label: copy.kpi.all, value: counts.all, icon: <Person /> },
          { key: 'UPCOMING' as const, label: copy.kpi.upcoming, value: counts.upcoming, icon: <Timeline /> },
          { key: 'RECORDS' as const, label: copy.kpi.records, value: counts.records, icon: <HistoryEdu /> },
          { key: 'TRIAGE' as const, label: copy.kpi.triage, value: counts.triage, icon: <LocalHospital /> },
        ].map((item) => {
          const selected = kpiFilter === item.key
          return (
            <Grid key={item.key} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card onClick={() => handleKpiClick(item.key)} sx={{ cursor: 'pointer', borderRadius: PAGE_STYLE.borderRadius, border: PAGE_STYLE.glassBorder, bgcolor: selected ? 'primary.main' : PAGE_STYLE.glassBackground, color: selected ? 'primary.contrastText' : 'text.primary', boxShadow: PAGE_STYLE.cardShadow }}>
                <CardContent sx={{ p: PAGE_STYLE.panelPadding, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>{item.label}</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>{item.value}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: selected ? 'primary.contrastText' : alpha(theme.palette.primary.main, DOCTOR_PATIENTS_UI.kpiAvatarAlpha), color: selected ? 'primary.main' : 'primary.main' }}>
                    {item.icon}
                  </Avatar>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      <Card sx={{ mb: PAGE_STYLE.largeGap, borderRadius: PAGE_STYLE.borderRadius, border: PAGE_STYLE.glassBorder, bgcolor: PAGE_STYLE.glassBackground }}>
        <CardContent sx={{ p: PAGE_STYLE.panelPadding }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={PAGE_STYLE.sectionGap} sx={{ alignItems: 'center' }}>
            <TextField
              placeholder={copy.searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 320 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ color: 'primary.main', fontSize: PAGE_STYLE.iconSize }} /></InputAdornment> } }}
            />
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterList sx={{ fontSize: PAGE_STYLE.iconSize }} />
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>{copy.sourceFilterLabel}</Typography>
              </Box>
              <ToggleButtonGroup value={relationshipSource} exclusive onChange={handleRelationshipFilter} size="small">
                <ToggleButton value="ALL">{copy.relationshipFilter.all}</ToggleButton>
                <ToggleButton value="APPOINTMENT">{copy.relationshipFilter.appointment}</ToggleButton>
                <ToggleButton value="MEDICAL_RECORD">{copy.relationshipFilter.medicalRecord}</ToggleButton>
                <ToggleButton value="TRIAGE_TICKET">{copy.relationshipFilter.triageTicket}</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="doctor-patient-ticket-status-label">{copy.ticketStatusLabel}</InputLabel>
              <Select labelId="doctor-patient-ticket-status-label" value={ticketStatus} label={copy.ticketStatusLabel} onChange={(event) => setTicketStatus(event.target.value as DoctorPatientTicketStatus)}>
                <MenuItem value="ALL">{copy.allStatuses}</MenuItem>
                <MenuItem value="NEW">{copy.latestTicketStatus.NEW}</MenuItem>
                <MenuItem value="IN_TRIAGE">{copy.latestTicketStatus.IN_TRIAGE}</MenuItem>
                <MenuItem value="TRIAGED">{copy.latestTicketStatus.TRIAGED}</MenuItem>
                <MenuItem value="CLOSED">{copy.latestTicketStatus.CLOSED}</MenuItem>
                <MenuItem value="REJECTED">{copy.latestTicketStatus.REJECTED}</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ height: DOCTOR_PATIENTS_UI.dataGridHeights.panel, borderRadius: PAGE_STYLE.borderRadius, border: PAGE_STYLE.glassBorder, bgcolor: PAGE_STYLE.glassBackground }}>
        {error ? <Alert severity="error" sx={{ m: PAGE_STYLE.panelPadding }}>{error}</Alert> : null}
        <DataGrid
          rows={patients}
          columns={columns}
          loading={loading}
          rowCount={totalElements}
          getRowId={(row) => row.patientId}
          getRowHeight={() => DOCTOR_PATIENTS_UI.dataGridHeights.row}
          getEstimatedRowHeight={() => DOCTOR_PATIENTS_UI.dataGridHeights.row}
          columnHeaderHeight={DOCTOR_PATIENTS_UI.dataGridHeights.columnHeader}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page)
            setPageSize(model.pageSize)
          }}
          pageSizeOptions={DOCTOR_PATIENTS_UI.pageSizeOptions}
          disableRowSelectionOnClick
          onRowClick={(params) => void openDetailDrawer(params)}
          sx={{
            height: '100%',
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
              borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 900,
              fontSize: '0.7rem',
              color: 'primary.dark',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
            },
            '& .MuiDataGrid-row': {
              transition: 'background-color 0.2s',
              overflow: 'visible !important',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              },
            },
            '& .MuiDataGrid-cell': {
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.04)}`,
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.9rem',
              fontWeight: 500,
              lineHeight: 'normal !important',
              outline: 'none !important',
              overflow: 'visible !important',
              whiteSpace: 'normal !important',
              wordBreak: 'break-word !important',
            },
            '& .MuiDataGrid-FooterContainer': {
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
              bgcolor: 'color-mix(in srgb, var(--color-surface-50) 20%, transparent)',
            }
          }}
        />
      </Card>

      <Drawer anchor="right" open={detailOpen} onClose={() => setDetailOpen(false)} PaperProps={{ sx: { width: { xs: '100vw', sm: DOCTOR_PATIENTS_UI.detailDrawerWidths.sm, md: DOCTOR_PATIENTS_UI.detailDrawerWidths.md }, maxWidth: '100vw', boxShadow: PAGE_STYLE.drawerShadow } }}>
        {detailLoading ? (
          <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 2, flexDirection: 'column' }}>
            <CircularProgress color="primary" />
            <Typography variant="body2" color="text.secondary">{copy.loadingDetail}</Typography>
          </Box>
        ) : patientDetail ? (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: PAGE_STYLE.panelPadding }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Avatar src={patientDetail.avatarUrl ?? undefined} sx={{ width: PAGE_STYLE.detailAvatarSize, height: PAGE_STYLE.detailAvatarSize, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  {patientDetail.fullName.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 900 }}>{patientDetail.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary">{copy.details.identifierPrefix}{patientDetail.patientId}</Typography>
                </Box>
              </Stack>
              <IconButton onClick={() => setDetailOpen(false)}><Close /></IconButton>
            </Box>

            <Tabs value={activeTab} onChange={(_event, value) => setActiveTab(value)} variant="scrollable" scrollButtons="auto">
              <Tab label={copy.details.overview} />
              <Tab label={`${copy.details.appointments} (${patientDetail.totalAppointments})`} />
              <Tab label={`${copy.details.records} (${patientDetail.totalMedicalRecords})`} />
              <Tab label={`${copy.details.tickets} (${patientDetail.totalTriageTickets})`} />
            </Tabs>

            <Box sx={{ p: PAGE_STYLE.panelPadding, overflowY: 'auto', flex: 1 }}>
              {activeTab === DOCTOR_PATIENTS_UI.detailTabs.overview ? (
                <Grid container spacing={PAGE_STYLE.sectionGap}>
                  <Grid size={12}>
                    <Card sx={{ borderRadius: PAGE_STYLE.compactBorderRadius, border: PAGE_STYLE.glassBorder }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 6, sm: 3 }}><Typography variant="caption" color="text.secondary">{copy.kpi.all}</Typography><Typography variant="h5" sx={{ fontWeight: 900 }}>{patientDetail.totalAppointments}</Typography></Grid>
                          <Grid size={{ xs: 6, sm: 3 }}><Typography variant="caption" color="text.secondary">{copy.kpi.records}</Typography><Typography variant="h5" sx={{ fontWeight: 900 }}>{patientDetail.totalMedicalRecords}</Typography></Grid>
                          <Grid size={{ xs: 6, sm: 3 }}><Typography variant="caption" color="text.secondary">{copy.kpi.upcoming}</Typography><Typography variant="h5" sx={{ fontWeight: 900 }}>{patientDetail.completedAppointments}</Typography></Grid>
                          <Grid size={{ xs: 6, sm: 3 }}><Typography variant="caption" color="text.secondary">{copy.kpi.triage}</Typography><Typography variant="h5" sx={{ fontWeight: 900 }}>{patientDetail.activeTriageTickets}</Typography></Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ borderRadius: PAGE_STYLE.compactBorderRadius, border: PAGE_STYLE.glassBorder }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2 }}>{copy.details.adminInfo}</Typography><Stack spacing={2}><Box><Typography variant="caption" color="text.secondary">{copy.details.fullName}</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{patientDetail.fullName}</Typography></Box><Box><Typography variant="caption" color="text.secondary">{copy.details.email}</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{patientDetail.email || copy.details.noValue}</Typography></Box><Box><Typography variant="caption" color="text.secondary">{copy.details.phone}</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{patientDetail.phone || copy.details.noValue}</Typography></Box><Box><Typography variant="caption" color="text.secondary">{copy.details.address}</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{patientDetail.address || copy.details.noValue}</Typography></Box></Stack></CardContent></Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ borderRadius: PAGE_STYLE.compactBorderRadius, border: PAGE_STYLE.glassBorder }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2 }}>{copy.details.clinicalInfo}</Typography><Stack spacing={2}><Box><Typography variant="caption" color="text.secondary">{copy.details.bloodType}</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{patientDetail.bloodType || copy.details.unknownBloodType}</Typography></Box><Box><Typography variant="caption" color="text.secondary">{copy.details.insurance}</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{patientDetail.insuranceNumber || copy.details.noInsurance}</Typography></Box><Box><Typography variant="caption" color="text.secondary">{copy.details.allergies}</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{patientDetail.allergies || copy.details.noAllergy}</Typography></Box><Box><Typography variant="caption" color="text.secondary">{copy.details.chronicConditions}</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{patientDetail.chronicConditions || copy.details.noChronicCondition}</Typography></Box><Box><Typography variant="caption" color="text.secondary">{copy.details.emergencyContact}</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{patientDetail.emergencyContactName ? `${patientDetail.emergencyContactName} (${patientDetail.emergencyContactPhone ?? ''})` : copy.details.noEmergencyContact}</Typography></Box></Stack></CardContent></Card>
                  </Grid>
                </Grid>
              ) : null}

              {activeTab === DOCTOR_PATIENTS_UI.detailTabs.appointments ? (
                <Stack spacing={2}>{(patientDetail.recentAppointments ?? []).map((appointment) => <Card key={appointment.id} sx={{ borderRadius: PAGE_STYLE.compactBorderRadius, border: PAGE_STYLE.glassBorder }}><CardContent><Typography variant="body2" sx={{ fontWeight: 800 }}>{formatDateTime(`${appointment.appointmentDate}T${appointment.appointmentTime ?? '00:00'}`)}</Typography><Typography variant="caption" color="text.secondary">{appointment.departmentName || copy.source.unknown}</Typography><Typography variant="body2" sx={{ mt: 1 }}>{appointment.reason || copy.details.noValue}</Typography></CardContent></Card>)}</Stack>
              ) : null}

              {activeTab === DOCTOR_PATIENTS_UI.detailTabs.records ? (
                <Stack spacing={2}>{(patientDetail.recentMedicalRecords ?? []).map((record) => <Card key={record.id} sx={{ borderRadius: PAGE_STYLE.compactBorderRadius, border: PAGE_STYLE.glassBorder }}><CardContent><Typography variant="body2" sx={{ fontWeight: 800 }}>{formatDateOnly(record.createdAt)}</Typography><Typography variant="body2" sx={{ mt: 1 }}>{record.diagnosis || record.symptoms || copy.details.noValue}</Typography></CardContent></Card>)}</Stack>
              ) : null}

              {activeTab === DOCTOR_PATIENTS_UI.detailTabs.tickets ? (
                <Stack spacing={2}>{(patientDetail.recentTriageTickets ?? []).map((ticket) => <Card key={ticket.id} sx={{ borderRadius: PAGE_STYLE.compactBorderRadius, border: PAGE_STYLE.glassBorder }}><CardContent><Typography variant="body2" sx={{ fontWeight: 800 }}>{copy.details.identifierPrefix}{ticket.id} {copy.details.identifierSeparator} {ticket.status}</Typography><Typography variant="caption" color="text.secondary">{formatDateOnly(ticket.createdAt)}</Typography><Typography variant="body2" sx={{ mt: 1 }}>{ticket.submittedSymptoms || ticket.note || copy.details.noValue}</Typography></CardContent></Card>)}</Stack>
              ) : null}
            </Box>
          </Box>
        ) : (
          <Box sx={{ p: PAGE_STYLE.panelPadding }}><Alert severity="warning">{copy.detailError}</Alert></Box>
        )}
      </Drawer>
    </PatientPageShell>
  )
}
