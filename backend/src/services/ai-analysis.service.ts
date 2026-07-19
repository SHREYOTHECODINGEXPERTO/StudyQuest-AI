import OpenAI from 'openai';
import { AIPromptService } from './ai-prompt.service';

// Initialize OpenAI client dynamically to prevent startup crashes when key is missing
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return null;
  }
  return new OpenAI({ apiKey });
};

interface SessionMetrics {
  duration: number;
  breaksCount: number;
  videosOpened: number;
  notesOpened: number;
  revisitsCount: number;
  problemsAttempted: number;
  quizScore: number | null;
  idleTime: number;
  tabSwitches: number;
  distractionsCount: number;
  focusScore: number;
  topicName: string;
}

interface DiagnosisResult {
  knowledgeGapScore: number;
  avoidanceScore: number;
  passiveLearningScore: number;
  motivationDropScore: number;
  reportSummary: string;
  coachingAdvice: string;
}

export class AIAnalysisService {
  /**
   * Run diagnosis report for a completed session
   */
  static async analyzeSession(metrics: SessionMetrics): Promise<DiagnosisResult> {
    const openai = getOpenAIClient();

    if (openai) {
      try {
        const prompt = AIPromptService.getBehaviorAnalysisPrompt(metrics);
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo', // lightweight, fast, cost-effective
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        });

        const text = response.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(text);
        return {
          knowledgeGapScore: Number(parsed.knowledgeGapScore) || 0,
          avoidanceScore: Number(parsed.avoidanceScore) || 0,
          passiveLearningScore: Number(parsed.passiveLearningScore) || 0,
          motivationDropScore: Number(parsed.motivationDropScore) || 0,
          reportSummary: parsed.reportSummary || 'Session successfully completed and registered.',
          coachingAdvice: parsed.coachingAdvice || 'Keep up the steady pace! Try doing active testing next time.',
        };
      } catch (error) {
        console.error('OpenAI session analysis failed, falling back to heuristics:', error);
        return this.runHeuristicAnalysis(metrics);
      }
    } else {
      // Offline fallback
      return this.runHeuristicAnalysis(metrics);
    }
  }

  /**
   * Heuristic analysis model
   */
  private static runHeuristicAnalysis(metrics: SessionMetrics): DiagnosisResult {
    // 1. AVOIDANCE
    // High note rereading or video opening, but zero practice problems or quiz attempts
    let avoidance = 0;
    if (metrics.problemsAttempted === 0 && metrics.quizScore === null) {
      avoidance = Math.min(100, (metrics.notesOpened * 25) + (metrics.videosOpened * 25) + (metrics.revisitsCount * 15));
      if (metrics.duration > 0 && avoidance < 30) {
        avoidance = 45; // baseline avoidance if they just sat there
      }
    } else {
      avoidance = Math.max(0, 20 - (metrics.problemsAttempted * 5));
    }

    // 2. PASSIVE LEARNING
    // High note & video counts, low active recalls relative to session duration
    let passiveLearning = 0;
    const totalMaterialsOpened = metrics.notesOpened + metrics.videosOpened;
    if (totalMaterialsOpened > 0) {
      const activeActions = metrics.problemsAttempted + (metrics.quizScore !== null ? 2 : 0);
      if (activeActions === 0) {
        passiveLearning = Math.min(100, 50 + (totalMaterialsOpened * 15));
      } else {
        passiveLearning = Math.min(100, Math.max(10, (totalMaterialsOpened * 30) / activeActions));
      }
    } else {
      passiveLearning = metrics.duration > 300 && metrics.problemsAttempted === 0 ? 60 : 20;
    }

    // 3. KNOWLEDGE GAP
    // Attempted questions or quiz, but got lower score
    let knowledgeGap = 0;
    if (metrics.quizScore !== null) {
      knowledgeGap = Math.max(0, 100 - metrics.quizScore);
    } else if (metrics.problemsAttempted > 0) {
      // If they attempted practice problems but stayed in session a long time relative to minimal output
      knowledgeGap = Math.min(80, Math.max(15, (metrics.duration / 300) * 10));
    }

    // 4. MOTIVATION DROP
    // High distraction score, tab switches, breaks, or very short duration
    let motivationDrop = 0;
    const distractionMetric = (metrics.tabSwitches * 15) + (metrics.breaksCount * 20) + (metrics.distractionsCount * 15);
    const idlePercentage = metrics.duration > 0 ? (metrics.idleTime / metrics.duration) * 100 : 0;
    motivationDrop = Math.min(100, Math.max(10, distractionMetric + (idlePercentage * 0.8)));

    if (metrics.duration < 120 && metrics.duration > 0) {
      motivationDrop = Math.min(100, motivationDrop + 40); // penalty for abandoning very quickly
    }

    // Clean up floats
    knowledgeGap = Math.round(knowledgeGap);
    avoidance = Math.round(avoidance);
    passiveLearning = Math.round(passiveLearning);
    motivationDrop = Math.round(motivationDrop);

    // Compile dynamic summary
    let reportSummary = `Session on "${metrics.topicName}" completed with focus rating of ${metrics.focusScore}%. `;
    if (motivationDrop > 60) {
      reportSummary += `We noticed frequent tab switches (${metrics.tabSwitches}) and short study bursts, suggesting high mental fatigue or external distractions.`;
    } else if (avoidance > 60) {
      reportSummary += `You spent substantial time reading notes (${metrics.notesOpened}) and opening videos (${metrics.videosOpened}) but avoided active test quiz formats.`;
    } else if (knowledgeGap > 50) {
      reportSummary += `Great active efforts, but the practice scores reveal some critical concept struggles. Revision of core rules is recommended.`;
    } else {
      reportSummary += `Excellent study layout. Balanced active practice with structured reading intervals.`;
    }

    // Compile cozy Stardew-like coaching advice
    let coachingAdvice = '';
    const companionNames = ['Dewy the Forest Spirit', 'Bramble the Hedgehog', 'Bunbun the Rabbit', 'Fiddle the Owl'];
    const companion = companionNames[Math.floor((metrics.duration + metrics.focusScore) % companionNames.length)];

    if (motivationDrop > 60) {
      coachingAdvice = `🌱 *${companion} whispers:* "It looks like you're having trouble staying in the zone today. That's totally okay! Instead of forcing a long session, let's plant a tiny 10-minute focus seed. Turn off notifications, put on some lofi forest rain, and study just one small concept with me. You can do it!"`;
    } else if (avoidance > 60) {
      coachingAdvice = `📚 *${companion} prompts:* "Reading notes repeatedly makes us feel productive, but active testing is where the magic happens! I challenge you to try just a quick 3-question quiz. Even if you miss them all, your study forest will grow flowers just for trying!"`;
    } else if (passiveLearning > 60) {
      coachingAdvice = `🎒 *${companion} recommends:* "You've been watching lectures and notes closely. Let's practice active recall! Close this panel right now, take a scrap of paper, and write down the 3 most important points you remember. Explaining it in your own words helps solidify the knowledge."`;
    } else if (knowledgeGap > 50) {
      coachingAdvice = `💡 *${companion} advises:* "You are working so hard on these questions, but hitting a slight wall. Let's take a step back. Re-read the introduction on "${metrics.topicName}" for 5 minutes, or ask the Coach to generate a flashcard set. Sometimes we must slow down to speed up!"`;
    } else {
      coachingAdvice = `⭐ *${companion} smiles:* "What an amazing study rhythm! You balanced note reviews with active problem attempts. The village looks bright and happy. Let's take a 5-minute tea break, then tackle our next daily mission!"`;
    }

    return {
      knowledgeGapScore: knowledgeGap,
      avoidanceScore: avoidance,
      passiveLearningScore: passiveLearning,
      motivationDropScore: motivationDrop,
      reportSummary,
      coachingAdvice,
    };
  }

  /**
   * Run daily journal compiling
   */
  static async compileDailyJournal(
    userId: string,
    logs: Array<{ topic: string; duration: number; focus: number; mood: string }>
  ): Promise<{ summary: string; wins: string; mistakes: string; aiSuggestions: string }> {
    const openai = getOpenAIClient();

    if (openai && logs.length > 0) {
      try {
        const prompt = AIPromptService.getJournalPrompt(logs);
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        });

        const text = response.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(text);
        return {
          summary: parsed.summary || 'A steady day of learning.',
          wins: parsed.wins || 'Completed study sessions successfully.',
          mistakes: parsed.mistakes || 'Had some passive reading loops.',
          aiSuggestions: parsed.aiSuggestions || 'Try doing more active recall tomorrow!',
        };
      } catch (error) {
        console.error('OpenAI journal compilation failed, using fallback:', error);
      }
    }

    // Heuristic fallback
    const totalTimeMinutes = Math.round(logs.reduce((acc, l) => acc + l.duration, 0) / 60);
    const averageFocus = Math.round(logs.reduce((acc, l) => acc + l.focus, 0) / (logs.length || 1));
    const uniqueTopics = Array.from(new Set(logs.map(l => l.topic)));
    
    return {
      summary: `You spent ${totalTimeMinutes} minutes studying ${uniqueTopics.length} topic(s) (${uniqueTopics.join(', ')}). Your average focus rate was ${averageFocus}%, showing great dedication.`,
      wins: `• Successfully registered ${logs.length} study session(s).\n• Logged active study targets for ${uniqueTopics.join(', ')}.`,
      mistakes: averageFocus < 60 
        ? `• Experienced frequent distractions and focus dips during sessions.` 
        : `• Fell into minor passive reading habits without testing yourself.`,
      aiSuggestions: `• Plan a structured 25-minute Pomodoro session tomorrow.\n• Unlock a new village decoration with your earned coins.\n• Take a short active quiz immediately after reading your notes.`
    };
  }
}
