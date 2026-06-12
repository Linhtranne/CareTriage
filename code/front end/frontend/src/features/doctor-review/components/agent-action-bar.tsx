import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { DOCTOR_COPY_KEYS } from '../constants/doctor-copy'
import departmentService, { type Department } from '../../../services/department-service'

import type { DoctorTriageTicket } from '../types/triage-review'

interface AgentActionBarProps {
  ticket: DoctorTriageTicket | null
  className?: string
  isSubmitting?: boolean
  onAction?: (action: string, payload?: Record<string, unknown>) => Promise<void>
}

/**
 * Sticky bottom bar with doctor actions.
 * Solid surface, not glass. Actions must be unambiguous.
 */
export default function AgentActionBar({ ticket, className = '', isSubmitting = false, onAction }: AgentActionBarProps) {
  const { t } = useTranslation()
  const isDisabled = !ticket || isSubmitting;
  
  const [activeForm, setActiveForm] = useState<'NONE' | 'OVERRIDE' | 'REQUEST_INFO' | 'ASSIGN'>('NONE');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [noteText, setNoteText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeForm === 'ASSIGN' || activeForm === 'OVERRIDE') {
      departmentService.getAllDepartments({ size: 100 }).then(setDepartments).catch(() => {});
    }
  }, [activeForm]);

  const handleSubmit = async (action: string, payload?: Record<string, unknown>) => {
    if (!onAction) return;
    setErrorMsg(null);
    try {
      await onAction(action, payload);
      setActiveForm('NONE');
      setNoteText('');
      setSelectedDept('');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : t(DOCTOR_COPY_KEYS.actions.form.actionFailed, 'Action failed. Please try again.'));
    }
  };

  const handleApprove = () => handleSubmit('APPROVE');
  const handleConvertToNote = () => handleSubmit('CONVERT_TO_NOTE');

  const submitInlineForm = () => {
    if (activeForm === 'ASSIGN') {
      handleSubmit('ASSIGN_DEPARTMENT', { department: selectedDept });
    } else if (activeForm === 'OVERRIDE') {
      handleSubmit('OVERRIDE', { department: selectedDept, note: noteText });
    } else if (activeForm === 'REQUEST_INFO') {
      handleSubmit('REQUEST_INFO', { message: noteText });
    }
  };

  const isFormValid = () => {
    if (activeForm === 'ASSIGN') return !!selectedDept;
    if (activeForm === 'OVERRIDE') return !!selectedDept && !!noteText.trim();
    if (activeForm === 'REQUEST_INFO') return !!noteText.trim();
    return false;
  };

  return (
    <div 
      className={`sticky bottom-0 border-t flex flex-col ${className}`}
      style={{ 
        background: 'var(--color-surface-50)', 
        borderColor: 'var(--color-surface-200)' 
      }}
    >
      {errorMsg && (
        <div className="px-4 py-2 text-sm font-semibold text-center" style={{ background: 'var(--color-danger-50)', color: 'var(--color-danger-700)' }}>
          {errorMsg}
        </div>
      )}

      {activeForm !== 'NONE' && (
        <div className="p-4 border-b flex gap-3 items-end bg-surface-100" style={{ background: 'var(--color-surface-100)', borderColor: 'var(--color-surface-200)' }}>
          {activeForm !== 'REQUEST_INFO' && (
            <div className="flex flex-col gap-1 flex-1 max-w-xs">
              <label className="text-xs font-bold" style={{ color: 'var(--color-surface-600)' }}>
                {t(DOCTOR_COPY_KEYS.actions.form.department, 'Department')}
              </label>
              <select
                disabled={isSubmitting}
                className="px-3 py-2 rounded border text-sm bg-transparent"
                style={{ borderColor: 'var(--color-surface-300)' }}
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="" disabled>{t(DOCTOR_COPY_KEYS.actions.form.selectDepartment, 'Select Department')}</option>
                {departments.map(d => (
                  <option key={d.code} value={d.code}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
          
          {activeForm !== 'ASSIGN' && (
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-bold" style={{ color: 'var(--color-surface-600)' }}>
                {activeForm === 'REQUEST_INFO' 
                  ? t(DOCTOR_COPY_KEYS.actions.form.messageToPatient, 'Message to patient') 
                  : t(DOCTOR_COPY_KEYS.actions.form.overrideNote, 'Override note (Internal)')}
              </label>
              <input
                disabled={isSubmitting}
                className="px-3 py-2 rounded border text-sm bg-transparent"
                style={{ borderColor: 'var(--color-surface-300)' }}
                placeholder={activeForm === 'REQUEST_INFO' 
                  ? t(DOCTOR_COPY_KEYS.actions.form.whatInfo, 'What information do you need?') 
                  : t(DOCTOR_COPY_KEYS.actions.form.reasonOverride, 'Reason for override')}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
            </div>
          )}
          
          <button 
            disabled={!isFormValid() || isSubmitting}
            onClick={submitInlineForm}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-opacity disabled:opacity-50"
            style={{ background: 'var(--color-primary-600)', color: 'var(--color-surface-50)' }}
          >
            {t(DOCTOR_COPY_KEYS.actions.form.submit, 'Submit')}
          </button>
          <button 
            disabled={isSubmitting}
            onClick={() => setActiveForm('NONE')}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-colors border"
            style={{ color: 'var(--color-surface-600)', borderColor: 'var(--color-surface-300)' }}
          >
            {t(DOCTOR_COPY_KEYS.actions.form.cancel, 'Cancel')}
          </button>
        </div>
      )}

      <div className="p-4 flex flex-wrap items-center justify-end gap-3">
        <button 
          disabled={isDisabled || activeForm !== 'NONE'}
          onClick={handleConvertToNote}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors border disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            color: 'var(--color-surface-700)',
            borderColor: 'var(--color-surface-200)',
            background: 'var(--color-clear)'
          }}
        >
          {t(DOCTOR_COPY_KEYS.actions.convertToNote)}
        </button>

        <button 
          disabled={isDisabled || activeForm !== 'NONE'}
          onClick={() => setActiveForm('ASSIGN')}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors border disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            color: 'var(--color-surface-700)',
            borderColor: 'var(--color-surface-200)',
            background: 'var(--color-clear)'
          }}
        >
          {t(DOCTOR_COPY_KEYS.actions.assignDepartment)}
        </button>

        <button 
          disabled={isDisabled || activeForm !== 'NONE'}
          onClick={() => setActiveForm('REQUEST_INFO')}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors border disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            color: 'var(--color-surface-700)',
            borderColor: 'var(--color-surface-200)',
            background: 'var(--color-clear)'
          }}
        >
          {t(DOCTOR_COPY_KEYS.actions.requestInfo)}
        </button>

        <button 
          disabled={isDisabled || activeForm !== 'NONE'}
          onClick={() => setActiveForm('OVERRIDE')}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors border disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            color: 'var(--color-surface-700)',
            borderColor: 'var(--color-surface-200)',
            background: 'var(--color-clear)'
          }}
        >
          {t(DOCTOR_COPY_KEYS.actions.override)}
        </button>

        <button 
          disabled={isDisabled || activeForm !== 'NONE'}
          onClick={handleApprove}
          className="px-6 py-2 rounded-lg text-sm font-bold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--color-primary-500)', color: 'var(--color-surface-50)' }}
        >
          {isSubmitting ? t(DOCTOR_COPY_KEYS.actions.form.approving, 'Approving...') : t(DOCTOR_COPY_KEYS.actions.approve)}
        </button>
      </div>
    </div>
  )
}
