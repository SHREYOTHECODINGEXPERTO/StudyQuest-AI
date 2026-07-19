import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AIAnalysisService } from '../services/ai-analysis.service';

export class JournalController {
  /**
   * Save a journal entry and generate AI summaries from today's study telemetry
   */
  static async createJournalEntry(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { mood, wins, mistakes } = req.body;

      if (!mood) {
        return res.status(400).json({ error: 'Mood selection is required' });
      }

      // Fetch all sessions completed today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const todaysSessions = await prisma.session.findMany({
        where: {
          userId,
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: { topic: true },
      });

      // Map sessions to short descriptors for the prompt service
      const logs = todaysSessions.map(s => ({
        topic: s.topic.title,
        duration: s.duration,
        focus: s.focusScore,
        mood,
      }));

      // Call AI to compile narrative journal summary & advice
      const summaryResult = await AIAnalysisService.compileDailyJournal(userId, logs);

      const journal = await prisma.journal.create({
        data: {
          userId,
          date: new Date(),
          mood,
          summary: summaryResult.summary,
          wins: wins || summaryResult.wins,
          mistakes: mistakes || summaryResult.mistakes,
          aiSuggestions: summaryResult.aiSuggestions,
        },
      });

      // Award daily journal XP bonus (15 XP & 10 Coins)
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: 15 },
          coins: { increment: 10 },
        },
      });

      return res.status(201).json(journal);
    } catch (error) {
      console.error('Journal create error:', error);
      return res.status(500).json({ error: 'Server error generating journal entry' });
    }
  }

  /**
   * List all journal entries for the user
   */
  static async getJournalEntries(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const journals = await prisma.journal.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      });

      return res.json(journals);
    } catch (error) {
      console.error('Get journals error:', error);
      return res.status(500).json({ error: 'Server error loading journals' });
    }
  }
}
