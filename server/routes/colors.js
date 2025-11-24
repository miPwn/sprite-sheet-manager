const express = require('express');
const multer = require('multer');
const path = require('path');
const ColorExtractor = require('../services/ColorExtractor');
const ClaudeService = require('../services/ClaudeService');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type for color extraction'));
    }
  }
});

router.post('/extract', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const { maxColors = 16, quality = 10 } = req.body;
    const extractor = new ColorExtractor();
    
    const palette = await extractor.extractPalette(req.file.buffer, {
      maxColors: parseInt(maxColors),
      quality: parseInt(quality)
    });

    res.json({
      success: true,
      palette: palette.colors,
      dominantColor: palette.dominant,
      metadata: {
        originalImage: {
          size: req.file.size,
          type: req.file.mimetype
        },
        extraction: {
          maxColors: parseInt(maxColors),
          quality: parseInt(quality),
          colorsFound: palette.colors.length
        }
      }
    });
  } catch (error) {
    console.error('Color extraction error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/analyze-batch', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const { maxColors = 16, quality = 10 } = req.body;
    const extractor = new ColorExtractor();
    
    const results = await Promise.all(
      req.files.map(async (file, index) => {
        try {
          const palette = await extractor.extractPalette(file.buffer, {
            maxColors: parseInt(maxColors),
            quality: parseInt(quality)
          });
          
          return {
            index,
            filename: file.originalname,
            success: true,
            palette: palette.colors,
            dominantColor: palette.dominant
          };
        } catch (error) {
          return {
            index,
            filename: file.originalname,
            success: false,
            error: error.message
          };
        }
      })
    );

    const successfulExtractions = results.filter(r => r.success);
    const combinedPalette = extractor.combinePalettes(
      successfulExtractions.map(r => r.palette),
      parseInt(maxColors)
    );

    res.json({
      success: true,
      results,
      combinedPalette,
      metadata: {
        totalImages: req.files.length,
        successfulExtractions: successfulExtractions.length,
        failedExtractions: results.length - successfulExtractions.length
      }
    });
  } catch (error) {
    console.error('Batch color analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-palette', async (req, res) => {
  try {
    const {
      baseColors = [],
      count = 16,
      harmony = 'complementary',
      saturation = 0.8,
      lightness = 0.5
    } = req.body;

    if (!baseColors || baseColors.length === 0) {
      return res.status(400).json({ error: 'No base colors provided' });
    }

    const claudeService = new ClaudeService();
    const generatedPalette = await claudeService.generateColorPalette(
      baseColors[0],
      harmony,
      parseInt(count)
    );

    res.json({
      success: true,
      palette: generatedPalette,
      metadata: {
        baseColors,
        harmony,
        saturation,
        lightness,
        generated: generatedPalette.length
      }
    });
  } catch (error) {
    console.error('Palette generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/harmonies', (req, res) => {
  const harmonies = [
    { id: 'monochromatic', name: 'Monochromatic', description: 'Variations of a single color' },
    { id: 'complementary', name: 'Complementary', description: 'Colors opposite on the color wheel' },
    { id: 'triadic', name: 'Triadic', description: 'Three evenly spaced colors' },
    { id: 'analogous', name: 'Analogous', description: 'Adjacent colors on the wheel' },
    { id: 'split-complementary', name: 'Split Complementary', description: 'Base color plus two adjacent to its complement' },
    { id: 'tetradic', name: 'Tetradic', description: 'Four colors in two complementary pairs' }
  ];

  res.json({ harmonies });
});

module.exports = router;