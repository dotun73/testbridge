import { Request, Response } from 'express'
import prisma from '../config/prisma'

// GET all test runs
export const getTestRuns = async (req: Request, res: Response) => {
  try {
    const { status } = req.query

    const testRuns = await prisma.testRun.findMany({
      where: {
        ...(status && { status: status as any }),
      },
      include: {
        executor: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        testResults: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ testRuns })
  } catch (error) {
    console.error('Get test runs error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// GET single test run
export const getTestRun = async (req: Request, res: Response) => {
  try {
    const bugId = req.params.id as string

    const testRun = await prisma.testRun.findUnique({
      where: { id: bugId },
      include: {
        executor: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        testResults: {
          include: {
            testCase: true
          }
        },
      }
    })

    if (!testRun) {
      return res.status(404).json({ message: 'Test run not found' })
    }

    res.json({ testRun })
  } catch (error) {
    console.error('Get test run error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// CREATE test run
export const createTestRun = async (req: Request, res: Response) => {
  try {
    const { name, projectId, githubRef } = req.body
    const executedBy = (req as any).userId

    if (!name || !projectId) {
      return res.status(400).json({ message: 'Name and project are required' })
    }

    const testRun = await prisma.testRun.create({
      data: {
        name,
        projectId,
        executedBy,
        githubRef: githubRef || null,
        status: 'IN_PROGRESS',
      },
      include: {
        executor: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        testResults: true,
      }
    })

    res.status(201).json({ message: 'Test run created successfully', testRun })
  } catch (error) {
    console.error('Create test run error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// UPDATE test run status
export const updateTestRun = async (req: Request, res: Response) => {
  try {
    const bugId = req.params.id as string
    const { name, status, githubRef } = req.body

    const testRun = await prisma.testRun.update({
      where: { id: bugId },
      data: {
        ...(name && { name }),
        ...(status && { status }),
        ...(githubRef !== undefined && { githubRef }),
      },
      include: {
        executor: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        testResults: true,
      }
    })

    res.json({ message: 'Test run updated successfully', testRun })
  } catch (error) {
    console.error('Update test run error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// DELETE test run
export const deleteTestRun = async (req: Request, res: Response) => {
  try {
    const bugId = req.params.id as string
    await prisma.testRun.delete({ where: { id: bugId } })
    res.json({ message: 'Test run deleted successfully' })
  } catch (error) {
    console.error('Delete test run error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// ADD test result to a test run
export const addTestResult = async (req: Request, res: Response) => {
  try {
    const testRunId = req.params.id as string
    const { testCaseId, status, notes } = req.body

    if (!testCaseId || !status) {
      return res.status(400).json({ message: 'Test case and status are required' })
    }

    const testResult = await prisma.testResult.create({
      data: {
        testRunId,
        testCaseId,
        status,
        notes: notes || null,
      },
      include: {
        testCase: true,
      }
    })

    res.status(201).json({ message: 'Test result added', testResult })
  } catch (error) {
    console.error('Add test result error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}