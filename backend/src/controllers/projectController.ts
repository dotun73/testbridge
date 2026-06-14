import { Request, Response } from 'express'
import prisma from '../config/prisma'

// GET all projects for the current user
export const getProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        _count: {
          select: {
            testCases: true,
            testRuns: true,
            bugs: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ projects })
  } catch (error) {
    console.error('Get projects error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// GET single project
export const getProject = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        _count: {
          select: {
            testCases: true,
            testRuns: true,
            bugs: true,
          }
        }
      }
    })

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    res.json({ project })
  } catch (error) {
    console.error('Get project error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// CREATE project
export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, githubRepo } = req.body
    const userId = (req as any).userId

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' })
    }

    // Create project and add creator as a member
    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        githubRepo: githubRepo || null,
        members: {
          create: {
            userId,
          }
        }
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        _count: {
          select: {
            testCases: true,
            testRuns: true,
            bugs: true,
          }
        }
      }
    })

    res.status(201).json({ message: 'Project created successfully', project })
  } catch (error) {
    console.error('Create project error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// UPDATE project
export const updateProject = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { name, description, githubRepo } = req.body

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(githubRepo !== undefined && { githubRepo }),
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        _count: {
          select: {
            testCases: true,
            testRuns: true,
            bugs: true,
          }
        }
      }
    })

    res.json({ message: 'Project updated successfully', project })
  } catch (error) {
    console.error('Update project error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// DELETE project
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    await prisma.project.delete({ where: { id } })
    res.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Delete project error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}