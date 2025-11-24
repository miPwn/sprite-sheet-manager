const request = require('supertest')
const express = require('express')
const cors = require('cors')
const spriteRoutes = require('../../routes/sprites')

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/sprites', spriteRoutes)

describe('Sprite Routes', () => {
  describe('GET /api/sprites/layouts', () => {
    it('should return available layout options', async () => {
      const response = await request(app)
        .get('/api/sprites/layouts')
        .expect(200)

      expect(response.body.layouts).toBeDefined()
      expect(Array.isArray(response.body.layouts)).toBe(true)
      expect(response.body.layouts.length).toBeGreaterThan(0)
      
      const layout = response.body.layouts[0]
      expect(layout).toHaveProperty('id')
      expect(layout).toHaveProperty('name')
      expect(layout).toHaveProperty('description')
    })

    it('should include all expected layout types', async () => {
      const response = await request(app)
        .get('/api/sprites/layouts')
        .expect(200)

      const layoutIds = response.body.layouts.map(layout => layout.id)
      expect(layoutIds).toContain('optimal')
      expect(layoutIds).toContain('grid')
      expect(layoutIds).toContain('horizontal')
      expect(layoutIds).toContain('vertical')
    })
  })

  describe('GET /api/sprites/formats', () => {
    it('should return supported output formats', async () => {
      const response = await request(app)
        .get('/api/sprites/formats')
        .expect(200)

      expect(response.body.formats).toBeDefined()
      expect(Array.isArray(response.body.formats)).toBe(true)
      
      const formatIds = response.body.formats.map(format => format.id)
      expect(formatIds).toContain('png')
      expect(formatIds).toContain('jpeg')
      expect(formatIds).toContain('webp')
    })
  })

  describe('POST /api/sprites/upload', () => {
    it('should reject request with no files', async () => {
      const response = await request(app)
        .post('/api/sprites/upload')
        .expect(400)

      expect(response.body.error).toBe('No images uploaded')
    })

    it('should handle file upload with proper validation', async () => {
      const response = await request(app)
        .post('/api/sprites/upload')
        .attach('images', Buffer.from('fake image data'), 'test.png')
        .expect(500)
    })
  })

  describe('POST /api/sprites/generate', () => {
    it('should reject generation with no images', async () => {
      const response = await request(app)
        .post('/api/sprites/generate')
        .send({})
        .expect(400)

      expect(response.body.error).toBe('No images provided for generation')
    })

    it('should reject generation with invalid images array', async () => {
      const response = await request(app)
        .post('/api/sprites/generate')
        .send({ images: 'invalid' })
        .expect(400)

      expect(response.body.error).toBe('No images provided for generation')
    })

    it('should accept valid generation request format', async () => {
      const response = await request(app)
        .post('/api/sprites/generate')
        .send({
          images: [
            { id: 'test1', path: 'test.png', width: 100, height: 100 }
          ],
          parameters: { padding: 2 },
          layout: 'optimal',
          outputFormat: 'png'
        })
        .expect(500)
    })
  })

  describe('DELETE /api/sprites/cleanup/:sessionId', () => {
    it('should handle cleanup request', async () => {
      const response = await request(app)
        .delete('/api/sprites/cleanup/test-session')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Cleanup completed')
    })
  })
})