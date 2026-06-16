import { Request, Response } from 'express'
import prisma from '../config/prisma'

// GET all bugs (filtered by project and other criteria)
export const getBugs = async (req: Request, res: Response) => {
  try {
    const { projectId, status, severity, priority, search } = req.query

    const bugs = await prisma.bug.findMany({
      where: {
        ...(projectId && { projectId: projectId as string }),
        ...(status && { status: status as any }),
        ...(severity && { severity: severity as any }),
        ...(priority && { priority: priority as any }),
        ...(search && {
          title: { contains: search as string, mode: 'insensitive' }
        }),
      },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ bugs })
  } catch (error) {
    console.error('Get bugs error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// GET single bug
export const getBug = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const bugId = id as string

    const bug = await prisma.bug.findUnique({
      where: { id: bugId },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      }
    })

    if (!bug) {
      return res.status(404).json({ message: 'Bug not found' })
    }

    res.json({ bug })
  } catch (error) {
    console.error('Get bug error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// CREATE bug
export const createBug = async (req: Request, res: Response) => {
  try {
    const { title, description, severity, priority, status, environment, projectId, assignedTo } = req.body
    const reportedBy = (req as any).userId

    if (!title || !projectId) {
      return res.status(400).json({ message: 'Title and project are required' })
    }

    const bug = await prisma.bug.create({
      data: {
        title,
        description,
        severity: severity || 'MEDIUM',
        priority: priority || 'MEDIUM',
        status: status || 'OPEN',
        environment,
        projectId,
        reportedBy,
        assignedTo: assignedTo || null,
      },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      }
    })

    res.status(201).json({ message: 'Bug created successfully', bug })
  } catch (error) {
    console.error('Create bug error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// UPDATE bug
export const updateBug = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const bugId = id as string
    const { title, description, severity, priority, status, environment, assignedTo } = req.body

    const bug = await prisma.bug.update({
      where: { id: bugId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(severity && { severity }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(environment !== undefined && { environment }),
        ...(assignedTo !== undefined && { assignedTo }),
      },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      }
    })

    res.json({ message: 'Bug updated successfully', bug })
  } catch (error) {
    console.error('Update bug error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// DELETE bug
export const deleteBug = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const bugId = id as string

    await prisma.bug.delete({ where: { id: bugId } })

    res.json({ message: 'Bug deleted successfully' })
  } catch (error) {
    console.error('Delete bug error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}