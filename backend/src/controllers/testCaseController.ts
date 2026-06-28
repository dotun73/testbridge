import { Request, Response } from 'express'
import prisma from '../config/prisma'

// GET all test cases (filtered by project and other criteria)
export const getTestCases = async (req: Request, res: Response) => {
  try {
    const { projectId, status, priority, search } = req.query

    const testCases = await prisma.testCase.findMany({
      where: {
        ...(projectId && { projectId: projectId as string }),
        ...(status && { status: status as any }),
        ...(priority && { priority: priority as any }),
        ...(search && {
          title: { contains: search as string, mode: 'insensitive' }
        }),
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ testCases })
  } catch (error) {
    console.error('Get test cases error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// GET single test case
export const getTestCase = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    const testCase = await prisma.testCase.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
      }
    })

    if (!testCase) {
      return res.status(404).json({ message: 'Test case not found' })
    }

    res.json({ testCase })
  } catch (error) {
    console.error('Get test case error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// CREATE test case
export const createTestCase = async (req: Request, res: Response) => {
  try {
    const { title, description, steps, expectedResult, priority, status, projectId } = req.body
    const userId = (req as any).userId

    if (!title || !steps || !expectedResult || !projectId) {
      return res.status(400).json({ message: 'Title, steps, expected result and project are required' })
    }

    const testCase = await prisma.testCase.create({
      data: {
        title,
        description: description || null,
        steps,
        expectedResult,
        priority: priority || 'MEDIUM',
        status: status || 'DRAFT',
        projectId,
      },
      include: {
        project: { select: { id: true, name: true } },
      }
    })

    // Create notification for new test case
    await prisma.notification.create({
      data: {
        userId,
        type: 'TEST_RUN_COMPLETED',
        message: `New test case created: "${title}"`,
      }
    })

    res.status(201).json({ message: 'Test case created successfully', testCase })
  } catch (error) {
    console.error('Create test case error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// UPDATE test case
export const updateTestCase = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { title, description, steps, expectedResult, priority, status } = req.body

    const testCase = await prisma.testCase.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(steps && { steps }),
        ...(expectedResult && { expectedResult }),
        ...(priority && { priority }),
        ...(status && { status }),
      },
      include: {
        project: { select: { id: true, name: true } },
      }
    })

    res.json({ message: 'Test case updated successfully', testCase })
  } catch (error) {
    console.error('Update test case error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// DELETE test case
export const deleteTestCase = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    await prisma.testCase.delete({ where: { id } })
    res.json({ message: 'Test case deleted successfully' })
  } catch (error) {
    console.error('Delete test case error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}