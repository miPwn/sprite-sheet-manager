const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const SpriteSheetGenerator = require('../services/SpriteSheetGenerator');
const PixelMapRenderer = require('../services/PixelMapRenderer');
const ClaudeService = require('../services/ClaudeService');

const router = express.Router();


router.get('/layouts', (req, res) => {
  const layouts = [
    { 
      id: 'optimal', 
      name: 'Optimal Packing', 
      description: 'Automatically optimizes sprite placement for minimal waste'
    },
    { 
      id: 'grid', 
      name: 'Grid Layout', 
      description: 'Arranges sprites in a regular grid pattern'
    },
    { 
      id: 'horizontal', 
      name: 'Horizontal Strip', 
      description: 'Places all sprites in a single horizontal row'
    },
    { 
      id: 'vertical', 
      name: 'Vertical Strip', 
      description: 'Places all sprites in a single vertical column'
    }
  ];

  res.json({ layouts });
});

router.get('/formats', (req, res) => {
  const formats = [
    { id: 'png', name: 'PNG', description: 'Lossless compression with transparency support' },
    { id: 'jpeg', name: 'JPEG', description: 'Lossy compression, smaller file size' },
    { id: 'webp', name: 'WebP', description: 'Modern format with excellent compression' }
  ];

  res.json({ formats });
});

router.post('/generate-ai', async (req, res) => {
  let capturedPrompt = '';
  let capturedResponse = '';
  
  try {
    const { prompt, parameters = {}, palette = null } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required for AI generation' });
    }

    const claudeService = new ClaudeService();
    
    let validationResult = null;
    if (!parameters.requestedCount) {
      validationResult = await claudeService.validatePrompt(prompt.trim());
      console.log('Validation result:', validationResult);
    }
    
    const claudeResponse = await claudeService.generateSpritePixelMaps(prompt.trim(), parameters, palette, validationResult);

    capturedPrompt = claudeResponse.claudePrompt || '';
    capturedResponse = claudeResponse.claudeResponse || '';
    
    console.log('Captured prompt length:', capturedPrompt.length);
    console.log('Captured response length:', capturedResponse.length);

    const renderer = new PixelMapRenderer();
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'generated');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const generatedSprites = await Promise.all(
      claudeResponse.sprites.map(async (spriteData) => {
        const imageBuffer = await renderer.renderPixelMap(spriteData.pixelMap, {
          width: spriteData.width,
          height: spriteData.height
        });
        const filename = `${uuidv4()}.png`;
        const filePath = path.join(uploadsDir, filename);
        
        await fs.writeFile(filePath, imageBuffer);
        console.log('Saved sprite:', filename, 'to', filePath);

        return {
          id: uuidv4(),
          name: spriteData.name,
          imageUrl: `/uploads/generated/${filename}`,
          width: spriteData.width,
          height: spriteData.height,
          pixelMap: spriteData.pixelMap
        };
      })
    );

    const responseData = {
      success: true,
      sprites: generatedSprites,
      palette: claudeResponse.suggestedPalette.map(hex => ({
        hex,
        rgb: hexToRgb(hex),
        hsl: hexToHsl(hex)
      })),
      claudePrompt: capturedPrompt,
      claudeResponse: capturedResponse
    };
    
    console.log('Sending response with prompt length:', responseData.claudePrompt.length);

    res.json(responseData);
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({
      error: error.message,
      claudePrompt: error.claudePrompt || capturedPrompt,
      claudeResponse: error.claudeResponse || capturedResponse
    });
  }
});

router.post('/generate-sheet', async (req, res) => {
  try {
    const {
      sprites,
      parameters = {},
      layout = 'optimal',
      outputFormat = 'png'
    } = req.body;

    if (!sprites || !Array.isArray(sprites) || sprites.length === 0) {
      return res.status(400).json({ error: 'No sprites provided for sheet generation' });
    }

    const generator = new SpriteSheetGenerator();
    const result = await generator.generateFromSprites({
      sprites,
      parameters,
      layout,
      outputFormat
    });

    res.json({
      success: true,
      spriteSheet: result.spriteSheet,
      metadata: result.metadata,
      outputPath: result.outputPath
    });
  } catch (error) {
    console.error('Sheet generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/validate-prompt', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const claudeService = new ClaudeService();
    const result = await claudeService.validatePrompt(prompt.trim());

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Prompt validation error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { userPrompt } = req.body;
    const imageBase64 = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype;

    const claudeService = new ClaudeService();
    const result = await claudeService.analyzeImage(imageBase64, mediaType, userPrompt || '');

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function hexToHsl(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100) / 100,
    l: Math.round(l * 100) / 100
  };
}

router.delete('/cleanup/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const tempPath = path.join('uploads', 'temp');
    const outputPath = path.join('uploads', 'output');

    await Promise.allSettled([
      fs.rm(path.join(tempPath, sessionId), { recursive: true, force: true }),
      fs.rm(path.join(outputPath, sessionId), { recursive: true, force: true })
    ]);

    res.json({ success: true, message: 'Cleanup completed' });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;