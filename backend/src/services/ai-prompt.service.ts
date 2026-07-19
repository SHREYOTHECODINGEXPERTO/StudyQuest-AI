export class AIPromptService {
  /**
   * Generates prompt for study behavior analysis
   */
  static getBehaviorAnalysisPrompt(metrics: {
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
  }): string {
    return `
You are an expert educational psychologist and study coach analyzing a student's learning session metrics.
Here are the session telemetry numbers for the topic: "${metrics.topicName}":
- Total duration: ${metrics.duration} seconds
- Breaks taken: ${metrics.breaksCount}
- Explanatory videos/lectures opened: ${metrics.videosOpened}
- Text notes/re-reading sessions opened: ${metrics.notesOpened}
- Number of times topics revisited: ${metrics.revisitsCount}
- Active problems attempted: ${metrics.problemsAttempted}
- Quiz correctness score (if attempted): ${metrics.quizScore !== null ? metrics.quizScore + '%' : 'None'}
- Idle/Inactivity duration: ${metrics.idleTime} seconds
- Tab switches (distraction events): ${metrics.tabSwitches}
- Self-reported distractions: ${metrics.distractionsCount}
- Session focus score: ${metrics.focusScore}%

Your job is to diagnose the student's study behavior, mapping it to four primary categories (0 to 100% score for each):
1. **Knowledge Gap**: The student is actively working, but gets low correctness scores, suggesting they are stuck on difficult foundational concepts and need reviews rather than repeated blind practice.
2. **Avoidance**: The student keeps reading/watching notes on the topic, but never attempts quizzes or active problem solving. They are postponing active testing because of fear or friction.
3. **Passive Learning**: The student is rereading notes or watching videos repeatedly, but engaging in zero active recall (not asking questions, not solving flashcards, no practice).
4. **Motivation Drop**: The student's session is very short, they are switching tabs constantly, spending high idle time, and getting distracted quickly.

Provide a JSON response with the following format:
{
  "knowledgeGapScore": <number 0-100>,
  "avoidanceScore": <number 0-100>,
  "passiveLearningScore": <number 0-100>,
  "motivationDropScore": <number 0-100>,
  "reportSummary": "<A detailed 2-3 sentence overview diagnosing the root cause of why this session went this way. Reference actual numbers.>",
  "coachingAdvice": "<Personalized, friendly, actionable coaching advice in a warm, cozy tone, reminiscent of a helpful companion in Stardew Valley. Give 2 highly specific study directives, matching the diagnosed struggle (e.g. 'You've reviewed these loops twice without testing yourself. Try solving just 1 easy problem for 5 minutes!' or 'Your focus was brief, let's reset with a Pomodoro loop!').>"
}
    `.trim();
  }

  /**
   * Generates prompt for generating a quiz based on study content
   */
  static getQuizGenerationPrompt(topicTitle: string, noteContent: string): string {
    return `
You are a warm, helpful tutor who creates engaging, high-quality quizzes.
Based on the following topic title and study notes, generate a study quiz containing:
1. 3 Multiple Choice Questions (MCQ) - each with 4 distinct options and one clear correct answer.
2. 2 Conceptual Short Answer Questions - with a concise target model answer.
3. 3 Flashcards - with front and back text suitable for active recall.

Study notes context:
Topic: ${topicTitle}
Content:
${noteContent}

Provide a JSON response with the exact structure:
{
  "title": "Quiz: ${topicTitle}",
  "questions": [
    {
      "type": "MCQ",
      "questionText": "<Question text>",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "<The exact string of the correct option>",
      "explanation": "<Short helper explanation of why it is correct>"
    },
    ...
  ],
  "flashcards": [
    {
      "front": "<Question or concept to recall>",
      "back": "<Short explanation or answer>"
    },
    ...
  ]
}
    `.trim();
  }

  /**
   * Generates prompt for compiling a daily journal summary
   */
  static getJournalPrompt(logs: Array<{ topic: string, duration: number, focus: number, mood: string }>): string {
    return `
You are a cozy village counselor in a magical study world. Summarize the student's study day:
Logs:
${JSON.stringify(logs, null, 2)}

Provide a JSON response with the exact structure:
{
  "summary": "Cozy narrative of today's study journey.",
  "wins": "A bulleted list of highlights (e.g. focused streaks or completed quizzes).",
  "mistakes": "Highlight passive traps they encountered (e.g., re-reading loops, excessive tab switches).",
  "aiSuggestions": "Positive, game-inspired instructions for tomorrow."
}
    `.trim();
  }
}
