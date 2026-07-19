import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AnalyticsController {
  /**
   * Get pre-compiled and real-time study analytics dashboards
   */
  static async getDashboardAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId!;

      // 1. Fetch user sessions
      const sessions = await prisma.session.findMany({
        where: { userId },
        include: { topic: true },
        orderBy: { startTime: 'asc' },
      });

      // 2. Fetch latest AI Report
      const latestReport = await prisma.aiReport.findFirst({
        where: { userId },
        orderBy: { timestamp: 'desc' },
      });

      // 3. Compute stats
      let totalStudyTime = 0; // seconds
      let totalFocusScore = 0;
      let distractionCount = 0;
      let activeProblems = 0;
      let activeQuizzesCount = 0;
      let totalPassiveMaterialsOpened = 0; // notes opened + videos opened

      sessions.forEach(s => {
        totalStudyTime += s.duration;
        totalFocusScore += s.focusScore;
        distractionCount += s.distractionsCount + s.tabSwitches;
        activeProblems += s.problemsAttempted;
        if (s.quizScore !== null) {
          activeQuizzesCount += 1;
        }
        totalPassiveMaterialsOpened += s.notesOpened + s.videosOpened;
      });

      const averageFocusScore = sessions.length > 0 ? Math.round(totalFocusScore / sessions.length) : 100;
      const totalStudyMinutes = Math.round(totalStudyTime / 60);

      // Active recall ratio = (Problems attempted + (quizzes * 3)) / (Total materials opened + active actions + 1)
      const activeRecallActions = activeProblems + (activeQuizzesCount * 3);
      const activeRecallRatio = activeRecallActions / (totalPassiveMaterialsOpened + activeRecallActions + 1);

      // 4. Group session durations and focus scores by weekday for charts (last 7 days)
      const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const last7DaysMap: Record<string, { durationMin: number; focusSum: number; count: number }> = {};
      
      // Initialize map
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayLabel = weekdayNames[d.getDay()];
        last7DaysMap[dayLabel] = { durationMin: 0, focusSum: 0, count: 0 };
      }

      // Fill in maps
      sessions.forEach(s => {
        const sessionDate = new Date(s.startTime);
        const dayLabel = weekdayNames[sessionDate.getDay()];
        if (last7DaysMap[dayLabel] !== undefined) {
          last7DaysMap[dayLabel].durationMin += Math.round(s.duration / 60);
          last7DaysMap[dayLabel].focusSum += s.focusScore;
          last7DaysMap[dayLabel].count += 1;
        }
      });

      const chartData = Object.keys(last7DaysMap).map(label => {
        const item = last7DaysMap[label];
        return {
          day: label,
          studyMinutes: item.durationMin,
          averageFocus: item.count > 0 ? Math.round(item.focusSum / item.count) : 0,
        };
      });

      // 5. Category distribution
      const topics = await prisma.topic.findMany({
        where: { userId },
        include: { sessions: true },
      });

      const categoryDistribution = topics.map(t => {
        const timeSpentMin = t.sessions.reduce((acc, s) => acc + Math.round(s.duration / 60), 0);
        return {
          topic: t.title,
          category: t.category || 'General',
          studyMinutes: timeSpentMin,
        };
      }).filter(c => c.studyMinutes > 0);

      return res.json({
        totalStudyMinutes,
        averageFocusScore,
        distractionCount,
        activeRecallRatio: Math.round(activeRecallRatio * 100),
        latestReport,
        chartData,
        categoryDistribution,
      });
    } catch (error) {
      console.error('Fetch analytics error:', error);
      return res.status(500).json({ error: 'Server error loading analytics summary' });
    }
  }
}
