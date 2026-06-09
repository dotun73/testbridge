import { Router } from 'express'
import {
  getTestCases,
  getTestCase,
  createTestCase,
  updateTestCase,
  deleteTestCase,
} from '../controllers/testCaseController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.use(protect)

router.get('/', getTestCases)
router.get('/:id', getTestCase)
router.post('/', createTestCase)
router.put('/:id', updateTestCase)
router.delete('/:id', deleteTestCase)

export default router