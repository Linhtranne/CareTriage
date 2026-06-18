import { useRef, useState } from 'react'
import type { ChangeEvent, SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { Brain, FileText, Upload } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useNavigate } from 'react-router-dom'

import { EHR_KEYS, EHR_UI } from '../../constants/ehr'
import ehrApi from '../../services/ehr-service'
import type { EhrExtractionResult, EhrNoteType } from '../../types/ehr'

type UploadMode = 0 | 1

type UploadFormValues = {
  mode: UploadMode
  noteType: EhrNoteType
  patientId: number | ''
  text: string
}

const NOTE_TYPE_VALUES = [
  'ADMISSION',
  'PROGRESS',
  'DISCHARGE',
  'CONSULTATION',
  'PRESCRIPTION',
] as const satisfies readonly EhrNoteType[]

export default function EHRUpload() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [tabValue, setTabValue] = useState<UploadMode>(0)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const copy = {
    title: t(EHR_KEYS.upload.title),
    subtitle: t(EHR_KEYS.upload.subtitle),
    textTab: t(EHR_KEYS.upload.textTab),
    fileTab: t(EHR_KEYS.upload.fileTab),
    submit: t(EHR_KEYS.upload.submit),
    processing: t(EHR_KEYS.upload.processing),
    textPlaceholder: t(EHR_KEYS.upload.textPlaceholder),
    fileRequired: t(EHR_KEYS.upload.fileRequired),
    fileTypeError: t(EHR_KEYS.upload.fileTypeError),
    fileSizeError: t(EHR_KEYS.upload.fileSizeError),
    serverError: t(EHR_KEYS.upload.serverError),
    noteIdError: t(EHR_KEYS.upload.noteIdError),
    noteTypeRequired: t(EHR_KEYS.upload.noteTypeRequired),
    patientIdLabel: t(EHR_KEYS.upload.patientIdLabel),
    noteTypeLabel: t(EHR_KEYS.upload.noteTypeLabel),
    patientIdTypeError: t(EHR_KEYS.upload.patientIdTypeError),
    patientIdRequired: t(EHR_KEYS.upload.patientIdRequired),
    patientIdPositive: t(EHR_KEYS.upload.patientIdPositive),
    patientIdInteger: t(EHR_KEYS.upload.patientIdInteger),
    textRequired: t(EHR_KEYS.upload.textRequired),
    textMinLength: t(EHR_KEYS.upload.textMinLength),
    noteTypes: {
      ADMISSION: t(EHR_KEYS.upload.noteTypes.ADMISSION),
      PROGRESS: t(EHR_KEYS.upload.noteTypes.PROGRESS),
      DISCHARGE: t(EHR_KEYS.upload.noteTypes.DISCHARGE),
      CONSULTATION: t(EHR_KEYS.upload.noteTypes.CONSULTATION),
      PRESCRIPTION: t(EHR_KEYS.upload.noteTypes.PRESCRIPTION),
    },
  }

  const uploadSchema = yup.object({
    mode: yup.number<UploadMode>().required(),
    noteType: yup.string().required(copy.noteTypeRequired),
    patientId: yup
      .number()
      .typeError(copy.patientIdTypeError)
      .required(copy.patientIdRequired)
      .positive(copy.patientIdPositive)
      .integer(copy.patientIdInteger),
    text: yup.string().when('mode', {
      is: 0,
      then: (schema) => schema.required(copy.textRequired).min(EHR_UI.validationTextMinLength, copy.textMinLength),
      otherwise: (schema) => schema.optional(),
    }),
  })

  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<UploadFormValues>({
    defaultValues: {
      mode: 0,
      noteType: 'PROGRESS',
      patientId: '',
      text: '',
    },
    resolver: yupResolver(uploadSchema) as any,
  })

  const selectedNoteType = useWatch({ control, name: 'noteType' })

  const handleTabChange = (_event: SyntheticEvent, value: UploadMode) => {
    setTabValue(value)
    setValue('mode', value)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) {
      return
    }

    const extension = selectedFile.name.split('.').pop()?.toLowerCase()
    const validExtensions = ['pdf', 'doc', 'docx', 'txt']
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ]

    if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(extension ?? '')) {
      setFileError(copy.fileTypeError)
      setFile(null)
      return
    }

    if (selectedFile.size > EHR_UI.maxUploadSizeBytes) {
      setFileError(copy.fileSizeError)
      setFile(null)
      return
    }

    setFile(selectedFile)
    setFileError('')
  }

  const handleSubmitUpload = async (data: UploadFormValues) => {
    if (tabValue === 1 && !file) {
      setFileError(copy.fileRequired)
      return
    }

    setLoading(true)
    setServerError('')

    try {
      let response
      if (tabValue === 0) {
        response = await ehrApi.extractFromText({
          noteType: data.noteType,
          patientId: data.patientId,
          text: data.text,
        })
      } else {
        const formData = new FormData()
        formData.append('file', file as Blob)
        formData.append('patientId', String(data.patientId))
        formData.append('noteType', data.noteType)
        response = await ehrApi.extractFromFile(formData)
      }

      const result = (response.data?.data ?? response.data) as EhrExtractionResult
      const noteId = result.clinicalNoteId
      if (!noteId) {
        throw new Error(copy.noteIdError)
      }

      navigate(`${EHR_KEYS.navigation.resultBase}/${noteId}`)
    } catch (caughtError) {
      console.error('Failed to upload EHR note', caughtError)
      setServerError(copy.serverError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 6, px: { xs: 2, md: 4, lg: 6 } }}>
      <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h2" sx={{ fontWeight: 700, letterSpacing: '-0.04em', mb: 1 }}>
            {copy.title}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {copy.subtitle}
          </Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit(handleSubmitUpload as any)}>
        <Stack spacing={4}>
          <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid var(--color-surface-200)', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab disableRipple label={copy.textTab} icon={<FileText size={20} />} iconPosition="start" />
                <Tab disableRipple label={copy.fileTab} icon={<Upload size={20} />} iconPosition="start" />
              </Tabs>

              <Button variant="contained" type="submit" disabled={loading} startIcon={loading ? undefined : <Brain size={22} />}>
                {loading ? copy.processing : copy.submit}
              </Button>
            </Box>

            <Box sx={{ p: 3 }}>
              {serverError ? <Alert severity="error" sx={{ mb: 3 }}>{serverError}</Alert> : null}
              {fileError ? <Alert severity="warning" sx={{ mb: 3 }}>{fileError}</Alert> : null}

              <Stack spacing={3}>
                <Controller
                  name="patientId"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label={copy.patientIdLabel} error={Boolean(errors.patientId)} helperText={errors.patientId?.message} />
                  )}
                />

                <Controller
                  name="noteType"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label={copy.noteTypeLabel} error={Boolean(errors.noteType)} helperText={errors.noteType?.message}>
                      {NOTE_TYPE_VALUES.map((noteType) => (
                        <MenuItem key={noteType} value={noteType}>
                          {copy.noteTypes[noteType]}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                <Typography variant="body2" color="text.secondary">
                  {copy.noteTypes[selectedNoteType as keyof typeof copy.noteTypes] ?? selectedNoteType}
                </Typography>

                {tabValue === 0 ? (
                  <Controller
                    name="text"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        multiline
                        rows={18}
                        placeholder={copy.textPlaceholder}
                        error={Boolean(errors.text)}
                        helperText={errors.text?.message}
                      />
                    )}
                  />
                ) : (
                  <Stack spacing={2}>
                    <Button type="button" variant="outlined" onClick={() => fileInputRef.current?.click()} startIcon={<Upload size={18} />}>
                      {copy.fileTab}
                    </Button>
                    <input ref={fileInputRef} hidden type="file" onChange={handleFileChange} />
                    {file ? <Typography variant="body2">{file.name}</Typography> : null}
                  </Stack>
                )}
              </Stack>
            </Box>
          </Paper>
        </Stack>
      </form>
    </Box>
  )
}
