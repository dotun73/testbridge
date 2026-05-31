import { Router } from 'express'
import { register, login, getMe } from '../controllers/authController'
import { protect } from '../middleware/authMiddleware'
import prisma from '../config/prisma'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', protect, getMe)

// Get all users for team members list
router.get('/users', protect, async (req: any, res: any) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' }
    })
    res.json({ users })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router