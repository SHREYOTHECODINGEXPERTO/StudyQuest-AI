import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { QuizGeneratorService } from '../services/quiz-generator.service';

export class QuizController {
  /**
   * Request an AI generated quiz for a study note
   */
  static async generateQuizForNote(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { noteId } = req.body;

      if (!noteId) {
        return res.status(400).json({ error: 'Note ID is required' });
      }

      const note = await prisma.note.findFirst({
        where: { id: noteId, topic: { userId } },
        include: { topic: true },
      });

      if (!note) {
        return res.status(404).json({ error: 'Note not found or access denied' });
      }

      // Generate content
      const generated = await QuizGeneratorService.generateQuiz(note.topic.title, note.content);

      // Save Quiz & Questions to DB
      const quiz = await prisma.quiz.create({
        data: {
          topicId: note.topicId,
          title: generated.title,
          questions: {
            create: generated.questions.map(q => ({
              type: q.type,
              questionText: q.questionText,
              options: q.options ? JSON.stringify(q.options) : null,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
            })),
          },
        },
        include: {
          questions: true,
        },
      });

      // Save Flashcards to user card bank
      if (generated.flashcards && generated.flashcards.length > 0) {
        await prisma.flashcard.createMany({
          data: generated.flashcards.map(f => ({
            userId,
            topicId: note.topicId,
            front: f.front,
            back: f.back,
            interval: 1,
            easeFactor: 2.5,
            repetitions: 0,
            nextReview: new Date(),
          })),
        });
      }

      return res.status(201).json({
        quiz,
        flashcardsAddedCount: generated.flashcards.length,
      });
    } catch (error) {
      console.error('Quiz creation error:', error);
      return res.status(500).json({ error: 'Server error generating quiz' });
    }
  }

  /**
   * Submit quiz scoring details to award coins & log session accuracy
   */
  static async submitQuizScore(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { sessionId, scorePercentage } = req.body;

      if (scorePercentage === undefined) {
        return res.status(400).json({ error: 'Score percentage is required' });
      }

      // If active session is running, bind quiz score to it
      if (sessionId) {
        await prisma.session.update({
          where: { id: sessionId },
          data: { quizScore: scorePercentage },
        });
      }

      // Award coin bonus for taking quiz (1 coin per 5% score, max 20 coins)
      const earnedCoins = Math.round(scorePercentage / 5);

      await prisma.user.update({
        where: { id: userId },
        data: {
          coins: { increment: earnedCoins },
          xp: { increment: 20 },
        },
      });

      return res.json({
        message: 'Quiz score recorded!',
        coinsEarned: earnedCoins,
        xpEarned: 20,
      });
    } catch (error) {
      console.error('Submit quiz score error:', error);
      return res.status(500).json({ error: 'Server error saving quiz performance' });
    }
  }

  /**
   * List flashcards due for review
   */
  static async getFlashcards(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const cards = await prisma.flashcard.findMany({
        where: {
          userId,
          nextReview: { lte: new Date() },
        },
        orderBy: { nextReview: 'asc' },
      });

      return res.json(cards);
    } catch (error) {
      console.error('Get flashcards error:', error);
      return res.status(500).json({ error: 'Server error fetching flashcards' });
    }
  }

  /**
   * Review flashcard using SM-2 SuperMemo spaced repetition scheduler
   */
  static async reviewFlashcard(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { cardId, quality } = req.body; // quality rating 0-5

      if (!cardId || quality === undefined) {
        return res.status(400).json({ error: 'Card ID and Quality rating (0-5) are required' });
      }

      const card = await prisma.flashcard.findFirst({
        where: { id: cardId, userId },
      });

      if (!card) {
        return res.status(404).json({ error: 'Flashcard not found' });
      }

      // SM-2 Spaced Repetition calculation parameters:
      let repetitions = card.repetitions;
      let easeFactor = card.easeFactor;
      let interval = card.interval;

      if (quality >= 3) {
        // Correct response
        if (repetitions === 0) {
          interval = 1;
        } else if (repetitions === 1) {
          interval = 6;
        } else {
          interval = Math.round(interval * easeFactor);
        }
        repetitions += 1;
      } else {
        // Incorrect response
        repetitions = 0;
        interval = 1;
      }

      // Recalculate ease factor
      easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (easeFactor < 1.3) easeFactor = 1.3;

      // Set next review timestamp
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + interval);

      const updatedCard = await prisma.flashcard.update({
        where: { id: cardId },
        data: {
          repetitions,
          easeFactor,
          interval,
          nextReview,
        },
      });

      // Award active recall bonus: 5 XP & 2 Coins
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: 5 },
          coins: { increment: 2 },
        },
      });

      return res.json({
        message: 'Spaced repetition schedule updated!',
        card: updatedCard,
      });
    } catch (error) {
      console.error('Review flashcard error:', error);
      return res.status(500).json({ error: 'Server error processing card review' });
    }
  }
}
