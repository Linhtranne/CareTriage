import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from './login'
import useAuthStore, { getHighestPriorityLandingPage } from '../../store/auth-store'
import type { User } from '../../types'

vi.mock('../../store/auth-store', async () => {
  const actual = await vi.importActual('../../store/auth-store')
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

const useAuthStoreMock = vi.mocked(useAuthStore)
const getHighestPriorityLandingPageMock = vi.mocked(getHighestPriorityLandingPage)

type AuthStoreState = ReturnType<typeof useAuthStore.getState>

const createAuthState = (overrides: Partial<AuthStoreState>): AuthStoreState => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  login: vi.fn(),
  verify2FA: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  setCredentials: vi.fn(),
  clearCredentials: vi.fn(),
  updateUser: vi.fn(),
  getRole: vi.fn(),
  ...overrides,
})

const baseUser: User = {
  id: 'user-1',
  email: 'user@example.com',
  fullName: 'Test User',
  role: 'PATIENT',
  roles: ['ROLE_PATIENT'],
}

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
    const mockState = createAuthState({
      login: vi.fn(),
      isLoading: false,
      isAuthenticated: false,
      user: null,
    })
    useAuthStoreMock.mockReturnValue(mockState)
    useAuthStoreMock.getState = vi.fn().mockReturnValue(mockState)
    getHighestPriorityLandingPageMock.mockReturnValue('/patient/dashboard')
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
    useAuthStoreMock.mockReturnValue(createAuthState({
      login: mockLogin,
      isLoading: false,
      isAuthenticated: false,
      user: null,
    }))

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
    useAuthStoreMock.mockReturnValue(createAuthState({
      login: vi.fn(),
      isLoading: false,
      isAuthenticated: true,
      user: baseUser,
    }))
    getHighestPriorityLandingPageMock.mockReturnValue('/patient/dashboard')

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    expect(mockNavigate).toHaveBeenCalledWith('/patient/dashboard', { replace: true })
  })
})
