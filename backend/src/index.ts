import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes'
import bugRoutes from './routes/bugRoutes'
import testRunRoutes from './routes/testRunRoutes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/bugs', bugRoutes)
app.use('/api/test-runs', testRunRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'TestBridge API is running 🚀' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})