import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../config/prisma'

const generateToken = (userId: string) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  )
}

// REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body

    // Check all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' })
    }

    // Hash the password — never store plain text passwords
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create the user in the database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN' // First user is admin
      }
    })

    // Generate JWT token
    const token = generateToken(user.id)

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Check all fields are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Compare password with hashed version
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Generate JWT token
    const token = generateToken(user.id)

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// GET CURRENT USER
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    console.error('GetMe error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}