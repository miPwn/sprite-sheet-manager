const fs = require('fs').promises

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  process.env.PORT = '5001'
  
  try {
    await fs.mkdir('uploads/temp', { recursive: true })
    await fs.mkdir('uploads/output', { recursive: true })
  } catch (error) {
    console.log('Test directories already exist')
  }
})

afterAll(async () => {
  try {
    await fs.rm('uploads/temp', { recursive: true, force: true })
    await fs.rm('uploads/output', { recursive: true, force: true })
  } catch (error) {
    console.log('Cleanup completed')
  }
})