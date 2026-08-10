import { Router } from 'express'
import {
  getTestRuns,
  getTestRun,
  createTestRun,
  updateTestRun,
  deleteTestRun,
  addTestResult,
} from '../controllers/testRunController'
import { protect } from '../middleware/authMiddleware'
import prisma from '../config/prisma'

const router = Router()

router.use(protect)

router.get('/', getTestRuns)
router.get('/:id', getTestRun)
router.post('/', createTestRun)
router.put('/:id', updateTestRun)
router.delete('/:id', deleteTestRun)
router.post('/:id/results', addTestResult)

// Update a test result status
router.put('/:id/results/:resultId', async (req: any, res: any) => {
  try {
    const { resultId } = req.params
    const { status, notes } = req.body

    const result = await prisma.testResult.update({
      where: { id: resultId },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
      include: { testCase: true }
    })

    res.json({ message: 'Test result updated', result })
  } catch (error) {
    console.error('Update test result error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router