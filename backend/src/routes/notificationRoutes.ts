import { Router } from 'express'
import { protect } from '../middleware/authMiddleware'
import prisma from '../config/prisma'

const router = Router()

// GET all notifications for logged in user
router.get('/', protect, async (req: any, res: any) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    res.json({ notifications })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
})

// MARK all notifications as read
router.put('/read-all', protect, async (req: any, res: any) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, read: false },
      data: { read: true },
    })
    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
})

// MARK single notification as read
router.put('/:id/read', protect, async (req: any, res: any) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    })
    res.json({ message: 'Notification marked as read' })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router