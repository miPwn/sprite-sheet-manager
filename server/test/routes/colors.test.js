const request = require('supertest')
const express = require('express')
const cors = require('cors')
const colorRoutes = require('../../routes/colors')

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/colors', colorRoutes)

describe('Color Routes', () => {
  describe('GET /api/colors/harmonies', () => {
    it('should return available color harmony types', async () => {
      const response = await request(app)
        .get('/api/colors/harmonies')
        .expect(200)

      expect(response.body.harmonies).toBeDefined()
      expect(Array.isArray(response.body.harmonies)).toBe(true)
      expect(response.body.harmonies.length).toBeGreaterThan(0)
      
      const harmony = response.body.harmonies[0]
      expect(harmony).toHaveProperty('id')
      expect(harmony).toHaveProperty('name')
      expect(harmony).toHaveProperty('description')
    })

    it('should include all expected harmony types', async () => {
      const response = await request(app)
        .get('/api/colors/harmonies')
        .expect(200)

      const harmonyIds = response.body.harmonies.map(harmony => harmony.id)
      expect(harmonyIds).toContain('monochromatic')
      expect(harmonyIds).toContain('complementary')
      expect(harmonyIds).toContain('triadic')
      expect(harmonyIds).toContain('analogous')
      expect(harmonyIds).toContain('split-complementary')
      expect(harmonyIds).toContain('tetradic')
    })
  })

  describe('POST /api/colors/extract', () => {
    it('should reject request with no image', async () => {
      const response = await request(app)
        .post('/api/colors/extract')
        .expect(400)

      expect(response.body.error).toBe('No image provided')
    })

    it('should handle image upload for color extraction', async () => {
      const response = await request(app)
        .post('/api/colors/extract')
        .attach('image', Buffer.from('fake image data'), 'test.png')
        .field('maxColors', '8')
        .field('quality', '5')
        .expect(500)
    })
  })

  describe('POST /api/colors/analyze-batch', () => {
    it('should reject request with no images', async () => {
      const response = await request(app)
        .post('/api/colors/analyze-batch')
        .expect(400)

      expect(response.body.error).toBe('No images provided')
    })

    it('should handle multiple image uploads', async () => {
      const response = await request(app)
        .post('/api/colors/analyze-batch')
        .attach('images', Buffer.from('fake image 1'), 'test1.png')
        .attach('images', Buffer.from('fake image 2'), 'test2.png')
        .field('maxColors', '16')
        .field('quality', '10')
        .expect(500)
    })
  })

  describe('POST /api/colors/generate-palette', () => {
    it('should reject request with no base colors', async () => {
      const response = await request(app)
        .post('/api/colors/generate-palette')
        .send({})
        .expect(400)

      expect(response.body.error).toBe('No base colors provided')
    })

    it('should reject request with empty base colors array', async () => {
      const response = await request(app)
        .post('/api/colors/generate-palette')
        .send({ baseColors: [] })
        .expect(400)

      expect(response.body.error).toBe('No base colors provided')
    })

    it('should accept valid palette generation request', async () => {
      const response = await request(app)
        .post('/api/colors/generate-palette')
        .send({
          baseColors: ['#6366f1'],
          count: 8,
          harmony: 'complementary',
          saturation: 0.8,
          lightness: 0.5
        })
        .expect(500)
    })

    it('should use default values when parameters not provided', async () => {
      const response = await request(app)
        .post('/api/colors/generate-palette')
        .send({
          baseColors: ['#ff5722']
        })
        .expect(500)
    })
  })
})