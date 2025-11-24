import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi } from 'vitest'
import Dashboard from '@/pages/Dashboard'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

const darkTheme = createTheme({ palette: { mode: 'dark' } })

const renderWithProviders = () => {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={darkTheme}>
        <Dashboard />
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders welcome message and description', () => {
    renderWithProviders()
    
    expect(screen.getByText('Welcome to Sprite Sheet Manager')).toBeInTheDocument()
    expect(screen.getByText(/Professional sprite sheet management/)).toBeInTheDocument()
  })

  it('displays feature chips correctly', () => {
    renderWithProviders()
    
    expect(screen.getByText('Dark Material Design')).toBeInTheDocument()
    expect(screen.getByText('16 Color Palettes')).toBeInTheDocument()
    expect(screen.getByText('Multiple Export Formats')).toBeInTheDocument()
    expect(screen.getByText('Optimal Packing')).toBeInTheDocument()
  })

  it('shows quick action cards', () => {
    renderWithProviders()
    
    expect(screen.getByText('New Sprite Sheet')).toBeInTheDocument()
    expect(screen.getByText('Extract Color Palette')).toBeInTheDocument()
    expect(screen.getByText('Create Now')).toBeInTheDocument()
    expect(screen.getByText('Extract Colors')).toBeInTheDocument()
  })

  it('navigates to sprite editor when Create Now is clicked', () => {
    renderWithProviders()
    
    const createButton = screen.getByText('Create Now')
    fireEvent.click(createButton)
    
    expect(mockNavigate).toHaveBeenCalledWith('/editor')
  })

  it('navigates to color palette when Extract Colors is clicked', () => {
    renderWithProviders()
    
    const extractButton = screen.getByText('Extract Colors')
    fireEvent.click(extractButton)
    
    expect(mockNavigate).toHaveBeenCalledWith('/palette')
  })

  it('displays feature cards with correct icons and descriptions', () => {
    renderWithProviders()
    
    expect(screen.getByText('Smart Upload')).toBeInTheDocument()
    expect(screen.getByText('Color Intelligence')).toBeInTheDocument()
    expect(screen.getByText('Advanced Layouts')).toBeInTheDocument()
    expect(screen.getByText('Multiple Formats')).toBeInTheDocument()
    expect(screen.getByText('Batch Processing')).toBeInTheDocument()
    expect(screen.getByText('Real-time Preview')).toBeInTheDocument()
  })

  it('shows usage statistics section', () => {
    renderWithProviders()
    
    expect(screen.getByText('Usage Statistics')).toBeInTheDocument()
    expect(screen.getByText('Sprite Sheets Created')).toBeInTheDocument()
    expect(screen.getByText('Images Processed')).toBeInTheDocument()
    expect(screen.getByText('Color Palettes Generated')).toBeInTheDocument()
    expect(screen.getByText('Total File Size Saved')).toBeInTheDocument()
  })
})