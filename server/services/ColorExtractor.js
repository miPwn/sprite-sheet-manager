const sharp = require('sharp');
const Jimp = require('jimp');

class ColorExtractor {
  constructor() {
    this.defaultOptions = {
      maxColors: 16,
      quality: 10
    };
  }

  async extractPalette(imageBuffer, options = {}) {
    const { maxColors, quality } = { ...this.defaultOptions, ...options };

    try {
      const image = await Jimp.read(imageBuffer);
      const colorCounts = this.analyzeColors(image, quality);
      const sortedColors = this.sortColorsByFrequency(colorCounts);
      const reducedPalette = this.reducePalette(sortedColors, maxColors);
      
      return {
        colors: reducedPalette.map(color => ({
          hex: this.rgbToHex(color.r, color.g, color.b),
          rgb: { r: color.r, g: color.g, b: color.b },
          hsl: this.rgbToHsl(color.r, color.g, color.b),
          frequency: color.frequency
        })),
        dominant: this.rgbToHex(reducedPalette[0].r, reducedPalette[0].g, reducedPalette[0].b)
      };
    } catch (error) {
      throw new Error(`Color extraction failed: ${error.message}`);
    }
  }

  analyzeColors(image, quality) {
    const colorCounts = new Map();
    const width = image.getWidth();
    const height = image.getHeight();

    for (let y = 0; y < height; y += quality) {
      for (let x = 0; x < width; x += quality) {
        const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
        
        if (pixel.a < 125) continue;

        const key = `${pixel.r},${pixel.g},${pixel.b}`;
        colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
      }
    }

    return colorCounts;
  }

  sortColorsByFrequency(colorCounts) {
    return Array.from(colorCounts.entries())
      .map(([key, count]) => {
        const [r, g, b] = key.split(',').map(Number);
        return { r, g, b, frequency: count };
      })
      .sort((a, b) => b.frequency - a.frequency);
  }

  reducePalette(colors, maxColors) {
    if (colors.length <= maxColors) return colors;

    const reduced = [];
    const threshold = 30;

    for (const color of colors) {
      const similar = reduced.find(existing => 
        this.colorDistance(color, existing) < threshold
      );

      if (!similar) {
        reduced.push(color);
        if (reduced.length >= maxColors) break;
      }
    }

    return reduced;
  }

  colorDistance(color1, color2) {
    const rDiff = color1.r - color2.r;
    const gDiff = color1.g - color2.g;
    const bDiff = color1.b - color2.b;
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
  }

  combinePalettes(palettes, maxColors = 16) {
    const allColors = palettes.flat();
    const colorMap = new Map();

    allColors.forEach(color => {
      const key = color.hex;
      const existing = colorMap.get(key);
      if (existing) {
        existing.frequency += color.frequency;
      } else {
        colorMap.set(key, { ...color });
      }
    });

    return Array.from(colorMap.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, maxColors);
  }

  generateHarmonyPalette({ baseColors, count = 16, harmony = 'complementary', saturation = 0.8, lightness = 0.5 }) {
    const baseColor = typeof baseColors[0] === 'string' 
      ? this.hexToHsl(baseColors[0])
      : baseColors[0];

    const harmonies = {
      monochromatic: this.generateMonochromatic,
      complementary: this.generateComplementary,
      triadic: this.generateTriadic,
      analogous: this.generateAnalogous,
      'split-complementary': this.generateSplitComplementary,
      tetradic: this.generateTetradic
    };

    const harmonyFn = harmonies[harmony];
    if (!harmonyFn) {
      throw new Error(`Unknown harmony type: ${harmony}`);
    }

    return harmonyFn.call(this, baseColor, count, saturation, lightness);
  }

  generateMonochromatic(baseColor, count, saturation, lightness) {
    const colors = [];
    const { h } = baseColor;

    for (let i = 0; i < count; i++) {
      const l = Math.max(0.1, Math.min(0.9, lightness + (i - count / 2) * 0.1));
      const s = Math.max(0.2, Math.min(1, saturation + (Math.random() - 0.5) * 0.2));
      
      colors.push({
        hex: this.hslToHex(h, s, l),
        hsl: { h, s, l },
        rgb: this.hslToRgb(h, s, l)
      });
    }

    return colors;
  }

  generateComplementary(baseColor, count, saturation, lightness) {
    const colors = [];
    const { h } = baseColor;
    const complementH = (h + 180) % 360;

    for (let i = 0; i < count; i++) {
      const hue = i % 2 === 0 ? h : complementH;
      const l = Math.max(0.1, Math.min(0.9, lightness + (Math.random() - 0.5) * 0.4));
      const s = Math.max(0.3, Math.min(1, saturation + (Math.random() - 0.5) * 0.3));

      colors.push({
        hex: this.hslToHex(hue, s, l),
        hsl: { h: hue, s, l },
        rgb: this.hslToRgb(hue, s, l)
      });
    }

    return colors;
  }

  generateTriadic(baseColor, count, saturation, lightness) {
    const colors = [];
    const { h } = baseColor;
    const hues = [h, (h + 120) % 360, (h + 240) % 360];

    for (let i = 0; i < count; i++) {
      const hue = hues[i % 3];
      const l = Math.max(0.1, Math.min(0.9, lightness + (Math.random() - 0.5) * 0.4));
      const s = Math.max(0.3, Math.min(1, saturation + (Math.random() - 0.5) * 0.3));

      colors.push({
        hex: this.hslToHex(hue, s, l),
        hsl: { h: hue, s, l },
        rgb: this.hslToRgb(hue, s, l)
      });
    }

    return colors;
  }

  generateAnalogous(baseColor, count, saturation, lightness) {
    const colors = [];
    const { h } = baseColor;

    for (let i = 0; i < count; i++) {
      const hue = (h + (i - count / 2) * 15) % 360;
      const l = Math.max(0.1, Math.min(0.9, lightness + (Math.random() - 0.5) * 0.3));
      const s = Math.max(0.3, Math.min(1, saturation + (Math.random() - 0.5) * 0.2));

      colors.push({
        hex: this.hslToHex(hue, s, l),
        hsl: { h: hue, s, l },
        rgb: this.hslToRgb(hue, s, l)
      });
    }

    return colors;
  }

  generateSplitComplementary(baseColor, count, saturation, lightness) {
    const colors = [];
    const { h } = baseColor;
    const hues = [h, (h + 150) % 360, (h + 210) % 360];

    for (let i = 0; i < count; i++) {
      const hue = hues[i % 3];
      const l = Math.max(0.1, Math.min(0.9, lightness + (Math.random() - 0.5) * 0.4));
      const s = Math.max(0.3, Math.min(1, saturation + (Math.random() - 0.5) * 0.3));

      colors.push({
        hex: this.hslToHex(hue, s, l),
        hsl: { h: hue, s, l },
        rgb: this.hslToRgb(hue, s, l)
      });
    }

    return colors;
  }

  generateTetradic(baseColor, count, saturation, lightness) {
    const colors = [];
    const { h } = baseColor;
    const hues = [h, (h + 90) % 360, (h + 180) % 360, (h + 270) % 360];

    for (let i = 0; i < count; i++) {
      const hue = hues[i % 4];
      const l = Math.max(0.1, Math.min(0.9, lightness + (Math.random() - 0.5) * 0.4));
      const s = Math.max(0.3, Math.min(1, saturation + (Math.random() - 0.5) * 0.3));

      colors.push({
        hex: this.hslToHex(hue, s, l),
        hsl: { h: hue, s, l },
        rgb: this.hslToRgb(hue, s, l)
      });
    }

    return colors;
  }

  rgbToHex(r, g, b) {
    return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

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

    return { h: h * 360, s, l };
  }

  hslToRgb(h, s, l) {
    h /= 360;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    if (s === 0) {
      return { r: l * 255, g: l * 255, b: l * 255 };
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      return {
        r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
        g: Math.round(hue2rgb(p, q, h) * 255),
        b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
      };
    }
  }

  hslToHex(h, s, l) {
    const rgb = this.hslToRgb(h, s, l);
    return this.rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  hexToHsl(hex) {
    const rgb = this.hexToRgb(hex);
    return this.rgbToHsl(rgb.r, rgb.g, rgb.b);
  }
}

module.exports = ColorExtractor;