import { useState, useEffect } from 'react';
import {
  Paper,
  Button,
  Typography,
  Box,
  Grid,
  Avatar,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Stack,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CalendarDays,
  Clock,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import publicApi from '../../services/public-service';
import appointmentApi from '../../services/appointment-service';
import useAuthStore from '../../store/auth-store';
import PatientPageShell from '../../components/patient/patient-page-shell';

const normalizeDepartmentText = (value: string) => (value?.toLowerCase()
  .normalize("NFD").replaceAll(/[\u0300-\u036f]/g, "")
  .replaceAll(/đ/g, 'd')
  .replace(/^khoa\s+/i, '')
  .replaceAll(/[^a-z0-9\s]/g, ' ')
  .replaceAll(/\b(chuyen khoa|khoa|phong kham|bac si)\b/g, ' ')
  .replaceAll(/\s+/g, ' ')
  .trim() || '');

const expandDepartmentAliases = (value: string) => {
  const normalized = normalizeDepartmentText(value);
  const aliases = new Set([normalized
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
              <Button 
                variant="contained" 
                onClick={() => navigate('/patient/appointments')}
                sx={{ 
                  borderRadius: 4, px: 6, py: 2, 
                  bgcolor: 'oklch(20% 0.05 250)', color: 'white',
                  fontWeight: 950, fontSize: '1.1rem',
                  '&:hover': { bgcolor: 'oklch(15% 0.05 250)' }
                }}
              >
                {t('booking.manage_btn')}
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/patient/dashboard')}
                sx={{ 
                  borderRadius: 4, px: 6, py: 2, 
                  color: 'oklch(20% 0.05 250)', borderColor: 'oklch(20% 0.05 250)',
                  borderWidth: 2, fontWeight: 950, fontSize: '1.1rem',
                  '&:hover': { borderWidth: 2, bgcolor: 'oklch(96% 0.01 250)' }
                }}
              >
                {t('booking.dashboard_btn')}
              </Button>
            </Stack>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <PatientPageShell
      title={t('booking.title')}
      subtitle={t('booking.subtitle')}
      maxWidth={false}
      transparent={true}
      actions={
        <Button
          variant="outlined"
          onClick={() => navigate('/patient/appointments')}
          sx={{
            borderRadius: 3,