import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline, Box } from '@mui/material'
import SpriteEditor from '@/pages/SpriteEditor'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6897BB',
      light: '#8AB4D3',
      dark: '#4A7BA7',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#CC7832',
      light: '#D79A5C',
      dark: '#B5651D',
      contrastText: '#ffffff'
    },
    background: {
      default: '#2B2B2B',
      paper: '#3C3F41'
    },
    text: {
      primary: '#A9B7C6',
      secondary: '#808080'
    },
    error: {
      main: '#BC3F3C',
      light: '#C96765',
      dark: '#A32D2A'
    },
    warning: {
      main: '#BBB529',
      light: '#D4D168',
      dark: '#9A931F'
    },
    success: {
      main: '#629755',
      light: '#85B77A',
      dark: '#4A7542'
    },
    info: {
      main: '#6897BB',
      light: '#8AB4D3',
      dark: '#4A7BA7'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      color: '#A9B7C6'
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      color: '#A9B7C6'
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      color: '#A9B7C6'
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      color: '#A9B7C6'
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.125rem',
      color: '#A9B7C6'
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
      color: '#A9B7C6'
    },
    body1: {
      fontSize: '0.875rem',
      color: '#A9B7C6'
    },
    body2: {
      fontSize: '0.75rem',
      color: '#808080'
    }
  },
  shape: {
    borderRadius: 12
  },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          // Custom scrollbar styling - Darcula colors
          '&::-webkit-scrollbar': {
            width: '12px',
            height: '12px'
          },
          '&::-webkit-scrollbar-track': {
            background: '#2B2B2B'
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#555555',
            borderRadius: '6px',
            border: '2px solid #2B2B2B'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#6B6B6B'
          },
          // Apply to all scrollable elements
          '*::-webkit-scrollbar': {
            width: '10px',
            height: '10px'
          },
          '*::-webkit-scrollbar-track': {
            background: '#2B2B2B'
          },
          '*::-webkit-scrollbar-thumb': {
            background: '#555555',
            borderRadius: '5px',
            border: '2px solid #2B2B2B'
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: '#6B6B6B'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #323232',
          '&:hover': {
            borderColor: '#555555'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '8px 16px'
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(104, 151, 187, 0.4)'
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#3C3F41',
          borderBottom: '1px solid #323232'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#3C3F41',
          borderRight: '1px solid #323232'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: '#A9B7C6'
        }
      }
    }
  }
})

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', p: 3, backgroundColor: 'background.default' }}>
        <SpriteEditor />
      </Box>
    </ThemeProvider>
  )
}

export default App