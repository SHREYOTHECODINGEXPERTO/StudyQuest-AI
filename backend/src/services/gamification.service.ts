import prisma from '../config/db';

export class GamificationService {
  /**
   * Calculates XP and coins for a session, updates user level/XP/coins,
   * checks for level-ups, and awards daily missions progress.
   */
  static async processSessionRewards(userId: string, session: {
    duration: number; // in seconds
    focusScore: number;
    problemsAttempted: number;
    quizScore: number | null;
  }) {
    // 1. Calculate Rewards
    // Base XP: 1 XP per 10 seconds of studying
    const baseXP = Math.round(session.duration / 10);
    // Focus Bonus: Multiplies base XP by focus ratio
    const focusBonus = Math.round(baseXP * (session.focusScore / 100) * 0.5);
    // Activity XP: 10 XP per problem, 20 XP for completing a quiz
    const activityXP = (session.problemsAttempted * 10) + (session.quizScore !== null ? 25 : 0);
    const totalXPGained = Math.max(5, baseXP + focusBonus + activityXP);

    // Coins: Earn coins based on focus and activities
    // 1 coin per 20 seconds of study + focus bonus + quiz bonus
    const baseCoins = Math.round(session.duration / 20);
    const activityCoins = (session.problemsAttempted * 2) + (session.quizScore !== null ? 15 : 0);
    const focusCoinMultiplier = session.focusScore >= 80 ? 1.5 : 1.0;
    const totalCoinsGained = Math.round((baseCoins + activityCoins) * focusCoinMultiplier);

    // 2. Fetch User to apply changes
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    let currentXP = user.xp + totalXPGained;
    let currentLevel = user.level;
    let leveledUp = false;

    // Level-up threshold rule: XP needed for NEXT level = level * 150
    // e.g. Level 1 -> Level 2: 150 XP. Level 2 -> Level 3: 300 XP.
    let xpNeeded = currentLevel * 150;
    while (currentXP >= xpNeeded) {
      currentXP -= xpNeeded;
      currentLevel += 1;
      xpNeeded = currentLevel * 150;
      leveledUp = true;
    }

    // 3. Update User in DB
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        xp: currentXP,
        level: currentLevel,
        coins: user.coins + totalCoinsGained,
      },
    });

    // 4. Trigger achievement checks
    const unlockedAchievements = await this.evaluateAchievements(userId);

    return {
      xpGained: totalXPGained,
      coinsGained: totalCoinsGained,
      currentLevel,
      currentXP,
      leveledUp,
      unlockedAchievements,
      user: updatedUser,
    };
  }

  /**
   * Checks if user conditions meet achievement thresholds and unlocks them.
   */
  static async evaluateAchievements(userId: string): Promise<string[]> {
    const newlyUnlocked: string[] = [];

    // Fetch user with sessions, quizzes, topics, and existing achievements
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sessions: true,
        topics: true,
        achievements: true,
      },
    });

    if (!user) return [];

    const unlockedIds = new Set(user.achievements.map(a => a.achievementId));

    // Helper: Unlock in DB
    const unlock = async (id: string) => {
      if (unlockedIds.has(id)) return;
      
      const achievement = await prisma.achievement.findUnique({ where: { id } });
      if (!achievement) return;

      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: id,
        },
      });

      // Award achievement XP
      await prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: achievement.xpReward } },
      });

      newlyUnlocked.push(achievement.title);
    };

    // Rule A: First Study Session
    if (user.sessions.length >= 1) {
      await unlock('first_session');
    }

    // Rule B: Focus Master (10+ min session with 90%+ focus score)
    const hasFocusMaster = user.sessions.some(s => s.duration >= 600 && s.focusScore >= 90);
    if (hasFocusMaster) {
      await unlock('focus_master');
    }

    // Rule C: Night Owl (study session ending or starting late at night: past 10 PM)
    const hasNightOwl = user.sessions.some(s => {
      const hour = new Date(s.startTime).getHours();
      return hour >= 22 || hour <= 4;
    });
    if (hasNightOwl) {
      await unlock('night_owl');
    }

    // Rule D: Problem Solver (Total 10+ practice problems attempted across sessions)
    const totalProblems = user.sessions.reduce((acc, s) => acc + s.problemsAttempted, 0);
    if (totalProblems >= 10) {
      await unlock('problem_solver');
    }

    // Rule E: Topic Explorer (Created at least 5 study topics)
    if (user.topics.length >= 5) {
      await unlock('topic_explorer');
    }

    // Rule F: Streak Builder (5+ study streak days)
    if (user.streak >= 5) {
      await unlock('streak_5');
    }

    return newlyUnlocked;
  }
}
