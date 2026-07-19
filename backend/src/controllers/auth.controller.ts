import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'studyquest_cozy_secret';

export class AuthController {
  /**
   * User registration / signup
   */
  static async signup(req: AuthenticatedRequest, res: Response) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Check existing
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Username or email already in use' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          xp: 0,
          level: 1,
          coins: 150, // default welcome coins
          streak: 1, // first day streak initialized
          lastActive: new Date(),
        },
      });

      // Create default cozy pet for user: Bunny
      const bunnyPet = await prisma.pet.findFirst({ where: { id: 'pet_bunbun' } });
      if (bunnyPet) {
        const inventoryItem = await prisma.inventoryItem.create({
          data: {
            userId: user.id,
            petId: 'pet_bunbun',
          },
        });
        
        // Place Bunny in village at start
        await prisma.villagePlacement.create({
          data: {
            userId: user.id,
            inventoryItemId: inventoryItem.id,
            x: 2,
            y: 2,
          },
        });
      }

      // Create a few starting seed decorations
      const basicTree = await prisma.decoration.findFirst({ where: { id: 'tree_cozy' } });
      if (basicTree) {
        const treeItem = await prisma.inventoryItem.create({
          data: {
            userId: user.id,
            decorationId: 'tree_cozy',
          },
        });

        await prisma.villagePlacement.create({
          data: {
            userId: user.id,
            inventoryItemId: treeItem.id,
            x: 4,
            y: 3,
          },
        });
      }

      // Sign JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      // Omit password
      const { password: _, ...userWithoutPassword } = user;

      return res.status(201).json({
        token,
        user: userWithoutPassword,
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      return res.status(500).json({ error: 'Server error during signup' });
    }
  }

  /**
   * User login
   */
  static async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { emailOrUsername, password } = req.body;

      if (!emailOrUsername || !password) {
        return res.status(400).json({ error: 'Email/Username and password are required' });
      }

      // Find user
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: emailOrUsername },
            { username: emailOrUsername },
          ],
        },
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Calculate streak logic
      let updatedStreak = user.streak;
      const now = new Date();
      if (user.lastActive) {
        const lastActiveDate = new Date(user.lastActive);
        const timeDiff = now.getTime() - lastActiveDate.getTime();
        const diffDays = timeDiff / (1000 * 3600 * 24);

        if (diffDays > 1.0 && diffDays < 2.0) {
          // Continuous active day
          updatedStreak += 1;
        } else if (diffDays >= 2.0) {
          // Streak broken
          updatedStreak = 1;
        }
      } else {
        updatedStreak = 1;
      }

      // Update active times
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastActive: now,
          streak: updatedStreak,
        },
      });

      // Sign JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      // Omit password
      const { password: _, ...userWithoutPassword } = updatedUser;

      return res.json({
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Server error during login' });
    }
  }

  /**
   * Get authenticated user profile
   */
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) return res.status(400).json({ error: 'Missing user context' });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          achievements: {
            include: {
              achievement: true,
            },
          },
          inventory: {
            include: {
              decoration: true,
              pet: true,
            },
          },
          villagePlacements: {
            include: {
              inventoryItem: {
                include: {
                  decoration: true,
                  pet: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password: _, ...profile } = user;
      return res.json(profile);
    } catch (error) {
      console.error('Profile fetch error:', error);
      return res.status(500).json({ error: 'Server error fetching profile' });
    }
  }
}
