const sharp = require('sharp');

class PixelMapRenderer {
  constructor() {
    this.defaultOptions = {
      format: 'png',
      quality: 100
    };
  }

  async renderPixelMap(pixelMap, options = {}) {
    const opts = { ...this.defaultOptions, ...options };
    
    if (!pixelMap || !Array.isArray(pixelMap) || pixelMap.length === 0) {
      throw new Error('Invalid pixel map provided');
    }

    let width, height;
    let flatPixelMap;

    if (Array.isArray(pixelMap[0])) {
      height = pixelMap.length;
      width = pixelMap[0].length;

      if (width === 0) {
        throw new Error('Pixel map rows cannot be empty');
      }

      for (let row of pixelMap) {
        if (!Array.isArray(row) || row.length !== width) {
          throw new Error('All pixel map rows must have the same length');
        }
      }

      flatPixelMap = pixelMap.flat();
    } else {
      if (options.width && options.height) {
        width = options.width;
        height = options.height;
      } else {
        const size = Math.sqrt(pixelMap.length);
        if (!Number.isInteger(size)) {
          throw new Error('Flat pixel map must be square or provide width/height options');
        }
        width = height = size;
      }

      if (pixelMap.length !== width * height) {
        throw new Error(`Flat pixel map length (${pixelMap.length}) doesn't match width*height (${width}*${height}=${width * height})`);
      }

      flatPixelMap = pixelMap;
    }

    const buffer = Buffer.alloc(width * height * 4);

    for (let i = 0; i < flatPixelMap.length; i++) {
      const color = flatPixelMap[i];
      const rgba = this.hexToRgba(color);
      const bufferIndex = i * 4;
      
      buffer[bufferIndex] = rgba.r;
      buffer[bufferIndex + 1] = rgba.g;
      buffer[bufferIndex + 2] = rgba.b;
      buffer[bufferIndex + 3] = rgba.a;
    }

    let image = sharp(buffer, {
      raw: {
        width,
        height,
        channels: 4
      }
    });

    if (opts.format === 'png') {
      image = image.png({ quality: opts.quality });
    } else if (opts.format === 'jpeg') {
      image = image.jpeg({ quality: opts.quality });
    } else if (opts.format === 'webp') {
      image = image.webp({ quality: opts.quality });
    }

    return await image.toBuffer();
  }

  async renderMultiplePixelMaps(pixelMaps, options = {}) {
    return Promise.all(
      pixelMaps.map(pixelMap => this.renderPixelMap(pixelMap, options))
    );
  }

  hexToRgba(hex) {
    if (!hex || typeof hex !== 'string') {
      return { r: 0, g: 0, b: 0, a: 255 };
    }

    let cleanHex = hex.replace('#', '');
    
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(char => char + char).join('');
    }
    
    if (cleanHex.length !== 6 && cleanHex.length !== 8) {
      return { r: 0, g: 0, b: 0, a: 255 };
    }

    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const a = cleanHex.length === 8 ? parseInt(cleanHex.substring(6, 8), 16) : 255;

    return {
      r: isNaN(r) ? 0 : r,
      g: isNaN(g) ? 0 : g,
      b: isNaN(b) ? 0 : b,
      a: isNaN(a) ? 255 : a
    };
  }

  createTestPixelMap(width = 16, height = 16, colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00']) {
    const pixelMap = [];
    
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const colorIndex = (x + y) % colors.length;
        row.push(colors[colorIndex]);
      }
      pixelMap.push(row);
    }
    
    return pixelMap;
  }

  createSolidColorPixelMap(width, height, color) {
    return Array.from({ length: height }, () => 
      Array.from({ length: width }, () => color)
    );
  }

  validatePixelMap(pixelMap) {
    if (!pixelMap || !Array.isArray(pixelMap)) {
      return { valid: false, error: 'Pixel map must be an array' };
    }

    if (pixelMap.length === 0) {
      return { valid: false, error: 'Pixel map cannot be empty' };
    }

    const width = pixelMap[0]?.length;
    if (!width) {
      return { valid: false, error: 'Pixel map rows cannot be empty' };
    }

    for (let i = 0; i < pixelMap.length; i++) {
      const row = pixelMap[i];
      if (!Array.isArray(row)) {
        return { valid: false, error: `Row ${i} must be an array` };
      }
      if (row.length !== width) {
        return { valid: false, error: `Row ${i} has inconsistent width` };
      }
      
      for (let j = 0; j < row.length; j++) {
        const pixel = row[j];
        if (typeof pixel !== 'string' || !pixel.match(/^#?[0-9A-Fa-f]{3,8}$/)) {
          return { valid: false, error: `Invalid color at row ${i}, column ${j}: ${pixel}` };
        }
      }
    }

    return { 
      valid: true, 
      width, 
      height: pixelMap.length,
      totalPixels: width * pixelMap.length
    };
  }
}

module.exports = PixelMapRenderer;