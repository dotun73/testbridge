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
        avatar: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' }
    })
    res.json({ users })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Update profile
router.put('/profile', protect, async (req: any, res: any) => {
  try {
    const { name, avatar } = req.body
    const userId = req.userId

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
      }
    })

    res.json({ message: 'Profile updated successfully', user: updatedUser })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router