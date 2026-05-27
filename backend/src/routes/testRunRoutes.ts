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

const router = Router()

router.use(protect)

router.get('/', getTestRuns)
router.get('/:id', getTestRun)
router.post('/', createTestRun)
router.put('/:id', updateTestRun)
router.delete('/:id', deleteTestRun)
router.post('/:id/results', addTestResult)

export default router