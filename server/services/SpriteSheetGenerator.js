const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class SpriteSheetGenerator {
  constructor() {
    this.packingAlgorithms = {
      optimal: this.optimalPacking.bind(this),
      grid: this.gridPacking.bind(this),
      horizontal: this.horizontalPacking.bind(this),
      vertical: this.verticalPacking.bind(this)
    };
  }

  async generate({ images, parameters = {}, layout = 'optimal', outputFormat = 'png', palette = null }) {
    try {
      const {
        padding = 2,
        powerOfTwo = false,
        maxWidth = 2048,
        maxHeight = 2048,
        backgroundColor = 'transparent'
      } = parameters;

      const imageBuffers = await this.loadImages(images);
      const packingResult = await this.packImages(imageBuffers, layout, {
        padding,
        powerOfTwo,
        maxWidth,
        maxHeight
      });

      const spriteSheetBuffer = await this.compositeImages(packingResult, {
        backgroundColor,
        outputFormat,
        palette
      });

      const outputPath = await this.saveOutput(spriteSheetBuffer, outputFormat);
      const metadata = this.generateMetadata(packingResult, {
        outputFormat,
        totalImages: images.length,
        dimensions: packingResult.dimensions,
        parameters
      });

      return {
        spriteSheet: spriteSheetBuffer,
        metadata,
        outputPath
      };
    } catch (error) {
      throw new Error(`Sprite sheet generation failed: ${error.message}`);
    }
  }

  async generateFromSprites({ sprites, parameters = {}, layout = 'optimal', outputFormat = 'png' }) {
    try {
      const {
        padding = 2,
        powerOfTwo = false,
        maxWidth = 2048,
        maxHeight = 2048,
        backgroundColor = 'transparent'
      } = parameters;

      const imageBuffers = await this.loadGeneratedSprites(sprites);
      const packingResult = await this.packImages(imageBuffers, layout, {
        padding,
        powerOfTwo,
        maxWidth,
        maxHeight
      });

      const spriteSheetBuffer = await this.compositeImages(packingResult, {
        backgroundColor,
        outputFormat
      });

      const outputPath = await this.saveOutput(spriteSheetBuffer, outputFormat);
      const metadata = this.generateMetadata(packingResult, {
        outputFormat,
        totalImages: sprites.length,
        dimensions: packingResult.dimensions,
        parameters
      });

      return {
        spriteSheet: spriteSheetBuffer,
        metadata,
        outputPath
      };
    } catch (error) {
      throw new Error(`Sprite sheet generation from sprites failed: ${error.message}`);
    }
  }

  async loadImages(imageData) {
    return Promise.all(
      imageData.map(async (img) => {
        const buffer = await fs.readFile(img.path);
        const metadata = await sharp(buffer).metadata();
        return {
          ...img,
          buffer,
          width: metadata.width,
          height: metadata.height
        };
      })
    );
  }

  async loadGeneratedSprites(sprites) {
    return Promise.all(
      sprites.map(async (sprite) => {
        const imagePath = path.join('uploads', 'generated', path.basename(sprite.imageUrl));
        const buffer = await fs.readFile(imagePath);
        return {
          id: sprite.id,
          filename: sprite.name,
          buffer,
          width: sprite.width,
          height: sprite.height
        };
      })
    );
  }

  async packImages(images, layout, options) {
    const packingFn = this.packingAlgorithms[layout];
    if (!packingFn) {
      throw new Error(`Unknown layout algorithm: ${layout}`);
    }

    return packingFn(images, options);
  }

  async optimalPacking(images, options) {
    const { padding, powerOfTwo, maxWidth, maxHeight } = options;
    const sortedImages = images.sort((a, b) => (b.width * b.height) - (a.width * a.height));
    
    const blocks = [];
    let currentY = 0;
    let currentRowHeight = 0;
    let currentX = 0;
    let sheetWidth = 0;
    let sheetHeight = 0;

    for (const image of sortedImages) {
      const imageWidth = image.width + padding * 2;
      const imageHeight = image.height + padding * 2;

      if (currentX + imageWidth > maxWidth) {
        currentX = 0;
        currentY += currentRowHeight;
        currentRowHeight = 0;
      }

      if (currentY + imageHeight > maxHeight) {
        throw new Error('Images exceed maximum sprite sheet dimensions');
      }

      blocks.push({
        ...image,
        x: currentX + padding,
        y: currentY + padding,
        width: image.width,
        height: image.height
      });

      currentX += imageWidth;
      currentRowHeight = Math.max(currentRowHeight, imageHeight);
      sheetWidth = Math.max(sheetWidth, currentX);
      sheetHeight = Math.max(sheetHeight, currentY + currentRowHeight);
    }

    if (powerOfTwo) {
      sheetWidth = this.nextPowerOfTwo(sheetWidth);
      sheetHeight = this.nextPowerOfTwo(sheetHeight);
    }

    return {
      blocks,
      dimensions: { width: sheetWidth, height: sheetHeight }
    };
  }

  async gridPacking(images, options) {
    const { padding, powerOfTwo, maxWidth, maxHeight } = options;
    const cols = Math.ceil(Math.sqrt(images.length));
    const rows = Math.ceil(images.length / cols);

    const maxImageWidth = Math.max(...images.map(img => img.width));
    const maxImageHeight = Math.max(...images.map(img => img.height));

    const cellWidth = maxImageWidth + padding * 2;
    const cellHeight = maxImageHeight + padding * 2;

    let sheetWidth = cols * cellWidth;
    let sheetHeight = rows * cellHeight;

    if (sheetWidth > maxWidth || sheetHeight > maxHeight) {
      throw new Error('Grid layout exceeds maximum dimensions');
    }

    if (powerOfTwo) {
      sheetWidth = this.nextPowerOfTwo(sheetWidth);
      sheetHeight = this.nextPowerOfTwo(sheetHeight);
    }

    const blocks = images.map((image, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      return {
        ...image,
        x: col * cellWidth + padding,
        y: row * cellHeight + padding,
        width: image.width,
        height: image.height
      };
    });

    return {
      blocks,
      dimensions: { width: sheetWidth, height: sheetHeight }
    };
  }

  async horizontalPacking(images, options) {
    const { padding } = options;
    let currentX = 0;
    const maxHeight = Math.max(...images.map(img => img.height));

    const blocks = images.map(image => {
      const block = {
        ...image,
        x: currentX + padding,
        y: padding,
        width: image.width,
        height: image.height
      };
      currentX += image.width + padding * 2;
      return block;
    });

    return {
      blocks,
      dimensions: { width: currentX, height: maxHeight + padding * 2 }
    };
  }

  async verticalPacking(images, options) {
    const { padding } = options;
    let currentY = 0;
    const maxWidth = Math.max(...images.map(img => img.width));

    const blocks = images.map(image => {
      const block = {
        ...image,
        x: padding,
        y: currentY + padding,
        width: image.width,
        height: image.height
      };
      currentY += image.height + padding * 2;
      return block;
    });

    return {
      blocks,
      dimensions: { width: maxWidth + padding * 2, height: currentY }
    };
  }

  async compositeImages(packingResult, options) {
    const { backgroundColor, outputFormat, palette } = options;
    const { blocks, dimensions } = packingResult;

    let composite = sharp({
      create: {
        width: dimensions.width,
        height: dimensions.height,
        channels: outputFormat === 'jpeg' ? 3 : 4,
        background: backgroundColor === 'transparent' ? { r: 0, g: 0, b: 0, alpha: 0 } : backgroundColor
      }
    });

    const overlays = blocks.map(block => ({
      input: block.buffer,
      left: block.x,
      top: block.y
    }));

    composite = composite.composite(overlays);

    if (palette && palette.length > 0) {
      composite = composite.png({ palette: true, colors: Math.min(palette.length, 256) });
    }

    if (outputFormat === 'jpeg') {
      return composite.jpeg({ quality: 90 }).toBuffer();
    } else if (outputFormat === 'webp') {
      return composite.webp({ quality: 90 }).toBuffer();
    } else {
      return composite.png().toBuffer();
    }
  }

  async saveOutput(buffer, format) {
    const outputDir = path.join('uploads', 'output');
    await fs.mkdir(outputDir, { recursive: true });
    
    const filename = `sprite-sheet-${uuidv4()}.${format}`;
    const outputPath = path.join(outputDir, filename);
    
    await fs.writeFile(outputPath, buffer);
    return outputPath.split(path.sep).join('/');
  }

  generateMetadata(packingResult, options) {
    const { blocks, dimensions } = packingResult;
    const { outputFormat, totalImages, parameters } = options;

    return {
      format: outputFormat,
      dimensions,
      totalImages,
      sprites: blocks.map(block => ({
        id: block.id,
        filename: block.filename,
        x: block.x,
        y: block.y,
        width: block.width,
        height: block.height
      })),
      parameters,
      generated: new Date().toISOString()
    };
  }

  nextPowerOfTwo(n) {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  }
}

module.exports = SpriteSheetGenerator;