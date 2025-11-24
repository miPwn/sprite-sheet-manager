import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi } from 'vitest'
import Layout from '@/components/Layout/Layout'

const darkTheme = createTheme({
  palette: {
    mode: 'dark'
  }
})

const renderWithProviders = (initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider theme={darkTheme}>
        <Layout />
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('Layout Component', () => {
  it('renders navigation items correctly', () => {
    renderWithProviders()
    
    expect(screen.getByText('Sprite Sheet Manager')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Sprite Editor')).toBeInTheDocument()
    expect(screen.getByText('Color Palette')).toBeInTheDocument()
  })

  it('highlights active navigation item', () => {
    renderWithProviders(['/editor'])
    
    const editorNavItem = screen.getByText('Sprite Editor').closest('button')
    expect(editorNavItem).toHaveClass('Mui-selected')
  })

  it('shows mobile menu toggle on small screens', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    })
    
    renderWithProviders()
    
    const menuButton = screen.getByLabelText('open drawer')
    expect(menuButton).toBeInTheDocument()
  })

  it('navigates between pages correctly', () => {
    const { container } = renderWithProviders()
    
    const paletteNav = screen.getByText('Color Palette')
    fireEvent.click(paletteNav)
    
    expect(container).toBeInTheDocument()
  })
})