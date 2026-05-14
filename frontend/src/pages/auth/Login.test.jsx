import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'
import useAuthStore, { getHighestPriorityLandingPage } from '../../store/authStore'

vi.mock('../../store/authStore', async () => {
  const actual = await vi.importActual('../../store/authStore')
  return {
    ...actual,
    default: vi.fn(),
    getHighestPriorityLandingPage: vi.fn(),
  }
})
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
    useLocation: () => ({ state: {} }),
  }
})

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const mockState = {
      login: vi.fn(),
      isLoading: false,
      isAuthenticated: false,
      user: null
    };
    useAuthStore.mockReturnValue(mockState)
    useAuthStore.getState = vi.fn().mockReturnValue(mockState)
    getHighestPriorityLandingPage.mockReturnValue('/patient/dashboard')
  })

  it('renders login form', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
    expect(screen.getByLabelText(/EMAIL/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/MẬT KHẨU/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ĐĂNG NHẬP/i })).toBeInTheDocument()
  })

  it('shows error if fields are empty', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
    
    fireEvent.click(screen.getByRole('button', { name: /ĐĂNG NHẬP/i }))
    
    expect(await screen.findByText('Email không được để trống')).toBeInTheDocument()
  })

  it('calls login API with correct data', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ success: true })
    useAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      isAuthenticated: false,
      user: null
    })

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/EMAIL/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/MẬT KHẨU/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /ĐĂNG NHẬP/i }))

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('redirects if already authenticated', () => {
    useAuthStore.mockReturnValue({
      login: vi.fn(),
      isLoading: false,
      isAuthenticated: true,
      user: { roles: ['ROLE_PATIENT'] }
    })
    getHighestPriorityLandingPage.mockReturnValue('/patient/dashboard')

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    expect(mockNavigate).toHaveBeenCalledWith('/patient/dashboard', { replace: true })
  })
})
