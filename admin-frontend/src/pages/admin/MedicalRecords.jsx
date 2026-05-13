import { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Card, CardContent, TextField,
  InputAdornment, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  IconButton, Chip, Tooltip, TablePagination,
  CircularProgress, Avatar
} from '@mui/material';
import { Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import medicalRecordApi from '../../api/medicalRecordApi';

export default function MedicalRecords() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      // Giả sử có API lấy tất cả records hoặc search
      // Hiện tại controller chỉ có lấy theo patient hoặc id
      // Tôi sẽ lấy theo mock data hoặc gọi API nếu backend hỗ trợ
      const res = await medicalRecordApi.getPatientHistory(1); // Demo với patient 1
      if (res.data.success) {
        setRecords(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch records', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchRecords]);

  const handleSearch = (e) => setSearch(e.target.value);

  const filteredRecords = records.filter(r => 
    r.patientName?.toLowerCase().includes(search.toLowerCase()) ||
    r.diagnosis?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            Quản lý Hồ sơ bệnh án
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Xem và quản lý toàn bộ hồ sơ y tế của bệnh nhân trong hệ thống.
          </Typography>
        </Box>
      </Box>

      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9' }}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm theo tên bệnh nhân, chẩn đoán..."
              value={search}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={20} color="#64748b" />
                  </InputAdornment>
                ),
              }}
              size="small"
              sx={{ maxWidth: 500 }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Bệnh nhân</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Ngày khám</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Chuyên khoa</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Bác sĩ</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Chẩn đoán</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b' }} align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                      <CircularProgress size={40} sx={{ color: '#10b981' }} />
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                      <Typography color="text.secondary">Không tìm thấy hồ sơ nào</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((record) => (
                    <TableRow key={record.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#10b981', fontSize: '0.8rem' }}>
                            {record.patientName?.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{record.patientName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{new Date(record.createdAt).toLocaleDateString('vi-VN')}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(record.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={record.departmentName} size="small" sx={{ fontWeight: 600, bgcolor: 'rgba(59,130,246,0.1)', color: '#2563eb' }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>BS. {record.doctorName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 250, noWrap: true, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {record.diagnosis}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Xem chi tiết">
                          <IconButton 
                            onClick={() => navigate(`/admin/records/${record.id}`)}
                            sx={{ color: '#10b981', '&:hover': { bgcolor: 'rgba(16,185,129,0.1)' } }}
                          >
                            <Eye size={20} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredRecords.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Số hàng mỗi trang:"
          />
        </CardContent>
      </Card>
    </Box>
  );
}
