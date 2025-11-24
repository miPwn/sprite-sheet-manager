import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Paper,
  Stack,
  Chip,
  useTheme
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Edit as EditIcon,
  Palette as PaletteIcon,
  GridView as GridIcon,
  Speed as SpeedIcon,
  AutoFixHigh as AutoIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

const Dashboard: React.FC = () => {
  const theme = useTheme()
  const navigate = useNavigate()

  const features = [
    {
      icon: <UploadIcon fontSize="large" />,
      title: 'Smart Upload',
      description: 'Drag & drop multiple images with automatic optimization',
      color: theme.palette.primary.main
    },
    {
      icon: <PaletteIcon fontSize="large" />,
      title: 'Color Intelligence',
      description: 'Extract palettes up to 16 colors or infer from reference images',
      color: theme.palette.secondary.main
    },
    {
      icon: <GridIcon fontSize="large" />,
      title: 'Advanced Layouts',
      description: 'Optimal packing algorithms for efficient sprite sheets',
      color: theme.palette.success.main
    },
    {
      icon: <SpeedIcon fontSize="large" />,
      title: 'Multiple Formats',
      description: 'Export as PNG, JPEG, WebP with configurable quality',
      color: theme.palette.warning.main
    },
    {
      icon: <AutoIcon fontSize="large" />,
      title: 'Batch Processing',
      description: 'Process multiple sprite sheets with consistent settings',
      color: theme.palette.info.main
    },
    {
      icon: <EditIcon fontSize="large" />,
      title: 'Real-time Preview',
      description: 'See changes instantly as you adjust parameters',
      color: theme.palette.error.main
    }
  ]

  const quickActions = [
    {
      title: 'New Sprite Sheet',
      description: 'Start creating a new sprite sheet from images',
      action: () => navigate('/editor'),
      buttonText: 'Create Now',
      variant: 'contained' as const,
      color: 'primary' as const
    },
    {
      title: 'Extract Color Palette',
      description: 'Generate color palettes from reference images',
      action: () => navigate('/palette'),
      buttonText: 'Extract Colors',
      variant: 'outlined' as const,
      color: 'secondary' as const
    }
  ]

  const recentStats = [
    { label: 'Sprite Sheets Created', value: '0', trend: '+0%' },
    { label: 'Images Processed', value: '0', trend: '+0%' },
    { label: 'Color Palettes Generated', value: '0', trend: '+0%' },
    { label: 'Total File Size Saved', value: '0 MB', trend: '+0%' }
  ]

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
          Welcome to Sprite Sheet Manager
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600 }}>
          Professional sprite sheet management with advanced color palette extraction and intelligent 
          layout optimization. Create stunning sprite sheets with perfect color harmony.
        </Typography>
        
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Chip 
            label="Dark Material Design" 
            variant="outlined" 
            color="primary" 
            size="small"
          />
          <Chip 
            label="16 Color Palettes" 
            variant="outlined" 
            color="secondary" 
            size="small"
          />
          <Chip 
            label="Multiple Export Formats" 
            variant="outlined" 
            color="success" 
            size="small"
          />
          <Chip 
            label="Optimal Packing" 
            variant="outlined" 
            color="warning" 
            size="small"
          />
        </Stack>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {action.description}
                </Typography>
                <Button
                  variant={action.variant}
                  color={action.color}
                  onClick={action.action}
                  size="large"
                >
                  {action.buttonText}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Key Features
        </Typography>
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} lg={4} key={index}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  border: 1,
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: feature.color,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease-in-out'
                  }
                }}
              >
                <Box sx={{ color: feature.color, mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Usage Statistics
          </Typography>
          <Grid container spacing={3}>
            {recentStats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {stat.label}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    {stat.trend}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Dashboard