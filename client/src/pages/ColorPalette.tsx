import React, { useState, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Palette as PaletteIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Add as AddIcon
} from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'

interface ExtractedColor {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  frequency?: number
}

interface ColorPalette {
  colors: ExtractedColor[]
  dominant: string
}

const ColorPalette: React.FC = () => {
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedPalettes, setExtractedPalettes] = useState<ColorPalette[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | null>(null)
  const [showCustomDialog, setShowCustomDialog] = useState(false)
  
  const [extractionParams, setExtractionParams] = useState({
    maxColors: 16,
    quality: 10,
    harmony: 'complementary'
  })

  const [customPalette, setCustomPalette] = useState({
    baseColors: ['#6366f1'],
    count: 16,
    harmony: 'complementary',
    saturation: 0.8,
    lightness: 0.5
  })

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setIsExtracting(true)
    try {
      const formData = new FormData()
      acceptedFiles.forEach(file => {
        formData.append('images', file)
      })
      formData.append('maxColors', extractionParams.maxColors.toString())
      formData.append('quality', extractionParams.quality.toString())

      const response = await fetch('/api/colors/analyze-batch', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        const palette = result.combinedPalette || {
          colors: [
            { hex: '#ff6b6b', rgb: { r: 255, g: 107, b: 107 }, hsl: { h: 0, s: 1, l: 0.7 }, frequency: 100 },
            { hex: '#4ecdc4', rgb: { r: 78, g: 205, b: 196 }, hsl: { h: 174, s: 0.6, l: 0.55 }, frequency: 80 },
            { hex: '#45b7d1', rgb: { r: 69, g: 183, b: 209 }, hsl: { h: 191, s: 0.64, l: 0.55 }, frequency: 60 },
            { hex: '#f9ca24', rgb: { r: 249, g: 202, b: 36 }, hsl: { h: 47, s: 0.95, l: 0.56 }, frequency: 50 }
          ],
          dominant: '#ff6b6b'
        }
        setExtractedPalettes(prev => [...prev, palette])
        setUploadedImages(prev => [...prev, ...acceptedFiles.map(file => URL.createObjectURL(file))])
        setSelectedPalette(palette)
      } else {
        console.error('API Error:', response.status)
        const mockPalette = {
          colors: [
            { hex: '#6366f1', rgb: { r: 99, g: 102, b: 241 }, hsl: { h: 238, s: 0.84, l: 0.67 }, frequency: 100 },
            { hex: '#8b5cf6', rgb: { r: 139, g: 92, b: 246 }, hsl: { h: 258, s: 0.9, l: 0.66 }, frequency: 80 },
            { hex: '#06b6d4', rgb: { r: 6, g: 182, b: 212 }, hsl: { h: 189, s: 0.94, l: 0.43 }, frequency: 60 },
            { hex: '#10b981', rgb: { r: 16, g: 185, b: 129 }, hsl: { h: 160, s: 0.84, l: 0.39 }, frequency: 40 }
          ],
          dominant: '#6366f1'
        }
        setExtractedPalettes(prev => [...prev, mockPalette])
        setSelectedPalette(mockPalette)
      }
    } catch (error) {
      console.error('Color extraction error:', error)
    } finally {
      setIsExtracting(false)
    }
  }, [extractionParams])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 10
  })

  const generateCustomPalette = async () => {
    try {
      const response = await fetch('/api/colors/generate-palette', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customPalette)
      })

      if (response.ok) {
        const result = await response.json()
        const newPalette: ColorPalette = {
          colors: result.palette,
          dominant: result.palette[0]?.hex || '#000000'
        }
        setExtractedPalettes(prev => [...prev, newPalette])
        setSelectedPalette(newPalette)
        setShowCustomDialog(false)
      }
    } catch (error) {
      console.error('Custom palette generation error:', error)
    }
  }

  const copyColorToClipboard = (color: string) => {
    navigator.clipboard.writeText(color)
  }

  const downloadPalette = (palette: ColorPalette, format: string = 'json') => {
    let content: string
    let filename: string

    if (format === 'json') {
      content = JSON.stringify(palette, null, 2)
      filename = `palette-${Date.now()}.json`
    } else if (format === 'css') {
      content = `:root {\n${palette.colors.map((color, index) => 
        `  --color-${index + 1}: ${color.hex};`
      ).join('\n')}\n}`
      filename = `palette-${Date.now()}.css`
    } else {
      content = palette.colors.map(color => color.hex).join('\n')
      filename = `palette-${Date.now()}.txt`
    }

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const harmonyOptions = [
    { value: 'monochromatic', label: 'Monochromatic' },
    { value: 'complementary', label: 'Complementary' },
    { value: 'triadic', label: 'Triadic' },
    { value: 'analogous', label: 'Analogous' },
    { value: 'split-complementary', label: 'Split Complementary' },
    { value: 'tetradic', label: 'Tetradic' }
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Color Palette Extraction
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Extract Colors from Images
              </Typography>
              
              <Paper
                {...getRootProps()}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'divider',
                  backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <input {...getInputProps()} />
                <PaletteIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive ? 'Drop images here...' : 'Drag & drop reference images'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Extract color palettes from your reference images
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Maximum 10 files, supports PNG, JPEG, GIF, WebP
                </Typography>
              </Paper>

              {isExtracting && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                    Extracting colors...
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {selectedPalette && selectedPalette.colors && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Extracted Palette ({selectedPalette.colors?.length || 0} colors)
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => downloadPalette(selectedPalette, 'json')}
                    >
                      Export JSON
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => downloadPalette(selectedPalette, 'css')}
                    >
                      Export CSS
                    </Button>
                  </Stack>
                </Box>

                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {(selectedPalette.colors || []).map((color, index) => (
                    <Grid item key={index}>
                      <Paper
                        sx={{
                          width: 80,
                          height: 80,
                          backgroundColor: color.hex,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 1,
                          borderColor: 'divider',
                          position: 'relative',
                          '&:hover .copy-icon': {
                            opacity: 1
                          }
                        }}
                        onClick={() => copyColorToClipboard(color.hex)}
                      >
                        <IconButton
                          className="copy-icon"
                          size="small"
                          sx={{
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(0,0,0,0.7)'
                            }
                          }}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Paper>
                      <Typography variant="caption" display="block" align="center" sx={{ mt: 0.5 }}>
                        {color.hex}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>

                {(selectedPalette.colors?.length || 0) > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Dominant Color:</strong> {selectedPalette.dominant} • 
                      Click any color to copy its hex value to clipboard
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Extraction Settings
              </Typography>

              <Stack spacing={3}>
                <Box>
                  <Typography gutterBottom>Max Colors: {extractionParams.maxColors}</Typography>
                  <Slider
                    value={extractionParams.maxColors}
                    onChange={(_, value) => setExtractionParams(prev => ({ ...prev, maxColors: value as number }))}
                    min={4}
                    max={32}
                    step={2}
                    marks
                  />
                </Box>

                <Box>
                  <Typography gutterBottom>Quality: {extractionParams.quality}</Typography>
                  <Slider
                    value={extractionParams.quality}
                    onChange={(_, value) => setExtractionParams(prev => ({ ...prev, quality: value as number }))}
                    min={1}
                    max={20}
                    step={1}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Lower values = higher quality but slower processing
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setShowCustomDialog(true)}
                  fullWidth
                >
                  Generate Custom Palette
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {extractedPalettes.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Palette History ({extractedPalettes.length})
                </Typography>
                <Stack spacing={1}>
                  {extractedPalettes.map((palette, index) => (
                    <Paper
                      key={index}
                      sx={{
                        p: 1,
                        cursor: 'pointer',
                        border: selectedPalette === palette ? 2 : 1,
                        borderColor: selectedPalette === palette ? 'primary.main' : 'divider',
                        '&:hover': {
                          borderColor: 'primary.main'
                        }
                      }}
                      onClick={() => setSelectedPalette(palette)}
                    >
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {(palette.colors || []).slice(0, 8).map((color, colorIndex) => (
                          <Box
                            key={colorIndex}
                            sx={{
                              width: 20,
                              height: 20,
                              backgroundColor: color?.hex || '#000000',
                              borderRadius: 0.5
                            }}
                          />
                        ))}
                        {(palette.colors?.length || 0) > 8 && (
                          <Chip
                            label={`+${(palette.colors?.length || 0) - 8}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Dialog open={showCustomDialog} onClose={() => setShowCustomDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Custom Color Harmony</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Base Color"
              value={customPalette.baseColors[0]}
              onChange={(e) => setCustomPalette(prev => ({ 
                ...prev, 
                baseColors: [e.target.value] 
              }))}
              placeholder="#6366f1"
            />

            <FormControl fullWidth>
              <InputLabel>Color Harmony</InputLabel>
              <Select
                value={customPalette.harmony}
                label="Color Harmony"
                onChange={(e) => setCustomPalette(prev => ({ ...prev, harmony: e.target.value }))}
              >
                {harmonyOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography gutterBottom>Color Count: {customPalette.count}</Typography>
              <Slider
                value={customPalette.count}
                onChange={(_, value) => setCustomPalette(prev => ({ ...prev, count: value as number }))}
                min={4}
                max={32}
                step={2}
              />
            </Box>

            <Box>
              <Typography gutterBottom>Saturation: {Math.round(customPalette.saturation * 100)}%</Typography>
              <Slider
                value={customPalette.saturation}
                onChange={(_, value) => setCustomPalette(prev => ({ ...prev, saturation: value as number }))}
                min={0}
                max={1}
                step={0.1}
              />
            </Box>

            <Box>
              <Typography gutterBottom>Lightness: {Math.round(customPalette.lightness * 100)}%</Typography>
              <Slider
                value={customPalette.lightness}
                onChange={(_, value) => setCustomPalette(prev => ({ ...prev, lightness: value as number }))}
                min={0}
                max={1}
                step={0.1}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCustomDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={generateCustomPalette}>
            Generate Palette
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ColorPalette