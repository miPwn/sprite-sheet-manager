const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY
    });
    this.logsDir = path.join(__dirname, '../logs');
    
    // Ensure logs directory and subfolders exist
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
    // Create subfolders for requests and responses
    const requestsDir = path.join(this.logsDir, 'requests');
    const responsesDir = path.join(this.logsDir, 'responses');
    if (!fs.existsSync(requestsDir)) {
      fs.mkdirSync(requestsDir, { recursive: true });
    }
    if (!fs.existsSync(responsesDir)) {
      fs.mkdirSync(responsesDir, { recursive: true });
    }
  }

  // Log AI request
  logRequest(method, prompt) {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const filename = `ai-request-log-${year}-${month}-${day}-${hours}-${minutes}-${seconds}.log`;
      const logPath = path.join(this.logsDir, 'requests', filename);
      
      const separator = '='.repeat(80);
      const logContent = `${separator}\nMETHOD: ${method}\nTIMESTAMP: ${now.toISOString()}\n${separator}\n\nFULL PROMPT:\n${prompt}\n\n${separator}\n`;
      
      fs.writeFileSync(logPath, logContent, 'utf8');
      console.log(`Logged AI request to: ${filename}`);
    } catch (error) {
      console.error('Failed to write AI request log:', error);
    }
  }

  // Log AI response
  logResponse(method, response) {
    try {
      const now = new Date();
      const filename = `ai-response-log-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.log`;
      const logPath = path.join(this.logsDir, 'responses', filename);
      const separator = '='.repeat(80);
      const logContent = `${separator}\nMETHOD: ${method}\nTIMESTAMP: ${now.toISOString()}\n${separator}\n\nFULL RESPONSE:\n${response}\n${separator}\n`;
      fs.writeFileSync(logPath, logContent, 'utf8');
      console.log(`Logged AI response to: ${filename}`);
    } catch (error) {
      console.error('Failed to write AI response log:', error);
    }
  }

  async generateSpritePixelMaps(prompt, parameters, palette, validationResult = null) {
    const { spriteSize = 16, style = 'pixel-art' } = parameters;

    let requestedCount;
    if (typeof parameters.requestedCount === 'number') {
      requestedCount = parameters.requestedCount;
    } else if (validationResult && validationResult.requestedCount) {
      requestedCount = this.parseRequestedCountFromValidation(validationResult);
    } else {
      requestedCount = 8;
    }
    
    if (!requestedCount || requestedCount <= 0) {
      throw new Error('A valid sprite count must be provided either via parameters.requestedCount or in the prompt.');
    }
    
    // Auto-palette logic: If no palette provided, ask Claude to generate one
    const useAutoPalette = !palette;
    const paletteColors = palette ? palette.colors.map(c => c.hex) : [];
    
    
    
    console.log(`Requesting ${requestedCount} sprites. Auto-palette: ${useAutoPalette}`);
    
    let paletteInstruction = '';
    if (useAutoPalette) {
      paletteInstruction = `PALETTE GENERATION:
1. First, generate a coherent color palette (max 8-12 colors) that fits the theme: "${prompt}".
2. Use ONLY these generated colors for the sprites.
3. Include these colors in the "suggestedPalette" field of the response.`;
    } else {
      paletteInstruction = `PALETTE - Use ONLY these ${paletteColors.length} colors (hex format):
${paletteColors.map((c, i) => `${i}: ${c}`).join('\n')}`;
    }

    const fullPrompt = `Generate exactly ${requestedCount} ${spriteSize}x${spriteSize} pixel art sprites for: "${prompt}"
    ${paletteInstruction}


DESIGN CONSTRAINTS:
1. Clean Pixel Art: Use solid colors, NO gradients, NO noise, NO anti-aliasing.
2. Distinct Shapes: Ensure sprites are readable at small sizes.
3. Consistency: All sprites should share the same style and perspective.

REQUIRED JSON FORMAT:
You MUST return a valid JSON object with this EXACT structure:

{
  "sprites": [
    {
      "name": "Sprite 1 Name",
      "pixelMap": [
        [0, 0, 1, 1, ... (${spriteSize} palette indices)],
        [0, 1, 2, 3, ... (${spriteSize} palette indices)],
        ... (${spriteSize} rows)
      ],
      "width": ${spriteSize},
      "height": ${spriteSize}
    }
  ],
  "suggestedPalette": ["#color1", "#color2", ...]
}

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON - NO explanatory text before or after
2. "sprites" array MUST contain EXACTLY ${requestedCount} sprite objects
3. Each "pixelMap" MUST be a 2D array (array of rows)
4. Each row MUST contain EXACTLY ${spriteSize} INTEGERS (palette indices)
5. There MUST be EXACTLY ${spriteSize} rows
6. Palette indices must be integers from 0 to (palette_length - 1)
7. Each index refers to a color in the suggestedPalette array
8. All colors in suggestedPalette MUST be in "#RRGGBB" hex format

EXAMPLE for 2x2 sprite with 3-color palette:
{
  "sprites": [
    {
      "name": "Red Square",
      "pixelMap": [
        [0, 0],
        [0, 0]
      ],
      "width": 2,
      "height": 2
    }
  ],
  "suggestedPalette": ["#FF0000", "#00FF00", "#0000FF"]
}

NOW generate ALL ${requestedCount} ${style} sprites matching "${prompt}". Return ONLY the JSON object.`;
    
    try {
      const result = await this.generateChunk(fullPrompt, spriteSize);
      this.logResponse('GENERATE_SPRITES_RESPONSE', result.claudeResponse);
      
      // If auto-palette, use the one returned by Claude for repair
      const repairPalette = useAutoPalette ? (result.suggestedPalette || ['#000000']) : paletteColors;

      // Post-process and repair sprites
      const repairedSprites = result.sprites.map(sprite => {
        const repaired = this.repairSprite(sprite, spriteSize, 0); // Default to index 0
        
        // Convert palette indices to hex colors
        const hexPixelMap = repaired.pixelMap.map(row => 
          row.map(index => {
            // If it's already a hex color, keep it (backward compatibility)
            if (typeof index === 'string' && index.startsWith('#')) {
              return index;
            }
            // Convert index to hex color
            const paletteIndex = typeof index === 'number' ? index : parseInt(index) || 0;
            return repairPalette[paletteIndex] || repairPalette[0] || '#000000';
          })
        );
        
        return {
          ...repaired,
          pixelMap: hexPixelMap
        };
      });

      return {
        sprites: repairedSprites,
        suggestedPalette: result.suggestedPalette || repairPalette,
        claudePrompt: fullPrompt,
        claudeResponse: result.claudeResponse
      };
    } catch (error) {
      error.claudePrompt = error.claudePrompt || fullPrompt;
      error.claudeResponse = error.claudeResponse || '';
      throw error;
    }
  }

  repairSprite(sprite, targetSize, defaultValue = 0) {
    let { pixelMap, width, height } = sprite;
    
    // Ensure pixelMap is 2D array
    if (!Array.isArray(pixelMap)) {
      pixelMap = [];
    }

    // If flat array, try to convert to 2D
    if (pixelMap.length > 0 && !Array.isArray(pixelMap[0])) {
      const newMap = [];
      for (let i = 0; i < pixelMap.length; i += targetSize) {
        newMap.push(pixelMap.slice(i, i + targetSize));
      }
      pixelMap = newMap;
    }

    // Ensure correct number of rows
    if (pixelMap.length < targetSize) {
      const missingRows = targetSize - pixelMap.length;
      for (let i = 0; i < missingRows; i++) {
        pixelMap.push(Array(targetSize).fill(defaultValue));
      }
    } else if (pixelMap.length > targetSize) {
      pixelMap = pixelMap.slice(0, targetSize);
    }

    // Ensure correct number of columns in each row (works with both indices and hex)
    pixelMap = pixelMap.map(row => {
      if (!Array.isArray(row)) return Array(targetSize).fill(defaultValue);
      
      if (row.length < targetSize) {
        return [...row, ...Array(targetSize - row.length).fill(defaultValue)];
      } else if (row.length > targetSize) {
        return row.slice(0, targetSize);
      }
      return row;
    });

    return {
      ...sprite,
      pixelMap,
      width: targetSize,
      height: targetSize
    };
  }

  parseRequestedCountFromValidation(validationResult) {
    if (validationResult.requestedCount &&
        typeof validationResult.requestedCount === 'number' &&
        validationResult.requestedCount > 0 &&
        validationResult.requestedCount <= 200) {
      return validationResult.requestedCount;
    }
    return 8;
  }

  extractAndRepairJSON(content) {
    const strategies = [
      {
        name: 'sprites-array-search',
        extract: () => {
          const match = content.match(/\{\s*"sprites"\s*:\s*\[[^]*?\]\s*,?\s*"suggestedPalette"\s*:[^]*?\}/);
          return match ? match[0] : null;
        }
      },
      {
        name: 'code-block',
        extract: () => {
          const match = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          return match ? match[1].trim() : null;
        }
      },
      {
        name: 'complete-object',
        extract: () => {
          const matches = content.match(/\{[^]*?\}/g);
          if (!matches) return null;
          
          let validMatches = [];
          for (const match of matches) {
            try {
              const parsed = JSON.parse(match);
              validMatches.push({ text: match, parsed, length: match.length });
            } catch (e) {
              continue;
            }
          }
          
          if (validMatches.length === 0) {
            return matches[matches.length - 1];
          }
          
          const withSprites = validMatches.find(m => m.parsed.sprites && Array.isArray(m.parsed.sprites));
          if (withSprites) {
            return withSprites.text;
          }
          
          validMatches.sort((a, b) => b.length - a.length);
          return validMatches[0].text;
        }
      },
      {
        name: 'greedy-match',
        extract: () => {
          const match = content.match(/\{[^]*$/);
          return match ? match[0] : null;
        }
      }
    ];

    for (const strategy of strategies) {
      try {
        const extracted = strategy.extract();
        if (!extracted) continue;

        let jsonStr = extracted;
        
        const openBraces = (jsonStr.match(/\{/g) || []).length;
        const closeBraces = (jsonStr.match(/\}/g) || []).length;
        const openBrackets = (jsonStr.match(/\[/g) || []).length;
        const closeBrackets = (jsonStr.match(/\]/g) || []).length;

        if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
          console.log(`[${strategy.name}] Attempting to repair unbalanced JSON (braces: ${openBraces}/${closeBraces}, brackets: ${openBrackets}/${closeBrackets})`);
          
          jsonStr = jsonStr.replace(/,\s*"[^"]*$/, '');
          jsonStr = jsonStr.replace(/,\s*\[+$/, '');
          jsonStr = jsonStr.replace(/,\s*$/, '');
          
          let lastValidPos = jsonStr.length;
          for (let i = jsonStr.length - 1; i >= 0; i--) {
            if (jsonStr[i] === '"') {
              const beforeQuote = jsonStr.substring(0, i);
              const quoteCount = (beforeQuote.match(/"/g) || []).length;
              if (quoteCount % 2 === 0) {
                lastValidPos = i;
                break;
              }
            }
          }
          jsonStr = jsonStr.substring(0, lastValidPos);
          
          for (let i = 0; i < openBrackets - closeBrackets; i++) {
            jsonStr += ']';
          }
          
          for (let i = 0; i < openBraces - closeBraces; i++) {
            jsonStr += '}';
          }
        }

        try {
          const parsed = JSON.parse(jsonStr);
          console.log(`[${strategy.name}] Successfully parsed JSON`);
          return parsed;
        } catch (parseError) {
          console.log(`[${strategy.name}] Parse failed after repair: ${parseError.message}`);
          
          try {
            const lastCommaPos = jsonStr.lastIndexOf(',');
            if (lastCommaPos > 0) {
              const truncated = jsonStr.substring(0, lastCommaPos);
              const rebalanced = truncated + ']'.repeat(openBrackets - closeBrackets) + '}'.repeat(openBraces - closeBraces);
              const parsed = JSON.parse(rebalanced);
              console.log(`[${strategy.name}] Recovered by removing last incomplete item`);
              return parsed;
            }
          } catch (recoveryError) {
            continue;
          }
        }
      } catch (strategyError) {
        console.log(`[${strategy.name}] Strategy failed: ${strategyError.message}`);
        continue;
      }
    }

    return null;
  }

  async generateChunk(claudePrompt, spriteSize) {
    let claudeResponseText = '';
    
    try {
      this.logRequest('GENERATE_SPRITES', claudePrompt);
      
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 32000,
      // Log the AI response after generation
      // Note: claudeResponse contains both the prompt and the raw response text
      // We'll log the full response JSON for debugging/audit purposes
      // The response is captured later after extracting the text

        messages: [
          {
            role: 'user',
            content: claudePrompt
          }
        ],
        temperature: 0.7
      });

      claudeResponseText = response.content[0].text.trim();
      console.log(`Received response length: ${claudeResponseText.length} chars`);
      
      const result = this.extractAndRepairJSON(claudeResponseText);
      
      if (!result) {
        console.error('All extraction strategies failed. Response preview:', claudeResponseText.substring(0, 500));
        const error = new Error('Unable to extract valid JSON from Claude response after trying multiple strategies');
        error.claudePrompt = claudePrompt;
        error.claudeResponse = claudeResponseText;
        throw error;
      }

      console.log('Parsed JSON structure:', JSON.stringify(Object.keys(result)));
      console.log('Full result preview:', JSON.stringify(result).substring(0, 500));

      if (!result.sprites || !Array.isArray(result.sprites)) {
        console.log('Result keys:', Object.keys(result));
        console.log('Result.sprites type:', typeof result.sprites);
        
        if (result.name && result.pixelMap && result.width && result.height) {
          console.log('Found single sprite object, wrapping in sprites array');
          result = {
            sprites: [result],
            suggestedPalette: result.suggestedPalette || []
          };
        } else {
          const error = new Error(`Invalid response format: missing sprites array. Got keys: ${Object.keys(result).join(', ')}`);
          error.claudePrompt = claudePrompt;
          error.claudeResponse = claudeResponseText;
          throw error;
        }
      }

      console.log(`Successfully extracted ${result.sprites.length} sprites from response`);
      
      return {
        ...result,
        claudePrompt,
        claudeResponse: claudeResponseText
      };

    } catch (error) {
      console.error('Claude API Error:', error);
      error.claudePrompt = error.claudePrompt || claudePrompt;
      error.claudeResponse = error.claudeResponse || claudeResponseText;
      throw error;
    }
  }

  async generateColorPalette(baseColor, harmonyType, count) {
    const claudePrompt = `Generate a ${harmonyType} color harmony palette starting with base color ${baseColor}.

Please respond with ONLY a valid JSON object in this exact format:
{
  "palette": [
    {
      "hex": "#FF0000",
      "rgb": {"r": 255, "g": 0, "b": 0},
      "hsl": {"h": 0, "s": 1, "l": 0.5}
    }
  ]
}

Requirements:
- Generate exactly ${count} colors
- Use ${harmonyType} color harmony rules
- Start with base color ${baseColor}
- Each color must have hex, rgb, and hsl values
- Hex format: "#RRGGBB"
- RGB: values 0-255
- HSL: h=0-360, s=0-1, l=0-1

Return ONLY the JSON object, no additional text.`;

    try {
      this.logRequest('GENERATE_COLOR_PALETTE', claudePrompt);
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: claudePrompt
          }
        ],
        temperature: 0.3
      });

      const content = response.content[0].text.trim();
      this.logResponse('GENERATE_COLOR_PALETTE_RESPONSE', content);
      
      let result;
      let jsonStr = content;
      
      const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      } else {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }
      
      try {
        result = JSON.parse(jsonStr);
      } catch (e) {
        console.error('Failed to parse color palette JSON:', content);
        throw new Error(`No valid JSON found in Claude response: ${e.message}`);
      }

      if (!result.palette || !Array.isArray(result.palette)) {
        throw new Error('Invalid response format: missing palette array');
      }

      return result.palette;

    } catch (error) {
      console.error('Claude API Error:', error);
      throw new Error(`Failed to generate color palette: ${error.message}`);
    }
  }

  async analyzeImage(imageBase64, mediaType = 'image/png', userPrompt = '') {
    const contextGuidance = userPrompt 
      ? `The user wants to generate: "${userPrompt}"\n\nFocus your analysis ONLY on elements relevant to this request. Ignore unrelated parts of the image.`
      : 'Extract the overall visual style from this image.';

    const prompt = `${contextGuidance}

Analyze this image and extract:

1. **Color Palette**: Identify the 8-12 most prominent colors that are relevant to the user's request.

2. **Concise Style Description** (2-3 sentences max): 
   - Focus ONLY on visual qualities applicable to sprite creation
   - Mention: pixel art style (8-bit, 16-bit, etc.), shading technique, color approach, line work
   - DO NOT describe environments, scenes, or backgrounds unless that's what the user wants
   - Be specific and actionable for sprite generation

Examples:
- User wants "character": Describe character art style, NOT environment
- User wants "tiles": Describe tileset style, NOT characters
- User wants "UI elements": Describe UI style, NOT gameplay elements

Return ONLY valid JSON:
{
  "palette": [
    { "hex": "#RRGGBB", "rgb": {"r": 0, "g": 0, "b": 0}, "hsl": {"h": 0, "s": 0, "l": 0} }
  ],
  "style": "Concise actionable style description focusing on sprite art qualities"
}`;

    try {
      this.logRequest('ANALYZE_IMAGE', prompt);
      
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: imageBase64
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      });

      const content = response.content[0].text.trim();
      console.log('Image analysis response:', content.substring(0, 200) + '...');

      let result;
      let jsonStr = content;
      
      const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      } else {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }
      
      try {
        result = JSON.parse(jsonStr);
        console.log('Parsed image analysis result:', result);
      } catch (e) {
        console.error('Failed to parse analysis JSON:', content);
        throw new Error(`No valid JSON found in Claude response: ${e.message}`);
      }
      
      if (!result.palette || !Array.isArray(result.palette)) {
        console.error('Invalid palette in result:', result);
      }
      
      if (!result.style) {
        console.error('No style in result:', result);
      }

      return result;

    } catch (error) {
      console.error('Claude Vision API Error:', error);
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }

  async validatePrompt(userPrompt) {
    const prompt = `You are a sprite generation assistant. Analyze this user prompt for clarity, appropriateness, and extract the requested sprite count.

User Prompt: "${userPrompt}"

Evaluate:
1. Is this request clear enough to generate sprites?
2. Can spelling/grammar be auto-fixed?
3. Is this appropriate for sprite generation context?
4. How many sprites does the user want? (Extract from phrases like "4 sprites", "8 frames", etc. Ignore style numbers like "16-bit", "3-4 tones")

Return ONLY valid JSON with this structure:
{
  "valid": true/false,
  "fixedPrompt": "corrected version if fixable, or original if already good",
  "feedback": "explanation if invalid, or null if valid",
  "confidence": "high/medium/low",
  "requestedCount": <number or null>
}

Examples:
- "8 swrods" → {"valid": true, "fixedPrompt": "8 swords", "feedback": null, "confidence": "high", "requestedCount": 8}
- "4 sprite walking in 16-bit style" → {"valid": true, "fixedPrompt": "4 sprite walking animation in 16-bit style", "feedback": null, "confidence": "high", "requestedCount": 4}
- "make stuff" → {"valid": false, "fixedPrompt": null, "feedback": "Please specify what type of sprites you want", "confidence": "high", "requestedCount": null}
- "enemy character" → {"valid": true, "fixedPrompt": "enemy character sprite", "feedback": null, "confidence": "high", "requestedCount": null}`;

    try {
      this.logRequest('VALIDATE_PROMPT', prompt);
      
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      });

      const content = response.content[0].text.trim();
      console.log('Prompt validation response:', content);

      let result;
      let jsonStr = content;
      
      const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      } else {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }
      
      try {
        result = JSON.parse(jsonStr);
        console.log('Parsed validation result:', result);
      } catch (e) {
        console.error('Failed to parse validation JSON:', content);
        throw new Error(`No valid JSON found in Claude response: ${e.message}`);
      }

      return result;

    } catch (error) {
      console.error('Claude Validation API Error:', error);
      throw new Error(`Failed to validate prompt: ${error.message}`);
    }
  }
}

module.exports = ClaudeService;