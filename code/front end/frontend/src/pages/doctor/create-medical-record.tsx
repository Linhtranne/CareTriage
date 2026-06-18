import { useMemo, useState } from 'react'
import { Alert, Autocomplete, Box, Button, CircularProgress, Grid, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { Activity, Calendar, ChevronLeft, ClipboardList, FileText, Pill, Plus, Save, Stethoscope, Trash2 } from 'lucide-react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import CustomTextField from '../../components/common/custom-text-field'
import InteractiveParticles from '../../components/common/interactive-particles'
import DoctorPageShell from '../../components/doctor/doctor-page-shell'
import {
  CREATE_MEDICAL_RECORD_COPY,
  CREATE_MEDICAL_RECORD_DEFAULT_DOSAGE,
  CREATE_MEDICAL_RECORD_DRUG_SUGGESTIONS,
  CREATE_MEDICAL_RECORD_UI,
  CREATE_MEDICAL_RECORD_UNITS,
} from '../../constants/create-medical-record'
import medicalRecordApi from '../../services/medical-record-service'
import type {
  CreateMedicalRecordFormValues,
  CreateMedicalRecordPayload,
  MedicalRecordMedicineForm,
} from '../../types/create-medical-record'

const RECORD_PAGE_STYLE = {
  accentSurface: 'var(--color-primary-100)',
  accentText: 'var(--color-primary-700)',
  cardBorder: '1px solid var(--color-surface-200)',
  cardRadius: 4,
  cardShadow: 'var(--shadow-elevated)',
  panelGap: 4,
  particleInsetBottom: -40,
  particleInsetHorizontal: -40,
  particleInsetTop: -100,
  sectionPadding: 6,
} as const

const validationSchema = yup.object({
  diagnosis: yup.string().required(CREATE_MEDICAL_RECORD_COPY.validation.diagnosisRequired),
  followUpDate: yup.string().nullable().optional(),
  medicines: yup.array().of(
    yup.object({
      dosage: yup.string().required(CREATE_MEDICAL_RECORD_COPY.validation.medicineDosageRequired),
      name: yup.string().required(CREATE_MEDICAL_RECORD_COPY.validation.medicineNameRequired),
      quantity: yup
        .number()
        .typeError(CREATE_MEDICAL_RECORD_COPY.validation.medicineQuantityType)
        .positive(CREATE_MEDICAL_RECORD_COPY.validation.medicineQuantityPositive)
        .required(CREATE_MEDICAL_RECORD_COPY.validation.medicineQuantityRequired),
      unit: yup.string().required(CREATE_MEDICAL_RECORD_COPY.validation.medicineUnitRequired),
    }),
  ),
  notes: yup.string().required(),
  symptoms: yup.string().required(CREATE_MEDICAL_RECORD_COPY.validation.symptomsRequired),
  treatmentPlan: yup.string().required(),
})

const createDefaultMedicine = (): MedicalRecordMedicineForm => ({
  dosage: CREATE_MEDICAL_RECORD_DEFAULT_DOSAGE,
  name: '',
  quantity: CREATE_MEDICAL_RECORD_UI.defaultQuantity,
  unit: CREATE_MEDICAL_RECORD_UNITS[0],
})

const buildPrescription = (medicines: MedicalRecordMedicineForm[]) => {
  return medicines
    .map((medicine) => `- ${medicine.name}: ${medicine.quantity} ${medicine.unit} (${medicine.dosage})`)
    .join('\n')
}

export default function CreateMedicalRecord() {
  const navigate = useNavigate()
  const location = useLocation()
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const patientName = useMemo(() => {
    return (
      new URLSearchParams(location.search).get('patientName') ??
      CREATE_MEDICAL_RECORD_COPY.fallbackPatientName
    )
  }, [location.search])

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<CreateMedicalRecordFormValues>({
    defaultValues: {
      diagnosis: '',
      followUpDate: null,
      medicines: [createDefaultMedicine()],
      notes: '',
      symptoms: '',
      treatmentPlan: '',
    },
    resolver: yupResolver(validationSchema),
  })

  const { append, fields, remove } = useFieldArray({
    control,
    name: 'medicines',
  })

  const handleCreateRecord = async (formValues: CreateMedicalRecordFormValues) => {
    const numericAppointmentId = Number.parseInt(appointmentId ?? '', 10)
    if (Number.isNaN(numericAppointmentId)) {
      setServerError(CREATE_MEDICAL_RECORD_COPY.invalidAppointment)
      return
    }

    setLoading(true)
    setServerError('')

    try {
      const payload: CreateMedicalRecordPayload = {
        appointmentId: numericAppointmentId,
        diagnosis: formValues.diagnosis,
        followUpDate: formValues.followUpDate,
        notes: formValues.notes,
        prescription: buildPrescription(formValues.medicines),
        symptoms: formValues.symptoms,
        treatmentPlan: formValues.treatmentPlan,
      }

      await medicalRecordApi.createRecord(payload)
      navigate('/doctor/appointments')
    } catch (caughtError) {
      console.error('Failed to create medical record', caughtError)
      setServerError(CREATE_MEDICAL_RECORD_COPY.saveError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DoctorPageShell
      title={patientName}
      subtitle={CREATE_MEDICAL_RECORD_COPY.subtitle}
      badge={CREATE_MEDICAL_RECORD_COPY.badge}
      actions={
        <Button
          variant="text"
          startIcon={<ChevronLeft size={20} />}
          onClick={() => navigate('/doctor/appointments')}
        >
          {CREATE_MEDICAL_RECORD_COPY.back}
        </Button>
      }
    >
      <Box sx={{ position: 'relative', mb: 8 }}>
        <Box
          sx={{
            position: 'absolute',
            top: RECORD_PAGE_STYLE.particleInsetTop,
            left: RECORD_PAGE_STYLE.particleInsetHorizontal,
            right: RECORD_PAGE_STYLE.particleInsetHorizontal,
            bottom: RECORD_PAGE_STYLE.particleInsetBottom,
            borderRadius: 12,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <InteractiveParticles mode="neural" />
        </Box>

        <form onSubmit={handleSubmit(handleCreateRecord)}>
          <Grid container spacing={RECORD_PAGE_STYLE.panelGap}>
            <Grid size={{ xs: 12, lg: CREATE_MEDICAL_RECORD_UI.mainColumn }}>
              <Stack spacing={RECORD_PAGE_STYLE.panelGap}>
                <Box
                  sx={{
                    p: RECORD_PAGE_STYLE.sectionPadding,
                    borderRadius: RECORD_PAGE_STYLE.cardRadius,
                    bgcolor: 'background.paper',
                    border: RECORD_PAGE_STYLE.cardBorder,
                    boxShadow: RECORD_PAGE_STYLE.cardShadow,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: RECORD_PAGE_STYLE.accentSurface, color: RECORD_PAGE_STYLE.accentText }}>
                      <Stethoscope size={24} strokeWidth={2.5} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                      {CREATE_MEDICAL_RECORD_COPY.clinicalInfo}
                    </Typography>
                  </Stack>

                  <Stack spacing={4}>
                    <Controller
                      name="symptoms"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          label={CREATE_MEDICAL_RECORD_COPY.symptoms}
                          multiline
                          rows={CREATE_MEDICAL_RECORD_UI.symptomsRows}
                          error={Boolean(errors.symptoms)}
                          helperText={errors.symptoms?.message}
                          icon={<Activity />}
                          placeholder={CREATE_MEDICAL_RECORD_COPY.symptomsPlaceholder}
                        />
                      )}
                    />

                    <Controller
                      name="diagnosis"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          label={CREATE_MEDICAL_RECORD_COPY.diagnosis}
                          error={Boolean(errors.diagnosis)}
                          helperText={errors.diagnosis?.message}
                          icon={<ClipboardList />}
                          placeholder={CREATE_MEDICAL_RECORD_COPY.diagnosisPlaceholder}
                        />
                      )}
                    />

                    <Controller
                      name="treatmentPlan"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          label={CREATE_MEDICAL_RECORD_COPY.treatmentPlan}
                          multiline
                          rows={CREATE_MEDICAL_RECORD_UI.treatmentPlanRows}
                          icon={<FileText />}
                          placeholder={CREATE_MEDICAL_RECORD_COPY.treatmentPlanPlaceholder}
                        />
                      )}
                    />
                  </Stack>
                </Box>

                <Box
                  sx={{
                    p: RECORD_PAGE_STYLE.sectionPadding,
                    borderRadius: RECORD_PAGE_STYLE.cardRadius,
                    bgcolor: 'background.paper',
                    border: RECORD_PAGE_STYLE.cardBorder,
                    boxShadow: RECORD_PAGE_STYLE.cardShadow,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: RECORD_PAGE_STYLE.accentSurface, color: RECORD_PAGE_STYLE.accentText }}>
                        <Pill size={24} strokeWidth={2.5} />
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 900 }}>
                        {CREATE_MEDICAL_RECORD_COPY.prescription}
                      </Typography>
                    </Stack>
                    <Button
                      startIcon={<Plus size={18} strokeWidth={2.5} />}
                      onClick={() => append(createDefaultMedicine())}
                    >
                      {CREATE_MEDICAL_RECORD_COPY.addMedicine}
                    </Button>
                  </Stack>

                  <TableContainer sx={{ border: RECORD_PAGE_STYLE.cardBorder, borderRadius: RECORD_PAGE_STYLE.cardRadius, overflow: 'hidden' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>{CREATE_MEDICAL_RECORD_COPY.medicineName}</TableCell>
                          <TableCell>{CREATE_MEDICAL_RECORD_COPY.medicineQuantity}</TableCell>
                          <TableCell>{CREATE_MEDICAL_RECORD_COPY.medicineUnit}</TableCell>
                          <TableCell>{CREATE_MEDICAL_RECORD_COPY.medicineDosage}</TableCell>
                          <TableCell align="right" />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fields.map((field, index) => (
                          <TableRow key={field.id}>
                            <TableCell>
                              <Controller
                                name={`medicines.${index}.name`}
                                control={control}
                                render={({ field: medicineField }) => (
                                  <Autocomplete
                                    freeSolo
                                    options={CREATE_MEDICAL_RECORD_DRUG_SUGGESTIONS.slice(
                                      0,
                                      CREATE_MEDICAL_RECORD_UI.prescriptionSuggestionCount,
                                    )}
                                    value={medicineField.value}
                                    onChange={(_event, value) => medicineField.onChange(value ?? '')}
                                    onInputChange={(_event, value) => medicineField.onChange(value)}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        placeholder={CREATE_MEDICAL_RECORD_COPY.medicineSearchPlaceholder}
                                        size="small"
                                        error={Boolean(errors.medicines?.[index]?.name)}
                                        helperText={errors.medicines?.[index]?.name?.message}
                                      />
                                    )}
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Controller
                                name={`medicines.${index}.quantity`}
                                control={control}
                                render={({ field: quantityField }) => (
                                  <TextField
                                    {...quantityField}
                                    type="number"
                                    size="small"
                                    error={Boolean(errors.medicines?.[index]?.quantity)}
                                    helperText={errors.medicines?.[index]?.quantity?.message}
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Controller
                                name={`medicines.${index}.unit`}
                                control={control}
                                render={({ field: unitField }) => (
                                  <Autocomplete
                                    options={CREATE_MEDICAL_RECORD_UNITS}
                                    value={unitField.value}
                                    onChange={(_event, value) => unitField.onChange(value ?? CREATE_MEDICAL_RECORD_UNITS[0])}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        size="small"
                                        error={Boolean(errors.medicines?.[index]?.unit)}
                                        helperText={errors.medicines?.[index]?.unit?.message}
                                      />
                                    )}
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Controller
                                name={`medicines.${index}.dosage`}
                                control={control}
                                render={({ field: dosageField }) => (
                                  <TextField
                                    {...dosageField}
                                    fullWidth
                                    size="small"
                                    placeholder={CREATE_MEDICAL_RECORD_COPY.medicineDosagePlaceholder}
                                    error={Boolean(errors.medicines?.[index]?.dosage)}
                                    helperText={errors.medicines?.[index]?.dosage?.message}
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                onClick={() => remove(index)}
                                disabled={fields.length === CREATE_MEDICAL_RECORD_UI.defaultQuantity}
                                color="error"
                              >
                                <Trash2 size={18} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, lg: CREATE_MEDICAL_RECORD_UI.sideColumn }}>
              <Stack spacing={RECORD_PAGE_STYLE.panelGap}>
                <Box
                  sx={{
                    p: RECORD_PAGE_STYLE.sectionPadding,
                    borderRadius: RECORD_PAGE_STYLE.cardRadius,
                    bgcolor: 'background.paper',
                    border: RECORD_PAGE_STYLE.cardBorder,
                    boxShadow: RECORD_PAGE_STYLE.cardShadow,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: RECORD_PAGE_STYLE.accentSurface, color: RECORD_PAGE_STYLE.accentText }}>
                      <Calendar size={24} strokeWidth={2.5} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                      {CREATE_MEDICAL_RECORD_COPY.additionalInfo}
                    </Typography>
                  </Stack>

                  <Stack spacing={4}>
                    <Controller
                      name="followUpDate"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          label={CREATE_MEDICAL_RECORD_COPY.followUpDate}
                          type="date"
                          icon={<Calendar />}
                          InputLabelProps={{ shrink: true }}
                        />
                      )}
                    />
                    <Controller
                      name="notes"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          label={CREATE_MEDICAL_RECORD_COPY.notes}
                          multiline
                          rows={CREATE_MEDICAL_RECORD_UI.notesRows}
                          icon={<FileText />}
                          placeholder={CREATE_MEDICAL_RECORD_COPY.notesPlaceholder}
                        />
                      )}
                    />
                  </Stack>
                </Box>

                <Box
                  sx={{
                    p: RECORD_PAGE_STYLE.sectionPadding,
                    borderRadius: RECORD_PAGE_STYLE.cardRadius,
                    bgcolor: 'var(--color-surface-50)',
                    border: RECORD_PAGE_STYLE.cardBorder,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {serverError ? (
                    <Alert severity="error" sx={{ mb: 4 }}>
                      {serverError}
                    </Alert>
                  ) : null}

                  <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.6, fontWeight: 500 }}>
                    {CREATE_MEDICAL_RECORD_COPY.confirmCopy}
                  </Typography>

                  <Stack spacing={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      type="submit"
                      disabled={loading}
                      startIcon={
                        loading ? (
                          <CircularProgress size={CREATE_MEDICAL_RECORD_UI.saveProgressSize} color="inherit" />
                        ) : (
                          <Save size={20} strokeWidth={2.5} />
                        )
                      }
                    >
                      {CREATE_MEDICAL_RECORD_COPY.save}
                    </Button>
                    <Button fullWidth variant="text" onClick={() => navigate('/doctor/appointments')}>
                      {CREATE_MEDICAL_RECORD_COPY.cancel}
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Box>
    </DoctorPageShell>
  )
}
