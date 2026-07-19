import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AIAnalysisService } from '../services/ai-analysis.service';
import { GamificationService } from '../services/gamification.service';

export class SessionController {
  /**
   * Start a new study session
   */
  static async startSession(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { topicId } = req.body;

      if (!topicId) {
        return res.status(400).json({ error: 'Topic ID is required' });
      }

      // Check if topic exists
      const topic = await prisma.topic.findFirst({
        where: { id: topicId, userId },
      });

      if (!topic) {
        return res.status(404).json({ error: 'Topic not found or access denied' });
      }

      const session = await prisma.session.create({
        data: {
          userId,
          topicId,
          startTime: new Date(),
          duration: 0,
          breaksCount: 0,
          videosOpened: 0,
          notesOpened: 0,
          revisitsCount: 0,
          problemsAttempted: 0,
          idleTime: 0,
          tabSwitches: 0,
          distractionsCount: 0,
          focusScore: 100.0,
        },
      });

      return res.status(201).json(session);
    } catch (error) {
      console.error('Session start error:', error);
      return res.status(500).json({ error: 'Server error starting session' });
    }
  }

  /**
   * Update active session telemetry (periodic save)
   */
  static async updateSession(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { sessionId } = req.params;
      const {
        duration,
        breaksCount,
        videosOpened,
        notesOpened,
        revisitsCount,
        problemsAttempted,
        idleTime,
        tabSwitches,
        distractionsCount,
        quizScore,
      } = req.body;

      const session = await prisma.session.findFirst({
        where: { id: sessionId, userId },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Compute dynamic focus score
      // Starts at 100, drops with tab switches (5 pts), breaks (5 pts), distractions (6 pts), and idle ratio
      const idleRatio = duration > 0 ? (idleTime / duration) : 0;
      const penalty = (tabSwitches * 5) + (breaksCount * 5) + (distractionsCount * 6) + (idleRatio * 50);
      const computedFocusScore = Math.max(10, Math.min(100, Math.round(100 - penalty)));

      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: {
          duration: duration ?? session.duration,
          breaksCount: breaksCount ?? session.breaksCount,
          videosOpened: videosOpened ?? session.videosOpened,
          notesOpened: notesOpened ?? session.notesOpened,
          revisitsCount: revisitsCount ?? session.revisitsCount,
          problemsAttempted: problemsAttempted ?? session.problemsAttempted,
          idleTime: idleTime ?? session.idleTime,
          tabSwitches: tabSwitches ?? session.tabSwitches,
          distractionsCount: distractionsCount ?? session.distractionsCount,
          quizScore: quizScore !== undefined ? quizScore : session.quizScore,
          focusScore: computedFocusScore,
        },
      });

      return res.json(updatedSession);
    } catch (error) {
      console.error('Session update error:', error);
      return res.status(500).json({ error: 'Server error updating session' });
    }
  }

  /**
   * End session and trigger AI Analysis Engine & Gamification Rewards
   */
  static async endSession(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { sessionId } = req.params;

      const session = await prisma.session.findFirst({
        where: { id: sessionId, userId },
        include: { topic: true },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // 1. Mark End time and finalize duration
      const endTime = new Date();
      const finalDuration = Math.max(1, Math.round((endTime.getTime() - session.startTime.getTime()) / 1000));
      
      // Update session values with latest endTime
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          endTime,
          duration: finalDuration,
        },
      });

      // Fetch fresh session metrics to ensure calculations are correct
      const freshSession = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { topic: true },
      })!;

      if (!freshSession) throw new Error('Failed to load final session details');

      // 2. Perform AI Behavioral Engine Analysis
      const aiReportData = await AIAnalysisService.analyzeSession({
        duration: freshSession.duration,
        breaksCount: freshSession.breaksCount,
        videosOpened: freshSession.videosOpened,
        notesOpened: freshSession.notesOpened,
        revisitsCount: freshSession.revisitsCount,
        problemsAttempted: freshSession.problemsAttempted,
        quizScore: freshSession.quizScore,
        idleTime: freshSession.idleTime,
        tabSwitches: freshSession.tabSwitches,
        distractionsCount: freshSession.distractionsCount,
        focusScore: freshSession.focusScore,
        topicName: freshSession.topic.title,
      });

      // 3. Save AI Report to DB
      const report = await prisma.aiReport.create({
        data: {
          userId,
          knowledgeGapScore: aiReportData.knowledgeGapScore,
          avoidanceScore: aiReportData.avoidanceScore,
          passiveLearningScore: aiReportData.passiveLearningScore,
          motivationDropScore: aiReportData.motivationDropScore,
          reportSummary: aiReportData.reportSummary,
          coachingAdvice: aiReportData.coachingAdvice,
        },
      });

      // 4. Process Gamification Rewards (XP, level progressions, coins)
      const rewardsResult = await GamificationService.processSessionRewards(userId, {
        duration: freshSession.duration,
        focusScore: freshSession.focusScore,
        problemsAttempted: freshSession.problemsAttempted,
        quizScore: freshSession.quizScore,
      });

      return res.json({
        message: 'Session successfully ended and analyzed!',
        session: freshSession,
        report,
        rewards: {
          xpGained: rewardsResult.xpGained,
          coinsGained: rewardsResult.coinsGained,
          currentLevel: rewardsResult.currentLevel,
          currentXP: rewardsResult.currentXP,
          leveledUp: rewardsResult.leveledUp,
          unlockedAchievements: rewardsResult.unlockedAchievements,
        },
      });
    } catch (error) {
      console.error('Session end error:', error);
      return res.status(500).json({ error: 'Server error finalizing session' });
    }
  }

  /**
   * Get historical sessions
   */
  static async getHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;
      const sessions = await prisma.session.findMany({
        where: { userId },
        include: { topic: true },
        orderBy: { startTime: 'desc' },
        take: 30, // return last 30 sessions
      });

      return res.json(sessions);
    } catch (error) {
      console.error('Get history error:', error);
      return res.status(500).json({ error: 'Server error fetching session logs' });
    }
  }
}
