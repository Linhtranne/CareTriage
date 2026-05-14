import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import useAuthStore from '../../store/authStore'

vi.mock('../../store/authStore')

describe('ProtectedRoute', () => {
  it('should redirect to login if not authenticated', () => {
    useAuthStore.mockReturnValue({ isAuthenticated: false, user: null })
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should allow access if authenticated', () => {
    useAuthStore.mockReturnValue({ isAuthenticated: true, user: { role: 'PATIENT' } })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should redirect to 404 if role is unauthorized', () => {
    useAuthStore.mockReturnValue({ isAuthenticated: true, user: { role: 'PATIENT' } })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute roles={['DOCTOR']} />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/404" element={<div>404 Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('404 Page')).toBeInTheDocument()
  })
})
