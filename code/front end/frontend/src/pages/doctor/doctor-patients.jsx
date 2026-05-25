import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  ToggleButtonGroup,
  ToggleButton,
  Avatar,
  Stack,
  useTheme,
  alpha,
  Divider,
  Grid,
  Drawer,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  Search,
  LocalHospital,
  Person,
  FilterList,
  Close,
  Timeline,
  HistoryEdu,
  Visibility,
  Home,
  Bloodtype,
  Warning,
  School,
  ContactPhone
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import PatientPageShell from '../../components/patient/patient-page-shell';
import doctorApi from '../../services/doctor-service';

// Get Treatment Source Configuration
const getSourceConfig = (source) => {
  switch (source) {
    case 'APPOINTMENT':
      return { label: 'Lịch hẹn', color: 'info' };
    case 'MEDICAL_RECORD':
      return { label: 'Bệnh án', color: 'success' };
    case 'TRIAGE_TICKET':
      return { label: 'Triage Ticket', color: 'warning' };
    default:
      return { label: source, color: 'default' };
  }
};

// Format Date String helper
const formatDate = (dateString) => {
  if (!dateString) return 'Chưa xác định';
  try {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export default function DoctorPatients() {
  const theme = useTheme();

  // Core lists & paging states
  const [patients, setPatients] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Page index & search queries
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Custom filter values matching UserManagement
  const [relationshipSource, setRelationshipSource] = useState('ALL');
  const [ticketStatus, setTicketStatus] = useState('ALL');
  const [kpiFilter, setKpiFilter] = useState('ALL');

  // Drawer Master-Detail states
  const [detailOpen, setDetailOpen] = useState(false);
  const [patientDetail, setPatientDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Dynamic KPI counter states
  const [counts, setCounts] = useState({
    all: 0,
    upcoming: 0,
    records: 0,
    triage: 0
  });

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset pagination to first page when criteria updates
  useEffect(() => {
    const timer = setTimeout(() => setPage(0), 0);
    return () => clearTimeout(timer);
  }, [debouncedSearch, relationshipSource, ticketStatus, kpiFilter]);

  // Fetch KPI counters
  const fetchCounts = useCallback(async () => {
    try {
      const [allRes, upcomingRes, recordsRes, triageRes] = await Promise.all([
        doctorApi.getDoctorPatients({ search: debouncedSearch, size: 1 }),
        doctorApi.getDoctorPatients({ search: debouncedSearch, hasUpcomingAppointment: true, size: 1 }),
        doctorApi.getDoctorPatients({ search: debouncedSearch, hasMedicalRecord: true, size: 1 }),
        doctorApi.getDoctorPatients({ search: debouncedSearch, relationshipSource: 'TRIAGE_TICKET', size: 1 })
      ]);
      setCounts({
        all: allRes.data.data.totalElements,
        upcoming: upcomingRes.data.data.totalElements,
        records: recordsRes.data.data.totalElements,
        triage: triageRes.data.data.totalElements
      });
    } catch (err) {
      console.error('Failed to update KPI counters', err);
    }
  }, [debouncedSearch]);

  // Fetch Treating Patients
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        search: debouncedSearch,
        page,
        size: pageSize
      };

      if (relationshipSource !== 'ALL') {
        params.relationshipSource = relationshipSource;
      }
      if (ticketStatus !== 'ALL') {
        params.ticketStatus = ticketStatus;
      }

      // Handle active KPI quick filters
      if (kpiFilter === 'UPCOMING') {
        params.hasUpcomingAppointment = true;
      } else if (kpiFilter === 'RECORDS') {
        params.hasMedicalRecord = true;
      } else if (kpiFilter === 'TRIAGE') {
        params.relationshipSource = 'TRIAGE_TICKET';
      }

      const response = await doctorApi.getDoctorPatients(params);
      setPatients(response.data.data.content);
      setTotalElements(response.data.data.totalElements);
    } catch (err) {
      setError('Không thể kết nối đến máy chủ để tải danh sách bệnh nhân.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize, relationshipSource, ticketStatus, kpiFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
      fetchCounts();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchPatients, fetchCounts]);

  const handleKpiClick = (type) => {
    setKpiFilter(prev => prev === type ? 'ALL' : type);
  };

  // Open detail Drawer
  const handleRowClick = async (params) => {
    const patientId = params.row.patientId;
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const response = await doctorApi.getDoctorPatientDetail(patientId);
      setPatientDetail(response.data.data);
      setActiveTab(0);
    } catch (err) {
      console.error(err);
      setDetailOpen(false);
      setError('Mối quan hệ điều trị không hợp lệ hoặc hồ sơ bệnh án không tồn tại.');
    } finally {
      setDetailLoading(false);
    }
  };

  // DataGrid Columns mirroring administrative styling exactly
  const columns = [
    {
      field: 'fullName',
      headerName: 'Bệnh nhân',
      flex: 2.5,
      minWidth: 320,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
            <Avatar
              src={params.row.avatarUrl}
              sx={{
                width: 52,
                height: 52,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                fontSize: '1.2rem',
                fontWeight: 900,
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                border: '2px solid #fff'
              }}
            >
              {params.row.fullName?.[0]?.toUpperCase() || '?'}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.1, color: 'text.primary', fontSize: '1.05rem' }}>
                {params.row.fullName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.8rem' }}>
                {params.row.email}
              </Typography>
            </Box>
          </Stack>
        </Box>
      )
    },
    {
      field: 'gender',
      headerName: 'Tuổi / Giới tính',
      flex: 1.2,
      minWidth: 160,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
          {params.row.age ? `${params.row.age} tuổi` : 'Chưa nhập'} • {params.row.gender === 'MALE' ? 'Nam' : params.row.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
        </Typography>
      )
    },
    {
      field: 'relationshipSources',
      headerName: 'Nguồn liên kết',
      flex: 1.8,
      minWidth: 220,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {(params.row.relationshipSources || []).map((source) => {
            const config = getSourceConfig(source);
            return (
              <Chip
                key={source}
                label={config.label}
                size="small"
                color={config.color}
                sx={{
                  fontWeight: 900,
                  fontSize: '0.72rem',
                  height: 24,
                  borderRadius: '6px'
                }}
              />
            );
          })}
        </Stack>
      )
    },
    {
      field: 'lastInteractionAt',
      headerName: 'Tương tác gần nhất',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
          {formatDate(params.row.lastInteractionAt)}
        </Typography>
      )
    },
    {
      field: 'nextAppointmentDate',
      headerName: 'Lịch hẹn tiếp theo',
      flex: 1.5,
      minWidth: 180,
      renderCell: () => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 800,
            color: params.row.nextAppointmentDate ? 'primary.main' : 'text.secondary'
          }}
        >
          {params.row.nextAppointmentDate ? formatDate(params.row.nextAppointmentDate) : '---'}
        </Typography>
      )
    },
    {
      field: 'latestTicketStatus',
      headerName: 'Trạng thái Ticket',
      flex: 1.2,
      minWidth: 160,
      renderCell: (params) => {
        const status = params.row.latestTicketStatus;
        if (!status) return <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Không có</Typography>;

        let baseColor = theme.palette.grey[500];
        let label = status;
        if (status === 'NEW') { baseColor = theme.palette.info.main; label = 'Mới'; }
        else if (status === 'IN_TRIAGE') { baseColor = theme.palette.warning.main; label = 'Đang phân loại'; }
        else if (status === 'TRIAGED') { baseColor = theme.palette.success.main; label = 'Đã phân loại'; }
        else if (status === 'CLOSED') { baseColor = theme.palette.grey[600]; label = 'Đã đóng'; }
        else if (status === 'REJECTED') { baseColor = theme.palette.error.main; label = 'Từ chối'; }

        return (
          <Chip
            label={label}
            size="small"
            sx={{
              fontWeight: 900,
              fontSize: '0.7rem',
              bgcolor: alpha(baseColor, 0.15),
              color: baseColor,
              border: `1px solid ${alpha(baseColor, 0.3)}`,
              borderRadius: '10px',
              height: 28,
              px: 1.5
            }}
          />
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Xem chi tiết bệnh nhân">
          <IconButton
            size="small"
            sx={{
              color: 'primary.main',
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.14),
                transform: 'scale(1.05)'
              }
            }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  return (
    <PatientPageShell
      title="Bệnh nhân của tôi"
      description="Quản lý và tra cứu thông tin y khoa chi tiết của các bệnh nhân trong phạm vi điều trị trực tiếp"
      maxWidth="xl"
      transparent={true}
    >
      {/* 4 INTERACTIVE KPI STAT CARDS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => handleKpiClick('ALL')}
            sx={{
              cursor: 'pointer',
              borderRadius: 4,
              border: `1.5px solid ${kpiFilter === 'ALL' ? theme.palette.primary.main : 'rgba(255,255,255,0.5)'}`,
              background: kpiFilter === 'ALL'
                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(30px) saturate(180%)',
              boxShadow: kpiFilter === 'ALL'
                ? `0 10px 30px ${alpha(theme.palette.primary.main, 0.15)}`
                : '0 8px 32px rgba(0,0,0,0.03)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }
            }}
          >
            <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Tổng bệnh nhân
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, mt: 1, color: 'text.primary' }}>
                  {counts.all}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: kpiFilter === 'ALL' ? 'primary.main' : alpha(theme.palette.primary.main, 0.08),
                  color: kpiFilter === 'ALL' ? '#fff' : 'primary.main',
                  width: 56,
                  height: 56,
                  boxShadow: kpiFilter === 'ALL' ? `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}` : 'none'
                }}
              >
                <Person sx={{ fontSize: 28 }} />
              </Avatar>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => handleKpiClick('UPCOMING')}
            sx={{
              cursor: 'pointer',
              borderRadius: 4,
              border: `1.5px solid ${kpiFilter === 'UPCOMING' ? theme.palette.primary.main : 'rgba(255,255,255,0.5)'}`,
              background: kpiFilter === 'UPCOMING'
                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(30px) saturate(180%)',
              boxShadow: kpiFilter === 'UPCOMING'
                ? `0 10px 30px ${alpha(theme.palette.primary.main, 0.15)}`
                : '0 8px 32px rgba(0,0,0,0.03)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }
            }}
          >
            <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Lịch hẹn sắp tới
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, mt: 1, color: 'text.primary' }}>
                  {counts.upcoming}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: kpiFilter === 'UPCOMING' ? 'primary.main' : alpha(theme.palette.info.main, 0.08),
                  color: kpiFilter === 'UPCOMING' ? '#fff' : 'info.main',
                  width: 56,
                  height: 56,
                  boxShadow: kpiFilter === 'UPCOMING' ? `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}` : 'none'
                }}
              >
                <Timeline sx={{ fontSize: 28 }} />
              </Avatar>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => handleKpiClick('RECORDS')}
            sx={{
              cursor: 'pointer',
              borderRadius: 4,
              border: `1.5px solid ${kpiFilter === 'RECORDS' ? theme.palette.primary.main : 'rgba(255,255,255,0.5)'}`,
              background: kpiFilter === 'RECORDS'
                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(30px) saturate(180%)',
              boxShadow: kpiFilter === 'RECORDS'
                ? `0 10px 30px ${alpha(theme.palette.primary.main, 0.15)}`
                : '0 8px 32px rgba(0,0,0,0.03)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }
            }}
          >
            <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Có hồ sơ bệnh án
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, mt: 1, color: 'text.primary' }}>
                  {counts.records}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: kpiFilter === 'RECORDS' ? 'primary.main' : alpha(theme.palette.success.main, 0.08),
                  color: kpiFilter === 'RECORDS' ? '#fff' : 'success.main',
                  width: 56,
                  height: 56,
                  boxShadow: kpiFilter === 'RECORDS' ? `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}` : 'none'
                }}
              >
                <HistoryEdu sx={{ fontSize: 28 }} />
              </Avatar>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => handleKpiClick('TRIAGE')}
            sx={{
              cursor: 'pointer',
              borderRadius: 4,
              border: `1.5px solid ${kpiFilter === 'TRIAGE' ? theme.palette.primary.main : 'rgba(255,255,255,0.5)'}`,
              background: kpiFilter === 'TRIAGE'
                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(30px) saturate(180%)',
              boxShadow: kpiFilter === 'TRIAGE'
                ? `0 10px 30px ${alpha(theme.palette.primary.main, 0.15)}`
                : '0 8px 32px rgba(0,0,0,0.03)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }
            }}
          >
            <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Có ticket triage
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, mt: 1, color: 'text.primary' }}>
                  {counts.triage}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: kpiFilter === 'TRIAGE' ? 'primary.main' : alpha(theme.palette.warning.main, 0.08),
                  color: kpiFilter === 'TRIAGE' ? '#fff' : 'warning.main',
                  width: 56,
                  height: 56,
                  boxShadow: kpiFilter === 'TRIAGE' ? `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}` : 'none'
                }}
              >
                <LocalHospital sx={{ fontSize: 28 }} />
              </Avatar>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DYNAMIC ADMINISTRATIVE FILTERS CARD */}
      <Card
        sx={{
          mb: 4,
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(30px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.05)'
        }}
      >
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ alignItems: 'center' }}>
            <TextField
              placeholder="Tìm kiếm theo tên bệnh nhân, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{
                flex: 1,
                minWidth: 320,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.5)',
                  borderRadius: 3,
                  transition: 'all 0.3s',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.8)' },
                  '&.Mui-focused': {
                    bgcolor: '#fff',
                    boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'primary.main', fontSize: 22 }} />
                  </InputAdornment>
                )
              }}
            />

            {/* Toggle group for Relationship Sources */}
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <FilterList sx={{ fontSize: 20 }} />
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  LỌC NGUỒN LIÊN KẾT
                </Typography>
              </Box>
              <ToggleButtonGroup
                value={relationshipSource}
                exclusive
                onChange={(_, val) => val && setRelationshipSource(val)}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.4)',
                  borderRadius: '12px',
                  p: 0.5,
                  '& .MuiToggleButton-root': {
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: '10px',
                    px: 2.2,
                    py: 0.6,
                    border: '0 !important',
                    color: 'text.secondary',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: '#fff',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                      '&:hover': { bgcolor: 'primary.dark' }
                    },
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.8)' }
                  }
                }}
              >
                <ToggleButton value="ALL">Tất cả</ToggleButton>
                <ToggleButton value="APPOINTMENT">Lịch hẹn</ToggleButton>
                <ToggleButton value="MEDICAL_RECORD">Bệnh án</ToggleButton>
                <ToggleButton value="TRIAGE_TICKET">Ticket</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {/* Ticket status dropdown */}
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="ticket-status-select-label" sx={{ fontWeight: 700 }}>Trạng thái Ticket</InputLabel>
              <Select
                labelId="ticket-status-select-label"
                value={ticketStatus}
                onChange={(e) => setTicketStatus(e.target.value)}
                label="Trạng thái Ticket"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.5)',
                  borderRadius: 3,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.08)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main'
                  }
                }}
              >
                <MenuItem value="ALL"><em>Tất cả trạng thái</em></MenuItem>
                <MenuItem value="NEW">Mới (NEW)</MenuItem>
                <MenuItem value="IN_TRIAGE">Đang phân loại (IN_TRIAGE)</MenuItem>
                <MenuItem value="TRIAGED">Đã phân loại (TRIAGED)</MenuItem>
                <MenuItem value="CLOSED">Đã đóng (CLOSED)</MenuItem>
                <MenuItem value="REJECTED">Từ chối (REJECTED)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* DATAGRID ADMINISTRATIVE PANEL */}
      <Card
        sx={{
          height: 720,
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(30px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          borderRadius: 4,
          boxShadow: '0 12px 40px rgba(0,0,0,0.06)'
        }}
      >
        {error && <Alert severity="error" sx={{ m: 3, borderRadius: 3 }}>{error}</Alert>}

        <DataGrid
          rows={patients}
          columns={columns}
          loading={loading}
          rowCount={totalElements}
          getRowId={(row) => row.patientId}
          getRowHeight={() => 112}
          getEstimatedRowHeight={() => 112}
          columnHeaderHeight={64}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          pageSizeOptions={[5, 10, 20]}
          disableRowSelectionOnClick
          onRowClick={handleRowClick}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
              borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 900,
              fontSize: '0.72rem',
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
              bgcolor: 'rgba(255, 255, 255, 0.2)',
            }
          }}
        />
      </Card>

      {/* ===== DETAILED PATIENT DRAWER (MASTER-DETAIL) ===== */}
      <Drawer
        anchor="right"
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100vw', sm: 580, md: 740 },
            maxWidth: '100vw',
            borderTopLeftRadius: { xs: 0, sm: 6 },
            borderBottomLeftRadius: { xs: 0, sm: 6 },
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.15)',
          }
        }}
      >
        {detailLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <CircularProgress color="primary" />
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Đang trích xuất hồ sơ bệnh án điều trị...
            </Typography>
          </Box>
        ) : patientDetail ? (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Standard Gradient Header */}
            <Box
              sx={{
                height: 120,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                position: 'relative'
              }}
            >
              <IconButton
                onClick={() => setDetailOpen(false)}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: 16,
                  color: '#fff',
                  bgcolor: 'rgba(0,0,0,0.2)',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.4)' }
                }}
              >
                <Close />
              </IconButton>
            </Box>

            {/* Avatar & Profile Card Header inside Drawer */}
            <Box sx={{ px: 4, mt: -6, mb: 3, display: 'flex', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
              <Avatar
                src={patientDetail.avatarUrl}
                sx={{
                  width: 120,
                  height: 120,
                  border: '6px solid #fff',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  fontSize: '3rem',
                  fontWeight: 900
                }}
              >
                {patientDetail.fullName?.[0]?.toUpperCase() || '?'}
              </Avatar>
              <Box sx={{ pb: 1, flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
                  {patientDetail.fullName}
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
                  <Chip
                    label={patientDetail.gender === 'MALE' ? 'Nam' : patientDetail.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                    size="small"
                    sx={{ fontWeight: 800, bgcolor: 'rgba(0,0,0,0.06)' }}
                  />
                  {patientDetail.dateOfBirth && (
                    <Chip
                      label={new Date(patientDetail.dateOfBirth).toLocaleDateString('vi-VN')}
                      size="small"
                      sx={{ fontWeight: 800, bgcolor: 'rgba(0,0,0,0.06)' }}
                    />
                  )}
                </Stack>
              </Box>
            </Box>

            {/* 4 tabs in Drawer */}
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                px: 3,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                flexShrink: 0,
                '& .MuiTab-root': {
                  fontWeight: 800,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  minHeight: 52,
                  color: 'text.secondary',
                  '&.Mui-selected': { color: 'primary.main' }
                },
                '& .MuiTabs-indicator': { bgcolor: 'primary.main' }
              }}
            >
              <Tab label="Tổng quan" />
              <Tab label={`Lịch hẹn (${patientDetail.totalAppointments})`} />
              <Tab label={`Bệnh án (${patientDetail.totalMedicalRecords})`} />
              <Tab label={`Tickets (${patientDetail.totalTriageTickets})`} />
            </Tabs>

            {/* Tab Panels */}
            <Box sx={{ p: 4, flex: 1, overflowY: 'auto', bgcolor: 'rgba(0,0,0,0.01)' }}>
              {/* TAB 0: OVERVIEW */}
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  {/* Summary Island exactly like Admin styling */}
                  <Grid item xs={12}>
                    <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Tóm tắt hoạt động điều trị
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'info.main', display: 'block' }}>LỊCH HẸN</Typography>
                              <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>{patientDetail.totalAppointments}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main', display: 'block' }}>HOÀN THÀNH</Typography>
                              <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>{patientDetail.completedAppointments}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main', display: 'block' }}>BỆNH ÁN</Typography>
                              <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>{patientDetail.totalMedicalRecords}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'warning.main', display: 'block' }}>TICKET MỞ</Typography>
                              <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>{patientDetail.activeTriageTickets}</Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Administrative Grid Items */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Thông tin hành chính
                        </Typography>
                        <Stack spacing={2.5}>
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <Person sx={{ color: 'text.secondary', mt: 0.2 }} />
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>HỌ VÀ TÊN</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 900, color: 'text.primary' }}>{patientDetail.fullName}</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <Timeline sx={{ color: 'text.secondary', mt: 0.2 }} />
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>ĐỊA CHỈ EMAIL</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{patientDetail.email}</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <ContactPhone sx={{ color: 'text.secondary', mt: 0.2 }} />
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>SỐ ĐIỆN THOẠI</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{patientDetail.phone || 'Chưa cung cấp'}</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <Home sx={{ color: 'text.secondary', mt: 0.2 }} />
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>ĐỊA CHỈ THƯỜNG TRÚ</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{patientDetail.address || 'Chưa cung cấp'}</Typography>
                            </Box>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Clinical Background Grid Items */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Thông tin lâm sàng nền
                        </Typography>
                        <Stack spacing={2.5}>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>NHÓM MÁU</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 900, color: 'error.main', mt: 0.2 }}>
                                <Bloodtype sx={{ verticalAlign: 'middle', mr: 0.5 }} fontSize="small" />
                                {patientDetail.bloodType || 'Chưa rõ'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>BHYT (HI)</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.2 }}>{patientDetail.insuranceNumber || 'Chưa có'}</Typography>
                            </Grid>
                          </Grid>
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>TIỀN SỬ DỊ ỨNG</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: patientDetail.allergies ? 'error.main' : 'text.primary', mt: 0.2 }}>
                              <Warning sx={{ verticalAlign: 'middle', mr: 0.5, display: patientDetail.allergies ? 'inline-block' : 'none' }} fontSize="small" />
                              {patientDetail.allergies || 'Không ghi nhận dị ứng'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>BỆNH LÝ MÃN TÍNH</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.2 }}>{patientDetail.chronicConditions || 'Không phát hiện'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>LIÊN HỆ KHẨN CẤP</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.2 }}>
                              {patientDetail.emergencyContactName ? `${patientDetail.emergencyContactName} (${patientDetail.emergencyContactPhone})` : 'Chưa thiết lập'}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* TAB 1: APPOINTMENTS */}
              {activeTab === 1 && (
                <Stack spacing={3}>
                  {patientDetail.recentAppointments?.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <Timeline sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.2 }} />
                      <Typography variant="body2" sx={{ mt: 2, fontWeight: 700, color: 'text.secondary' }}>
                        Chưa có lịch hẹn nào được ghi nhận với bác sĩ hiện tại.
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      {patientDetail.recentAppointments.map((appt) => {
                        let statusColor = 'default';
                        if (appt.status === 'COMPLETED') statusColor = 'success';
                        else if (appt.status === 'CONFIRMED' || appt.status === 'CHECKED_IN') statusColor = 'info';
                        else if (appt.status === 'PENDING') statusColor = 'warning';
                        else if (appt.status === 'NO_SHOW') statusColor = 'error';

                        return (
                          <Card key={appt.id} sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            <CardContent sx={{ p: 3 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                  <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.08), width: 44, height: 44 }}>
                                    <Timeline sx={{ color: 'info.main' }} />
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 900, color: 'text.primary' }}>
                                      {formatDate(appt.appointmentDate + 'T' + appt.appointmentTime)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                      Chuyên khoa: {appt.departmentName || 'Hệ thống'}
                                    </Typography>
                                  </Box>
                                </Stack>
                                <Chip
                                  label={appt.status}
                                  size="small"
                                  color={statusColor}
                                  sx={{ fontWeight: 900, fontSize: '0.72rem', borderRadius: '6px' }}
                                />
                              </Box>

                              <Divider sx={{ my: 2, borderColor: 'rgba(0,0,0,0.04)' }} />

                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>LÝ DO KHÁM</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.2 }}>{appt.reason || 'Khám tổng quát'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>GHI CHÚ LÂM SÀNG</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.2, color: 'text.secondary' }}>{appt.notes || 'Không có ghi chú'}</Typography>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        );
                      })}
                      {patientDetail.totalAppointments > 5 && (
                        <Button fullWidth disabled variant="outlined" sx={{ py: 1.5, borderRadius: 3, fontWeight: 900, borderStyle: 'dashed', textTransform: 'none' }}>
                          Xem thêm lịch hẹn (Chức năng đang phát triển)
                        </Button>
                      )}
                    </>
                  )}
                </Stack>
              )}

              {/* TAB 2: MEDICAL RECORDS */}
              {activeTab === 2 && (
                <Stack spacing={3}>
                  {patientDetail.recentMedicalRecords?.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <HistoryEdu sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.2 }} />
                      <Typography variant="body2" sx={{ mt: 2, fontWeight: 700, color: 'text.secondary' }}>
                        Chưa có ghi chú bệnh án nào được tạo lập bởi bác sĩ hiện tại.
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      {patientDetail.recentMedicalRecords.map((record) => (
                        <Card key={record.id} sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.08), width: 44, height: 44 }}>
                                  <HistoryEdu sx={{ color: 'success.main' }} />
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 900, color: 'text.primary' }}>
                                  Bệnh án ngày {formatDate(record.createdAt)}
                                </Typography>
                              </Stack>
                              <Chip
                                label={`Mã số: #${record.id}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                              />
                            </Box>

                            <Divider sx={{ my: 2, borderColor: 'rgba(0,0,0,0.04)' }} />

                            <Stack spacing={2}>
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>CHẨN ĐOÁN CHÍNH</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 900, mt: 0.2, color: 'primary.main' }}>{record.diagnosis}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>TRIỆU CHỨNG KHAI BÁO</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.2 }}>{record.symptoms || 'Không ghi chép'}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>PHÁC ĐỒ ĐIỀU TRỊ</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.2, color: 'text.secondary' }}>{record.treatmentPlan}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>ĐƠN THUỐC CHI TIẾT</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.2, bgcolor: 'rgba(0,0,0,0.015)', p: 2, borderRadius: 2, fontFamily: 'monospace', border: '1px solid rgba(0,0,0,0.04)' }}>
                                  {record.prescription || 'Không kê toa'}
                                </Typography>
                              </Box>
                              {record.vitalSigns && (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <School fontSize="small" sx={{ color: 'text.secondary', mt: 0.2 }} />
                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>CHỈ SỐ SINH TỒN (VITAL SIGNS)</Typography>
                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.primary', mt: 0.2 }}>{record.vitalSigns}</Typography>
                                  </Box>
                                </Box>
                              )}
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                      {patientDetail.totalMedicalRecords > 5 && (
                        <Button fullWidth disabled variant="outlined" sx={{ py: 1.5, borderRadius: 3, fontWeight: 900, borderStyle: 'dashed', textTransform: 'none' }}>
                          Xem thêm bệnh án (Chức năng đang phát triển)
                        </Button>
                      )}
                    </>
                  )}
                </Stack>
              )}

              {/* TAB 3: TRIAGE TICKETS */}
              {activeTab === 3 && (
                <Stack spacing={3}>
                  {patientDetail.recentTriageTickets?.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <LocalHospital sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.2 }} />
                      <Typography variant="body2" sx={{ mt: 2, fontWeight: 700, color: 'text.secondary' }}>
                        Chưa có Triage Tickets nào được gán cho bác sĩ hiện tại.
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      {patientDetail.recentTriageTickets.map((ticket) => {
                        let statusColor = 'default';
                        if (ticket.status === 'TRIAGED') statusColor = 'success';
                        else if (ticket.status === 'IN_TRIAGE') statusColor = 'warning';
                        else if (ticket.status === 'NEW') statusColor = 'info';
                        else if (ticket.status === 'CLOSED') statusColor = 'default';
                        else if (ticket.status === 'REJECTED') statusColor = 'error';

                        let severityColor = 'default';
                        if (ticket.severity === 'SEVERE') severityColor = 'error';
                        else if (ticket.severity === 'MODERATE') severityColor = 'warning';
                        else if (ticket.severity === 'MILD') severityColor = 'success';

                        return (
                          <Card key={ticket.id} sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            <CardContent sx={{ p: 3 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                  <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.08), width: 44, height: 44 }}>
                                    <LocalHospital sx={{ color: 'warning.main' }} />
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 900, color: 'text.primary' }}>
                                      Ticket #{ticket.ticketNumber}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                      Lập ngày {formatDate(ticket.createdAt)}
                                    </Typography>
                                  </Box>
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                  <Chip
                                    label={`Mức độ: ${ticket.severity}`}
                                    size="small"
                                    color={severityColor}
                                    sx={{ fontWeight: 900, fontSize: '0.68rem', borderRadius: '4px', height: 22 }}
                                  />
                                  <Chip
                                    label={ticket.status}
                                    size="small"
                                    color={statusColor}
                                    sx={{ fontWeight: 900, fontSize: '0.68rem', borderRadius: '4px', height: 22 }}
                                  />
                                </Stack>
                              </Box>

                              <Divider sx={{ my: 2, borderColor: 'rgba(0,0,0,0.04)' }} />

                              <Stack spacing={2}>
                                <Box>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>TIÊU ĐỀ TRIỆU CHỨNG</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 900, mt: 0.2 }}>{ticket.title || 'Chưa phân loại'}</Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>CHI TIẾT TRIỆU CHỨNG LÂM SÀNG</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.2, color: 'text.secondary' }}>{ticket.description || 'Không mô tả'}</Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>PHÂN LOẠI CHUYÊN KHOA</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.2 }}>{ticket.categoryName || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Stack>
                            </CardContent>
                          </Card>
                        );
                      })}
                      {patientDetail.totalTriageTickets > 5 && (
                        <Button fullWidth disabled variant="outlined" sx={{ py: 1.5, borderRadius: 3, fontWeight: 900, borderStyle: 'dashed', textTransform: 'none' }}>
                          Xem thêm tickets (Chức năng đang phát triển)
                        </Button>
                      )}
                    </>
                  )}
                </Stack>
              )}
            </Box>

            {/* Bottom Actions of Drawer Sheet */}
            <Box sx={{ p: 4, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: '#fff', flexShrink: 0 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setDetailOpen(false)}
                sx={{
                  fontWeight: 900,
                  borderRadius: 3,
                  py: 1.6,
                  bgcolor: 'primary.main',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    boxShadow: `0 10px 30px ${alpha(theme.palette.primary.main, 0.45)}`
                  }
                }}
              >
                Đóng hồ sơ bệnh án
              </Button>
            </Box>
          </Box>
        ) : null}
      </Drawer>
    </PatientPageShell>
  );
}
