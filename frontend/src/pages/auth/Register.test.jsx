import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Register from './Register'
import useAuthStore from '../../store/authStore'

vi.mock('../../store/authStore')
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'vi' }
  })
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.mockReturnValue({
      register: vi.fn(),
      isLoading: false,
      isAuthenticated: false,
      user: null
    })
  })

  it('renders register form', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )
    expect(screen.getByLabelText(/HỌ VÀ TÊN/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/EMAIL/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/SỐ ĐIỆN THOẠI/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ĐĂNG KÝ/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )
    
    fireEvent.click(screen.getByRole('button', { name: /ĐĂNG KÝ/i }))
    
    expect(await screen.findByText('Họ và tên không được để trống')).toBeInTheDocument()
  })

  it('calls register API when form is valid', async () => {
    const mockRegister = vi.fn().mockResolvedValue({ success: true })
    useAuthStore.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      isAuthenticated: false,
      user: null
    })

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/HỌ VÀ TÊN/i), { target: { value: 'Test Name' } })
    fireEvent.change(screen.getByLabelText(/EMAIL/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/SỐ ĐIỆN THOẠI/i), { target: { value: '0912345678' } })
    fireEvent.change(screen.getByLabelText(/^MẬT KHẨU$/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/XÁC NHẬN MẬT KHẨU/i), { target: { value: 'password123' } })

    fireEvent.click(screen.getByRole('button', { name: /ĐĂNG KÝ/i }))

    expect(mockRegister).toHaveBeenCalled()
  })
})
