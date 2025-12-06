# Sprite Sheet Manager

A modern, professional sprite sheet management application built with React, Node.js, and Material-UI. Features advanced color palette extraction, intelligent layout optimization, and a sleek dark material design interface.

## eatures

### Core Functionality

- **Smart Image Upload**: Drag & drop multiple images with automatic optimization
- **Advanced Color Palette Extraction**: Extract up to 16 colors from reference images
- **Intelligent Layout Algorithms**: Optimal packing, grid, horizontal, and vertical layouts
- **Multiple Export Formats**: PNG, JPEG, WebP with configurable quality settings
- **Real-time Preview**: See changes instantly as you adjust parameters

### Advanced Capabilities

- **Color Harmony Generation**: Create custom palettes using color theory
- **Batch Processing**: Process multiple sprite sheets with consistent settings
- **Power-of-Two Optimization**: Automatic power-of-two dimension scaling
- **Configurable Parameters**: Padding, background color, maximum dimensions
- **Export Options**: JSON metadata, CSS variables, and raw hex values

### User Experience

- **Dark Material Design**: Modern, professional interface
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Drag & Drop Interface**: Intuitive file upload and management
- **Real-time Feedback**: Progress indicators and instant previews
- **Copy-to-Clipboard**: Quick color code copying

## 🛠 Tech Stack

### Frontend

- **React 18** with TypeScript
- **Material-UI (MUI) 5** with custom dark theme
- **React Router** for navigation
- **React Dropzone** for file upload
- **Vite** for fast development and building

### Backend

- **Node.js** with Express
- **Sharp** for high-performance image processing
- **Jimp** for color analysis
- **Multer** for file upload handling
- **Helmet** & **Compression** for security and performance

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. Clone the repository

```bash
git clone <repository-url>
cd sprite-sheet-manager
```

2. Install dependencies

```bash
npm run install-deps
```

3. Start the development servers

```bash
npm run dev
```

The application will be available at:

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:5000>

## Usage

### Creating a Sprite Sheet

1. **Upload Images**
   - Navigate to the Sprite Editor
   - Drag and drop images or click to select files
   - Supports PNG, JPEG, GIF, and WebP formats

2. **Configure Parameters**
   - Select layout algorithm (optimal, grid, horizontal, vertical)
   - Choose output format (PNG, JPEG, WebP)
   - Adjust padding, dimensions, and other settings

3. **Generate & Download**
   - Click "Generate Sprite Sheet"
   - Preview the result
   - Download the sprite sheet and metadata

### Color Palette Extraction

1. **Upload Reference Images**
   - Navigate to Color Palette
   - Upload one or multiple reference images
   - Adjust extraction quality and color count

2. **Generate Custom Palettes**
   - Use color harmony tools
   - Choose from monochromatic, complementary, triadic, and other schemes
   - Adjust saturation and lightness

3. **Export Palettes**
   - Download as JSON, CSS, or plain text
   - Copy individual colors to clipboard
   - Save palette history for reuse

## Architecture

### Project Structure

```
sprite-sheet-manager/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── services/      # API communication
│   │   ├── types/         # TypeScript definitions
│   │   └── utils/         # Utility functions
│   ├── public/            # Static assets
│   └── package.json
├── server/                # Node.js backend
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic
│   ├── uploads/          # File storage
│   └── package.json
└── package.json          # Root package configuration
```

### API Endpoints

#### Sprite Sheet Management

- `POST /api/sprites/upload` - Upload images for processing
- `POST /api/sprites/generate` - Generate sprite sheet
- `GET /api/sprites/layouts` - Get available layout algorithms
- `GET /api/sprites/formats` - Get supported output formats
- `DELETE /api/sprites/cleanup/:sessionId` - Clean up temporary files

#### Color Palette Operations

- `POST /api/colors/extract` - Extract colors from single image
- `POST /api/colors/analyze-batch` - Batch color analysis
- `POST /api/colors/generate-palette` - Generate custom color harmony
- `GET /api/colors/harmonies` - Get available color harmony types

## Color Features

### Supported Color Harmonies

- **Monochromatic**: Variations of a single color
- **Complementary**: Colors opposite on the color wheel
- **Triadic**: Three evenly spaced colors
- **Analogous**: Adjacent colors on the wheel
- **Split Complementary**: Base color plus two adjacent to its complement
- **Tetradic**: Four colors in two complementary pairs

### Export Formats

- **JSON**: Complete palette data with RGB, HSL, and hex values
- **CSS**: CSS custom properties for direct web use
- **Text**: Simple list of hex values

## Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
PORT=5000
NODE_ENV=development
CLAUDE_API_KEY=your_api_key_here
UPLOAD_LIMIT=10mb
MAX_FILES=20
```

### Build Configuration

- **Frontend**: Vite configuration in `client/vite.config.ts`
- **TypeScript**: Configuration in `client/tsconfig.json`
- **Backend**: Express configuration in `server/index.js`

## Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run client` - Start only the React development server
- `npm run server` - Start only the Node.js backend server
- `npm run build` - Build the frontend for production
- `npm run install-deps` - Install dependencies for all packages

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Material-UI team for the excellent React components
- Sharp.js for high-performance image processing
- React Dropzone for seamless file upload experience
- The open source community for inspiration and tools
