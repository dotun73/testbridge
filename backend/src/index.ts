import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes'
import bugRoutes from './routes/bugRoutes'
import testRunRoutes from './routes/testRunRoutes'
import testCaseRoutes from './routes/testCaseRoutes'
import prisma from './config/prisma'
import projectRoutes from './routes/projectRoutes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/bugs', bugRoutes)
app.use('/api/test-runs', testRunRoutes)
app.use('/api/test-cases', testCaseRoutes)
app.use('/api/projects', projectRoutes)

// Dashboard stats
app.get('/api/dashboard/stats', async (req: any, res: any) => {
  try {
    const [openBugs, criticalBugs, activeTestRuns, allTestResults] = await Promise.all([
      prisma.bug.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'RETEST'] } } }),
      prisma.bug.count({ where: { severity: 'CRITICAL', status: { not: 'CLOSED' } } }),
      prisma.testRun.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.testResult.findMany(),
    ])

    const totalResults = allTestResults.length
    const passedResults = allTestResults.filter(r => r.status === 'PASS').length
    const passRate = totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0

    const recentBugs = await prisma.bug.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { reporter: { select: { name: true } } }
    })

    const activeRuns = await prisma.testRun.findMany({
      where: { status: 'IN_PROGRESS' },
      include: {
        testResults: true,
        project: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ openBugs, criticalBugs, activeTestRuns, passRate, recentBugs, activeRuns })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.get('/', (req, res) => {
  res.json({ message: 'TestBridge API is running 🚀' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})