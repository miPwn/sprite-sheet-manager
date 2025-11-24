import React, { useState, useRef } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Paper,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Alert,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Chip,
  useTheme,
  Switch,
  FormControlLabel,
  Fade
} from '@mui/material'
import {
  AutoAwesome as AIIcon,
  Download as DownloadIcon,
  Palette as PaletteIcon,
  Add as AddIcon,
  Colorize as EyeDropperIcon,
  Image as ImageIcon,
  Settings as SettingsIcon,
  Upload as UploadIcon,
  Close as CloseIcon
} from '@mui/icons-material'

interface GeneratedSprite {
  id: string
  name: string
  description: string
  imageUrl: string
  width: number
  height: number
}

interface ExtractedColor {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  frequency?: number
}

interface ColorPalette {
  colors: ExtractedColor[]
  dominant: string
  name?: string
}

const SpriteEditor: React.FC = () => {
  const theme = useTheme()
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedSprites, setGeneratedSprites] = useState<GeneratedSprite[]>([])
  const [generatedSpriteSheet, setGeneratedSpriteSheet] = useState<string | null>(null)
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | null>(null)
  const [extractedPalettes, setExtractedPalettes] = useState<ColorPalette[]>([])
  const [showCustomPaletteDialog, setShowCustomPaletteDialog] = useState(false)
  const [isGeneratingPalette, setIsGeneratingPalette] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useAutoPalette, setUseAutoPalette] = useState(true)
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false)
  
  // Reference Image State
  const [referenceImage, setReferenceImage] = useState<File | null>(null)
  const [referencePreview, setReferencePreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [inferredStyle, setInferredStyle] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Palette Editing State
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null)
  const [colorPickerAnchor, setColorPickerAnchor] = useState<HTMLElement | null>(null)

  const [parameters, setParameters] = useState({
    padding: 16,
    layout: 'grid',
    outputFormat: 'png',
    maxWidth: 2048,
    maxHeight: 2048,
    backgroundColor: 'transparent',
    spriteSize: 16,
    style: 'pixel-art'
  })

  const [customPalette, setCustomPalette] = useState({
    baseColors: ['#6366f1'],
    count: 16,
    harmony: 'complementary',
    saturation: 0.8,
    lightness: 0.5
  })

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt first')
      return
    }

    setIsEnhancingPrompt(true)
    setError(null)

    try {
      const response = await fetch('/api/sprites/validate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      })

      const result = await response.json()

      if (response.ok) {
        if (result.valid) {
          if (result.fixedPrompt !== prompt.trim()) {
            setPrompt(result.fixedPrompt)
            setError(null)
          }
        } else {
          setError(result.feedback || 'Prompt needs improvement')
        }
      } else {
        setError(result.error || 'Failed to validate prompt')
      }
    } catch (error) {
      console.error('Validation error:', error)
      setError('Failed to validate prompt')
    } finally {
      setIsEnhancingPrompt(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setReferenceImage(file)
      setReferencePreview(URL.createObjectURL(file))
      setInferredStyle(null)
      
      // Auto-trigger analysis after image is loaded
      setTimeout(() => {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('userPrompt', prompt.trim())
        
        setIsAnalyzing(true)
        setError(null)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000)

        fetch('/api/sprites/analyze-image', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        })
        .then(response => {
          clearTimeout(timeoutId)
          return response.json()
        })
        .then(result => {
          if (result.palette) {
            const newPalette: ColorPalette = {
              colors: result.palette,
              dominant: result.palette[0]?.hex || '#000000',
              name: `Inferred from Image`
            }
            setExtractedPalettes(prev => [...prev, newPalette])
            setSelectedPalette(newPalette)
            setUseAutoPalette(false)
          }
          
          if (result.style) {
            setInferredStyle(result.style)
            setPrompt(prev => {
              const lines = prev.split('\n')
              const nonStyleLines = lines.filter(line => !line.startsWith('[STYLE]'))
              const basePrompt = nonStyleLines.join('\n').trim()
              return basePrompt 
                ? `${basePrompt}\n\n[STYLE]\n${result.style}`
                : `[STYLE]\n${result.style}`
            })
          }
        })
        .catch(error => {
          console.error('Analysis error:', error)
          if ((error as any)?.name === 'AbortError') {
            setError('Image analysis timed out. Try a smaller image.')
          } else {
            setError('Failed to analyze image')
          }
        })
        .finally(() => {
          setIsAnalyzing(false)
        })
      }, 100)
    }
  }

  const analyzeReferenceImage = async () => {
    if (!referenceImage) return

    setIsAnalyzing(true)
    setError(null)

    const formData = new FormData()
    formData.append('image', referenceImage)
    formData.append('userPrompt', prompt.trim())

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 1 minute timeout

      const response = await fetch('/api/sprites/analyze-image', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      const result = await response.json()
      
      console.log('Analysis result:', result)

      if (response.ok) {
        if (result.palette) {
          const newPalette: ColorPalette = {
            colors: result.palette,
            dominant: result.palette[0]?.hex || '#000000',
            name: `Inferred from Image`
          }
          setExtractedPalettes(prev => [...prev, newPalette])
          setSelectedPalette(newPalette)
          setUseAutoPalette(false)
          console.log('Palette applied:', newPalette)
        }
        
        if (result.style) {
          console.log('Style received:', result.style)
          setInferredStyle(result.style)
          // Format the prompt nicely with the style
          setPrompt(prev => {
            const lines = prev.split('\n')
            const nonStyleLines = lines.filter(line => !line.startsWith('[STYLE]'))
            const basePrompt = nonStyleLines.join('\n').trim()
            const newPrompt = basePrompt 
              ? `${basePrompt}\n\n[STYLE]\n${result.style}`
              : `[STYLE]\n${result.style}`
            console.log('Updated prompt:', newPrompt)
            return newPrompt
          })
        } else {
          console.warn('No style in result')
        }
      } else {
        console.error('Response not OK:', result)
        setError(result.error || 'Failed to analyze image')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      if ((error as any)?.name === 'AbortError') {
        setError('Image analysis timed out after 1 minute. Try a smaller image.')
      } else {
        setError('Failed to connect to server')
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const clearReferenceImage = () => {
    setReferenceImage(null)
    setReferencePreview(null)
    setInferredStyle(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const generateSprites = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError(null)
    setGeneratedSprites([])
    setGeneratedSpriteSheet(null)
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout

      const response = await fetch('/api/sprites/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          parameters,
          palette: useAutoPalette ? null : selectedPalette
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      const result = await response.json()

      if (response.ok) {
        const sprites = result.sprites || []
        setGeneratedSprites(sprites)
        
        if (result.palette) {
          const newPalette: ColorPalette = {
            colors: result.palette,
            dominant: result.palette[0]?.hex || '#000000',
            name: `Generated: ${prompt.slice(0, 20)}...`
          }
          setExtractedPalettes(prev => [...prev, newPalette])
          // If auto-palette was used, select the generated one
          if (useAutoPalette || !selectedPalette) {
            setSelectedPalette(newPalette)
          }
        }

        if (sprites.length > 0) {
          const sheetResponse = await fetch('/api/sprites/generate-sheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sprites: sprites,
              parameters,
              layout: parameters.layout,
              outputFormat: parameters.outputFormat
            })
          })

          if (sheetResponse.ok) {
            const sheetResult = await sheetResponse.json()
            setGeneratedSpriteSheet(sheetResult.outputPath)
          }
        }
      } else {
        setError(result.error || 'Failed to generate sprites')
      }
    } catch (error) {
      console.error('Error generating sprites:', error)
      if ((error as any)?.name === 'AbortError') {
        setError('Generation timed out after 2 minutes. Try reducing sprite count or complexity.')
      } else {
        setError('Network error: Unable to connect to the server')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const generateCustomPalette = async () => {
    setShowCustomPaletteDialog(false)
    setIsGeneratingPalette(true)
    
    try {
      const response = await fetch('/api/colors/generate-palette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customPalette)
      })

      if (response.ok) {
        const result = await response.json()
        const newPalette: ColorPalette = {
          colors: result.palette,
          dominant: result.palette[0]?.hex || '#000000',
          name: `Custom ${customPalette.harmony}`
        }
        setExtractedPalettes(prev => [...prev, newPalette])
        setSelectedPalette(newPalette)
        setUseAutoPalette(false) // Switch to manual if user generates a palette
      }
    } catch (error) {
      console.error('Custom palette generation error:', error)
    } finally {
      setIsGeneratingPalette(false)
    }
  }

  const copyColorToClipboard = (color: string) => {
    navigator.clipboard.writeText(color)
  }
  
  const handleColorClick = (event: React.MouseEvent<HTMLElement>, index: number) => {
    if (!selectedPalette || useAutoPalette) return
    setEditingColorIndex(index)
    setColorPickerAnchor(event.currentTarget)
  }
  
  const handleColorChange = (newHex: string) => {
    if (editingColorIndex === null || !selectedPalette) return
    
    const updatedPalette: ColorPalette = {
      ...selectedPalette,
      colors: selectedPalette.colors.map((color, i) => 
        i === editingColorIndex ? { ...color, hex: newHex } : color
      )
    }
    
    setSelectedPalette(updatedPalette)
    // Update in history
    setExtractedPalettes(prev => 
      prev.map(p => p === selectedPalette ? updatedPalette : p)
    )
  }
  
  const handleColorRemove = (index: number) => {
    if (!selectedPalette || selectedPalette.colors.length <= 2) {
      setError('Palette must have at least 2 colors')
      return
    }
    
    const updatedPalette: ColorPalette = {
      ...selectedPalette,
      colors: selectedPalette.colors.filter((_, i) => i !== index)
    }
    
    setSelectedPalette(updatedPalette)
    setExtractedPalettes(prev => 
      prev.map(p => p === selectedPalette ? updatedPalette : p)
    )
  }

  const layoutOptions = [
    { value: 'optimal', label: 'Optimal Packing' },
    { value: 'grid', label: 'Grid Layout' },
    { value: 'horizontal', label: 'Horizontal Strip' },
    { value: 'vertical', label: 'Vertical Strip' }
  ]

  const harmonyOptions = [
    { value: 'monochromatic', label: 'Monochromatic' },
    { value: 'complementary', label: 'Complementary' },
    { value: 'triadic', label: 'Triadic' },
    { value: 'analogous', label: 'Analogous' },
    { value: 'split-complementary', label: 'Split Complementary' },
    { value: 'tetradic', label: 'Tetradic' }
  ]

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Grid container spacing={2} sx={{ flex: 1, overflow: 'hidden', p: 2 }}>
        
        {/* LEFT PANEL - CONTROLS */}
        <Grid item xs={12} md={3} sx={{ height: '100%', overflowY: 'auto' }}>
          <Stack spacing={2}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AIIcon color="primary" /> Generator
                </Typography>
                
                <Stack spacing={3}>
                  <TextField
                    label="Prompt"
                    placeholder="e.g. '8 pixel art potions'"
                    multiline
                    rows={8}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={{
                      '& .MuiInputBase-root': {
                        paddingRight: '48px' // Space for AI button
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                          <Tooltip title="Enhance with AI">
                            <IconButton
                              size="small"
                              onClick={handleEnhancePrompt}
                              disabled={isEnhancingPrompt || !prompt.trim()}
                              sx={{
                                bgcolor: 'rgba(104, 151, 187, 0.1)',
                                '&:hover': {
                                  bgcolor: 'rgba(104, 151, 187, 0.2)'
                                }
                              }}
                            >
                              {isEnhancingPrompt ? (
                                <LinearProgress sx={{ width: 18, height: 18 }} />
                              ) : (
                                <AIIcon sx={{ fontSize: 18, color: '#6897BB' }} />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )
                    }}
                  />

                  {/* Reference Image Section */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Reference Image</Typography>
                    {!referenceImage ? (
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        startIcon={<UploadIcon />}
                        sx={{ borderStyle: 'dashed', height: 60 }}
                      >
                        Upload Image
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleImageUpload}
                          ref={fileInputRef}
                        />
                      </Button>
                    ) : (
                      <Box>
                        <Box sx={{ position: 'relative', mt: 1 }}>
                          <img
                            src={referencePreview!}
                            alt="Reference"
                            style={{ width: '100%', maxHeight: 150, objectFit: 'contain', borderRadius: 4, border: '1px solid #444' }}
                          />
                          <IconButton
                            size="small"
                            onClick={clearReferenceImage}
                            sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.7)', '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' } }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        {isAnalyzing && (
                          <Box sx={{
                            mt: 1,
                            bgcolor: 'rgba(0,0,0,0.6)',
                            p: 1,
                            borderRadius: 1,
                            border: '1px solid rgba(104, 151, 187, 0.3)'
                          }}>
                            <LinearProgress sx={{ mb: 0.5 }} />
                            <Typography variant="caption" sx={{ color: '#6897BB', display: 'block', textAlign: 'center' }}>
                              Analyzing image...
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                    {inferredStyle && (
                      <Alert severity="success" sx={{ mt: 1, py: 0 }}>
                        <Typography variant="caption">Style inferred & added to prompt!</Typography>
                      </Alert>
                    )}
                  </Box>

                  <Button
                    variant="contained"
                    size="large"
                    startIcon={isGenerating ? <LinearProgress sx={{ width: 20 }} /> : <AIIcon />}
                    onClick={generateSprites}
                    disabled={!prompt.trim() || isGenerating || (!useAutoPalette && !selectedPalette)}
                    fullWidth
                    color="primary"
                    sx={{
                      fontWeight: 'bold',
                      py: 1.5
                    }}
                  >
                    {isGenerating ? 'Dreaming...' : 'Generate'}
                  </Button>
                  
                  {!useAutoPalette && !selectedPalette && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      Please select or generate a palette, or enable Auto-palette.
                    </Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          </Stack>
        </Grid>

        {/* CENTER PANEL - RESULTS */}
        <Grid item xs={12} md={6} sx={{ height: '100%', overflowY: 'auto' }}>
          <Stack spacing={2}>
            {generatedSprites.length === 0 && !isGenerating && (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: 400, 
                opacity: 0.5,
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2
              }}>
                <ImageIcon sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h6">Ready to Create</Typography>
                <Typography variant="body2">Enter a prompt and hit Generate</Typography>
              </Box>
            )}

            {isGenerating && (
              <Fade in={isGenerating}>
                <Box sx={{ width: '100%', mt: 4, textAlign: 'center' }}>
                  <LinearProgress sx={{ mb: 2, height: 8, borderRadius: 4 }} />
                  <Typography variant="h6" color="primary" gutterBottom>
                    AI is crafting your sprites...
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Generating pixel art and optimizing layout
                  </Typography>
                </Box>
              </Fade>
            )}

            {generatedSprites.length > 0 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Generated Sprites</Typography>
                  <Chip label={`${generatedSprites.length} sprites`} size="small" color="primary" variant="outlined" />
                </Box>
                
                <Grid container spacing={2}>
                  {generatedSprites.map((sprite) => (
                    <Grid item xs={4} sm={3} key={sprite.id}>
                      <Paper 
                        elevation={2}
                        sx={{ 
                          p: 1, 
                          textAlign: 'center', 
                          bgcolor: 'background.default',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          '&:hover': { transform: 'scale(1.05)', boxShadow: 4 }
                        }}
                      >
                        <Box
                          component="img"
                          src={sprite.imageUrl}
                          alt={sprite.name}
                          sx={{
                            width: '100%',
                            aspectRatio: '1/1',
                            objectFit: 'contain',
                            imageRendering: 'pixelated'
                          }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {generatedSpriteSheet && (
              <Card elevation={4} sx={{ mt: 2, border: `1px solid ${theme.palette.primary.main}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Sprite Sheet Preview</Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<DownloadIcon />} 
                      href={generatedSpriteSheet} 
                      download
                      size="small"
                    >
                      Download
                    </Button>
                  </Box>
                  <Box sx={{ 
                    bgcolor: '#2a2a2a', 
                    p: 2, 
                    borderRadius: 1, 
                    display: 'flex', 
                    justifyContent: 'center',
                    backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    overflow: 'auto',
                    maxHeight: 500
                  }}>
                    <img
                      src={generatedSpriteSheet}
                      alt="Sprite Sheet"
                      style={{ maxWidth: '100%', height: 'auto', imageRendering: 'pixelated' }}
                    />
                  </Box>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>

        {/* RIGHT PANEL - SETTINGS */}
        <Grid item xs={12} md={3} sx={{ height: '100%', overflowY: 'auto' }}>
          <Stack spacing={2}>
            
            {/* PALETTE */}
            <Card elevation={3} sx={{ opacity: useAutoPalette ? 0.7 : 1, transition: 'opacity 0.3s' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PaletteIcon color="secondary" /> Palette
                  </Typography>
                  <Tooltip title="New Palette">
                    <span>
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setShowCustomPaletteDialog(true)
                          setUseAutoPalette(false)
                        }}
                      >
                        <AddIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>

                {useAutoPalette && (
                  <Alert severity="info" sx={{ mb: 2, py: 0 }}>
                    Auto-palette enabled
                  </Alert>
                )}

                {selectedPalette ? (
                  <>
                    <Grid container spacing={1}>
                      {selectedPalette.colors.map((color, i) => (
                        <Grid item key={i}>
                           <Box sx={{ position: 'relative', '&:hover .delete-btn': { opacity: 1 } }}>
                            <Tooltip title={useAutoPalette ? color.hex : 'Click to edit'}>
                              <Box
                                onClick={(e) => !useAutoPalette && handleColorClick(e, i)}
                                sx={{
                                  width: 36,
                                  height: 36,
                                  bgcolor: color.hex,
                                  borderRadius: 1,
                                  cursor: useAutoPalette ? 'default' : 'pointer',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  '&:hover': useAutoPalette ? {} : { 
                                    transform: 'scale(1.05)', 
                                    boxShadow: 2,
                                    border: '2px solid #6897BB'
                                  },
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  position: 'relative'
                                }}
                              >
                                {!useAutoPalette && (
                                  <IconButton
                                    className="delete-btn"
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleColorRemove(i)
                                    }}
                                    sx={{
                                      position: 'absolute',
                                      top: -8,
                                      right: -8,
                                      bgcolor: '#BC3F3C',
                                      width: 16,
                                      height: 16,
                                      padding: 0,
                                      opacity: 0,
                                      transition: 'opacity 0.2s',
                                      '&:hover': {
                                        bgcolor: '#C96765'
                                      }
                                    }}
                                  >
                                    <CloseIcon sx={{ fontSize: 12, color: '#FFF' }} />
                                  </IconButton>
                                )}
                              </Box>
                            </Tooltip>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                    
                    {/* Color Picker Popover */}
                    <Dialog 
                      open={Boolean(colorPickerAnchor)} 
                      onClose={() => {
                        setColorPickerAnchor(null)
                        setEditingColorIndex(null)
                      }}
                    >
                      <DialogTitle>Edit Color</DialogTitle>
                      <DialogContent>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                          <TextField
                            label="Hex Color"
                            value={editingColorIndex !== null && selectedPalette ? selectedPalette.colors[editingColorIndex]?.hex : '#000000'}
                            onChange={(e) => handleColorChange(e.target.value)}
                            size="small"
                            fullWidth
                          />
                          <Box
                            component="input"
                            type="color"
                            value={editingColorIndex !== null && selectedPalette ? selectedPalette.colors[editingColorIndex]?.hex : '#000000'}
                            onChange={(e) => handleColorChange(e.target.value)}
                            aria-label="Color picker"
                            title="Choose color"
                            sx={{
                              width: '100%',
                              height: 60,
                              cursor: 'pointer',
                              border: 'none',
                              borderRadius: '4px'
                            }}
                          />
                        </Stack>
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={() => {
                          setColorPickerAnchor(null)
                          setEditingColorIndex(null)
                        }}>Done</Button>
                      </DialogActions>
                    </Dialog>
                  </>
                ) : (
                  !useAutoPalette && (
                    <Typography variant="body2" color="text.secondary">
                      No palette selected.
                    </Typography>
                  )
                )}

                {extractedPalettes.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>HISTORY</Typography>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      {extractedPalettes.map((p, i) => (
                        <Chip 
                          key={i} 
                          label={p.name || `Palette ${i+1}`} 
                          onClick={() => {
                            setSelectedPalette(p)
                            setUseAutoPalette(false)
                          }}
                          variant={selectedPalette === p && !useAutoPalette ? 'filled' : 'outlined'}
                          size="small"
                          sx={{ justifyContent: 'flex-start' }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* SHEET SETTINGS */}
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon /> Settings
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Sprite Size: {parameters.spriteSize}px
                    </Typography>
                    <Slider
                      value={Math.log2(parameters.spriteSize / 8)}
                      onChange={(_, value) => setParameters(prev => ({ ...prev, spriteSize: 8 * Math.pow(2, value as number) }))}
                      min={0}
                      max={6}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                      valueLabelFormat={(v) => `${8 * Math.pow(2, v)}px`}
                      size="small"
                    />
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={useAutoPalette}
                        onChange={(e) => setUseAutoPalette(e.target.checked)}
                        color="primary"
                        size="small"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">Auto-generate Palette</Typography>
                        <Typography variant="caption" color="text.secondary">AI chooses colors based on prompt</Typography>
                      </Box>
                    }
                  />

                  <FormControl fullWidth size="small">
                    <InputLabel>Layout</InputLabel>
                    <Select
                      value={parameters.layout}
                      label="Layout"
                      onChange={(e) => setParameters(prev => ({ ...prev, layout: e.target.value }))}
                    >
                      {layoutOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                    </Select>
                  </FormControl>

                  <Box>
                    <Typography variant="caption" gutterBottom>Padding: {parameters.padding}px</Typography>
                    <Slider
                      value={parameters.padding}
                      onChange={(_, v) => setParameters(prev => ({ ...prev, padding: v as number }))}
                      min={0} max={64} step={4}
                      size="small"
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>

          </Stack>
        </Grid>
      </Grid>

      {/* PALETTE DIALOG */}
      <Dialog open={showCustomPaletteDialog} onClose={() => setShowCustomPaletteDialog(false)}>
        <DialogTitle>Create Palette</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3} sx={{ mt: 1, minWidth: 300 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Base Color"
                value={customPalette.baseColors[0]}
                onChange={(e) => setCustomPalette(prev => ({ ...prev, baseColors: [e.target.value] }))}
                size="small"
                fullWidth
              />
              <Box
                component="input"
                type="color"
                value={customPalette.baseColors[0]}
                onChange={(e) => setCustomPalette(prev => ({ ...prev, baseColors: [e.target.value] }))}
                aria-label="Base color picker"
                title="Choose base color"
                sx={{
                  width: 40,
                  height: 40,
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none'
                }}
              />
            </Stack>

            <FormControl fullWidth size="small">
              <InputLabel>Harmony</InputLabel>
              <Select
                value={customPalette.harmony}
                label="Harmony"
                onChange={(e) => setCustomPalette(prev => ({ ...prev, harmony: e.target.value }))}
              >
                {harmonyOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="caption">Count: {customPalette.count}</Typography>
              <Slider
                value={customPalette.count}
                onChange={(_, v) => setCustomPalette(prev => ({ ...prev, count: v as number }))}
                min={4} max={32} step={1}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCustomPaletteDialog(false)}>Cancel</Button>
          <Button onClick={generateCustomPalette} variant="contained" disabled={isGeneratingPalette}>
            {isGeneratingPalette ? 'Generating...' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SpriteEditor