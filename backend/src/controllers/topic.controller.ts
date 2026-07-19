import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { OCRService } from '../services/ocr.service';

export class TopicController {
  /**
   * Create a study topic
   */
  static async createTopic(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { title, description, category } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const topic = await prisma.topic.create({
        data: {
          userId,
          title,
          description,
          category: category || 'General',
        },
      });

      return res.status(201).json(topic);
    } catch (error) {
      console.error('Create topic error:', error);
      return res.status(500).json({ error: 'Server error creating topic' });
    }
  }

  /**
   * List all topics for the authenticated user
   */
  static async getTopics(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const topics = await prisma.topic.findMany({
        where: { userId },
        include: {
          notes: true,
          sessions: {
            orderBy: { startTime: 'desc' },
            take: 5,
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return res.json(topics);
    } catch (error) {
      console.error('Get topics error:', error);
      return res.status(500).json({ error: 'Server error listing topics' });
    }
  }

  /**
   * Add a note to a topic
   */
  static async createNote(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { topicId, title, content, tags } = req.body;

      if (!topicId || !title || !content) {
        return res.status(400).json({ error: 'Topic ID, title, and content are required' });
      }

      const topic = await prisma.topic.findFirst({
        where: { id: topicId, userId },
      });

      if (!topic) {
        return res.status(404).json({ error: 'Topic not found or access denied' });
      }

      const note = await prisma.note.create({
        data: {
          topicId,
          title,
          content,
          tags,
        },
      });

      // Update topic updatedAt timestamp
      await prisma.topic.update({
        where: { id: topicId },
        data: { updatedAt: new Date() },
      });

      return res.status(201).json(note);
    } catch (error) {
      console.error('Create note error:', error);
      return res.status(500).json({ error: 'Server error creating note' });
    }
  }

  /**
   * Upload notebook image via Base64, run OCR and create topic/note
   */
  static async uploadNotebookOCR(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { base64Image, fileName } = req.body;

      if (!base64Image) {
        return res.status(400).json({ error: 'base64Image data is required' });
      }

      // Convert base64 back to image buffer
      // Format: "data:image/png;base64,iVBORw0KGgo..." -> extract raw data
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Execute OCR transcription
      const ocrResult = await OCRService.extractText(buffer, fileName || 'notes.jpg');

      // Create new topic for this OCR scan
      const topic = await prisma.topic.create({
        data: {
          userId,
          title: ocrResult.extractedTopic,
          category: ocrResult.extractedCategory,
          description: `Automatically created from handwritten notebook image upload.`,
        },
      });

      // Create initial Note with OCR transcription text
      const note = await prisma.note.create({
        data: {
          topicId: topic.id,
          title: 'OCR Transcription Notes',
          content: `### Transcribed Handwritten Notes\n\n\`\`\`text\n${ocrResult.text || 'No legible text detected.'}\n\`\`\`\n\n*Review instructions:* Open the study session panel, check concepts, and test yourself on this topic to grow your cozy study village!`,
          tags: 'OCR,Handwritten',
        },
      });

      // Award XP to user for logging notebook (50 XP & 20 Coins)
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            xp: { increment: 50 },
            coins: { increment: 20 },
          },
        });
      }

      return res.status(201).json({
        message: 'Notebook successfully transcribed and study logs created!',
        topic,
        note,
      });
    } catch (error) {
      console.error('Notebook upload and OCR error:', error);
      return res.status(500).json({ error: 'Server error processing notebook transcription' });
    }
  }
}
