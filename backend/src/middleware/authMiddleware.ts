import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export const protect = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' })
    }

    // Extract the token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1]

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string }

    // Attach userId to the request so controllers can use it
    ;(req as any).userId = decoded.userId

    next() // Move to the next function
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, invalid token' })
  }
}