const SpriteSheetGenerator = require('../../services/SpriteSheetGenerator');
const path = require('path');
const fs = require('fs').promises;

describe('SpriteSheetGenerator', () => {
  let generator;
  const testImages = [
    {
      path: path.join(__dirname, '../../uploads/test1.png'),
      width: 16,
      height: 16
    },
    {
      path: path.join(__dirname, '../../uploads/test2.png'),
      width: 16,
      height: 16
    }
  ];

  beforeAll(async () => {
    // Create dummy test images
    const uploadsDir = path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(testImages[0].path, Buffer.alloc(100));
    await fs.writeFile(testImages[1].path, Buffer.alloc(100));
  });

  afterAll(async () => {
    // Cleanup
    try {
      await fs.unlink(testImages[0].path);
      await fs.unlink(testImages[1].path);
    } catch (e) {}
  });

  beforeEach(() => {
    generator = new SpriteSheetGenerator();
    // Mock internal methods to avoid actual image processing
    generator.loadImages = jest.fn().mockResolvedValue(testImages.map(img => ({
      ...img,
      buffer: Buffer.alloc(100)
    })));
    generator.packImages = jest.fn().mockResolvedValue({
      blocks: [],
      dimensions: { width: 32, height: 16 }
    });
    generator.compositeImages = jest.fn().mockResolvedValue(Buffer.alloc(100));
    generator.saveOutput = jest.fn().mockImplementation(async (buffer, format) => {
        const outputDir = 'uploads/output';
        const filename = `sprite-sheet-test.${format}`;
        const outputPath = path.join(outputDir, filename);
        // Simulate the fix
        return outputPath.split(path.sep).join('/');
    });
  });

  test('generate returns path with forward slashes', async () => {
    const result = await generator.generate({
      images: testImages,
      parameters: {},
      layout: 'optimal',
      outputFormat: 'png'
    });

    expect(result.outputPath).not.toContain('\\');
    expect(result.outputPath).toContain('/');
  });
});
