import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SpriteEditor from '@/pages/SpriteEditor'

const darkTheme = createTheme({ palette: { mode: 'dark' } })

global.fetch = vi.fn()

const renderWithProviders = () => {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={darkTheme}>
        <SpriteEditor />
      </ThemeProvider>
    </MemoryRouter>
  )
}

const createMockFile = (name: string = 'test.png', type: string = 'image/png') => {
  return new File(['mock content'], name, { type })
}

describe('SpriteEditor Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('renders sprite editor interface', () => {
    renderWithProviders()
    
    expect(screen.getByText('Sprite Sheet Editor')).toBeInTheDocument()
    expect(screen.getByText('Image Upload')).toBeInTheDocument()
    expect(screen.getByText('Parameters')).toBeInTheDocument()
  })

  it('shows drag and drop area', () => {
    renderWithProviders()
    
    expect(screen.getByText('Drag & drop images here')).toBeInTheDocument()
    expect(screen.getByText('Or click to select files (PNG, JPEG, GIF, WebP)')).toBeInTheDocument()
    expect(screen.getByText('Maximum 20 files, up to 10MB each')).toBeInTheDocument()
  })

  it('displays parameter controls with default values', () => {
    renderWithProviders()
    
    expect(screen.getByDisplayValue('optimal')).toBeInTheDocument()
    expect(screen.getByDisplayValue('png')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2048')).toBeInTheDocument()
  })

  it('shows generate button as disabled when no images', () => {
    renderWithProviders()
    
    const generateButton = screen.getByText('Generate Sprite Sheet')
    expect(generateButton).toBeDisabled()
  })

  it('displays info alert when no images uploaded', () => {
    renderWithProviders()
    
    expect(screen.getByText('Upload images to start creating your sprite sheet')).toBeInTheDocument()
  })

  it('updates layout parameter when changed', async () => {
    const user = userEvent.setup()
    renderWithProviders()
    
    const layoutSelect = screen.getByLabelText('Layout Algorithm')
    await user.click(layoutSelect)
    
    const gridOption = screen.getByText('Grid Layout')
    await user.click(gridOption)
    
    expect(screen.getByDisplayValue('grid')).toBeInTheDocument()
  })

  it('updates output format when changed', async () => {
    const user = userEvent.setup()
    renderWithProviders()
    
    const formatSelect = screen.getByLabelText('Output Format')
    await user.click(formatSelect)
    
    const jpegOption = screen.getByText('JPEG')
    await user.click(jpegOption)
    
    expect(screen.getByDisplayValue('jpeg')).toBeInTheDocument()
  })

  it('handles padding slider changes', async () => {
    const user = userEvent.setup()
    renderWithProviders()
    
    const paddingSlider = screen.getByRole('slider', { name: /padding/i })
    fireEvent.change(paddingSlider, { target: { value: '5' } })
    
    expect(screen.getByText('Padding: 5px')).toBeInTheDocument()
  })

  it('toggles power of two option', async () => {
    const user = userEvent.setup()
    renderWithProviders()
    
    const powerOfTwoSwitch = screen.getByRole('checkbox', { name: /power of two/i })
    await user.click(powerOfTwoSwitch)
    
    expect(powerOfTwoSwitch).toBeChecked()
  })

  it('updates max width and height inputs', async () => {
    const user = userEvent.setup()
    renderWithProviders()
    
    const maxWidthInput = screen.getByLabelText('Max Width')
    await user.clear(maxWidthInput)
    await user.type(maxWidthInput, '1024')
    
    expect(maxWidthInput).toHaveValue(1024)
  })
})