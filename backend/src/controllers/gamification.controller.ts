import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class GamificationController {
  /**
   * List all store decorations and pets
   */
  static async getStoreItems(req: AuthenticatedRequest, res: Response) {
    try {
      const decorations = await prisma.decoration.findMany();
      const pets = await prisma.pet.findMany();

      return res.json({
        decorations,
        pets,
      });
    } catch (error) {
      console.error('Fetch store items error:', error);
      return res.status(500).json({ error: 'Server error listing store items' });
    }
  }

  /**
   * Purchase a decoration or pet from the store
   */
  static async purchaseItem(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { type, itemId } = req.body; // type: "DECORATION" or "PET"

      if (!itemId || !type) {
        return res.status(400).json({ error: 'Item ID and Type are required' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: 'User not found' });

      let cost = 0;
      let decorationId: string | null = null;
      let petId: string | null = null;

      if (type === 'DECORATION') {
        const item = await prisma.decoration.findUnique({ where: { id: itemId } });
        if (!item) return res.status(404).json({ error: 'Decoration not found' });
        cost = item.cost;
        decorationId = itemId;
      } else if (type === 'PET') {
        const item = await prisma.pet.findUnique({ where: { id: itemId } });
        if (!item) return res.status(404).json({ error: 'Pet not found' });
        cost = item.cost;
        petId = itemId;

        // Check if user already owns this pet (only 1 of each pet allowed)
        const ownedPet = await prisma.inventoryItem.findFirst({
          where: { userId, petId },
        });
        if (ownedPet) {
          return res.status(400).json({ error: 'You already own this study pet!' });
        }
      } else {
        return res.status(400).json({ error: 'Invalid store type' });
      }

      if (user.coins < cost) {
        return res.status(400).json({ error: `Insufficient coins. Need ${cost} coins, but you only have ${user.coins}.` });
      }

      // Deduct coins & create inventory item
      const [updatedUser, inventoryItem] = await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { coins: { decrement: cost } },
        }),
        prisma.inventoryItem.create({
          data: {
            userId,
            decorationId,
            petId,
          },
          include: {
            decoration: true,
            pet: true,
          },
        }),
      ]);

      return res.status(201).json({
        message: 'Purchase completed!',
        user: updatedUser,
        inventoryItem,
      });
    } catch (error) {
      console.error('Purchase item error:', error);
      return res.status(500).json({ error: 'Server error processing purchase' });
    }
  }

  /**
   * Retrieve placement configuration of a user's village grid
   */
  static async getVillagePlacements(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const placements = await prisma.villagePlacement.findMany({
        where: { userId },
        include: {
          inventoryItem: {
            include: {
              decoration: true,
              pet: true,
            },
          },
        },
      });

      return res.json(placements);
    } catch (error) {
      console.error('Get placements error:', error);
      return res.status(500).json({ error: 'Server error loading village' });
    }
  }

  /**
   * Save village grid changes
   */
  static async updateVillagePlacements(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { placements } = req.body; // Expected format: Array<{ inventoryItemId: string, x: number, y: number }>

      if (!Array.isArray(placements)) {
        return res.status(400).json({ error: 'Placements data must be a valid array' });
      }

      // Validate all placement items are owned by user
      const ownedItems = await prisma.inventoryItem.findMany({
        where: { userId },
        select: { id: true },
      });
      const ownedIds = new Set(ownedItems.map(item => item.id));

      const validPlacements = placements.filter(p => ownedIds.has(p.inventoryItemId));

      // Transaction: Clear previous placements and save new ones
      await prisma.$transaction([
        prisma.villagePlacement.deleteMany({ where: { userId } }),
        prisma.villagePlacement.createMany({
          data: validPlacements.map(p => ({
            userId,
            inventoryItemId: p.inventoryItemId,
            x: p.x,
            y: p.y,
          })),
        }),
      ]);

      const updatedPlacements = await prisma.villagePlacement.findMany({
        where: { userId },
        include: {
          inventoryItem: {
            include: {
              decoration: true,
              pet: true,
            },
          },
        },
      });

      return res.json({
        message: 'Village placements updated successfully!',
        placements: updatedPlacements,
      });
    } catch (error) {
      console.error('Update placements error:', error);
      return res.status(500).json({ error: 'Server error updating village layout' });
    }
  }
}
