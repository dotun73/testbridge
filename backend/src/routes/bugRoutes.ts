import { Router } from 'express'
import { getBugs, getBug, createBug, updateBug, deleteBug } from '../controllers/bugController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.use(protect) // All bug routes require authentication

router.get('/', getBugs)
router.get('/:id', getBug)
router.post('/', createBug)
router.put('/:id', updateBug)
router.delete('/:id', deleteBug)

export default router