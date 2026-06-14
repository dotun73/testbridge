import { Router } from 'express'
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.use(protect)

router.get('/', getProjects)
router.get('/:id', getProject)
router.post('/', createProject)
router.put('/:id', updateProject)
router.delete('/:id', deleteProject)

export default router