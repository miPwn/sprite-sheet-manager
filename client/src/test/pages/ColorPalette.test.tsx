import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ColorPalette from '@/pages/ColorPalette'

const darkTheme = createTheme({ palette: { mode: 'dark' } })

global.fetch = vi.fn()
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn()
  }
})

const renderWithProviders = () => {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={darkTheme}>
        <ColorPalette />
      </ThemeProvider>
    </MemoryRouter>
  )
}

const mockColorResponse = {
  success: true,
  combinedPalette: {
    colors: [
      { hex: '#ff0000', rgb: { r: 255, g: 0, b: 0 }, hsl: { h: 0, s: 1, l: 0.5 }, frequency: 100 },
      { hex: '#00ff00', rgb: { r: 0, g: 255, b: 0 }, hsl: { h: 120, s: 1, l: 0.5 }, frequency: 80 },
      { hex: '#0000ff', rgb: { r: 0, g: 0, b: 255 }, hsl: { h: 240, s: 1, l: 0.5 }, frequency: 60 }
    ],
    dominant: '#ff0000'
  }
}

describe('ColorPalette Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('renders color palette interface', () => {
    renderWithProviders()
    
    expect(screen.getByText('Color Palette Extraction')).toBeInTheDocument()
    expect(screen.getByText('Extract Colors from Images')).toBeInTheDocument()
    expect(screen.getByText('Extraction Settings')).toBeInTheDocument()
  })

  it('shows drag and drop area for color extraction', () => {
    renderWithProviders()
    
    expect(screen.getByText('Drag & drop reference images')).toBeInTheDocument()
    expect(screen.getByText('Extract color palettes from your reference images')).toBeInTheDocument()
    expect(screen.getByText('Maximum 10 files, supports PNG, JPEG, GIF, WebP')).toBeInTheDocument()
  })

  it('displays extraction parameter controls', () => {
    renderWithProviders()
    
    expect(screen.getByText('Max Colors: 16')).toBeInTheDocument()
    expect(screen.getByText('Quality: 10')).toBeInTheDocument()
    expect(screen.getByText('Generate Custom Palette')).toBeInTheDocument()
  })

  it('updates max colors slider', async () => {
    const user = userEvent.setup()
    renderWithProviders()
    
    const maxColorsSlider = screen.getByRole('slider', { name: /max colors/i })
    fireEvent.change(maxColorsSlider, { target: { value: '8' } })
    
    await waitFor(() => {
      expect(screen.getByText('Max Colors: 8')).toBeInTheDocument()
    })
  })

  it('updates quality slider', async () => {
    const user = userEvent.setup()
    renderWithProviders()
    
    const qualitySlider = screen.getByRole('slider', { name: /quality/i })
    fireEvent.change(qualitySlider, { target: { value: '5' } })
    
    await waitFor(() => {
      expect(screen.getByText('Quality: 5')).toBeInTheDocument()
    })
  })

  it('opens custom palette dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders()
    
    const customButton = screen.getByText('Generate Custom Palette')
    await user.click(customButton)
    
    expect(screen.getByText('Generate Custom Color Harmony')).toBeInTheDocument()
    expect(screen.getByLabelText('Base Color')).toBeInTheDocument()
    expect(screen.getByLabelText('Color Harmony')).toBeInTheDocument()
  })

  it('handles custom palette generation', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        palette: [
          { hex: '#6366f1', rgb: { r: 99, g: 102, b: 241 }, hsl: { h: 238, s: 0.84, l: 0.67 } }
        ]
      })
    })

    const user = userEvent.setup()
    renderWithProviders()
    
    const customButton = screen.getByText('Generate Custom Palette')
    await user.click(customButton)
    
    const baseColorInput = screen.getByLabelText('Base Color')
    await user.clear(baseColorInput)
    await user.type(baseColorInput, '#ff5722')
    
    const generateButton = screen.getByRole('button', { name: 'Generate Palette' })
    await user.click(generateButton)
    
    expect(global.fetch).toHaveBeenCalledWith('/api/colors/generate-palette', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }))
  })

  it('displays progress indicator during extraction', async () => {
    global.fetch = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ ok: true, json: () => mockColorResponse }), 100))
    )

    renderWithProviders()
    
    const dropzone = screen.getByText('Drag & drop reference images').closest('div')
    
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: 1024 })
    
    const input = screen.getByRole('presentation').querySelector('input[type="file"]')
    if (input) {
      Object.defineProperty(input, 'files', {
        value: [file],
        configurable: true
      })
      fireEvent.change(input)
    }
    
    expect(screen.getByText('Extracting colors...')).toBeInTheDocument()
  })

  it('copies color to clipboard when color is clicked', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockColorResponse
    })

    renderWithProviders()
    
    await waitFor(() => {
      const colorElement = screen.getByText('#ff0000')
      if (colorElement) {
        fireEvent.click(colorElement.closest('div')!)
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('#ff0000')
      }
    })
  })
})