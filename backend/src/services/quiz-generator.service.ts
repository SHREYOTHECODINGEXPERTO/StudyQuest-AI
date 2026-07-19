import OpenAI from 'openai';
import { AIPromptService } from './ai-prompt.service';

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') return null;
  return new OpenAI({ apiKey });
};

interface QuizQuestion {
  type: 'MCQ' | 'SHORT';
  questionText: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
}

interface FlashcardTemplate {
  front: string;
  back: string;
}

interface QuizResult {
  title: string;
  questions: QuizQuestion[];
  flashcards: FlashcardTemplate[];
}

export class QuizGeneratorService {
  /**
   * Generates a quiz with MCQs and Flashcards from study notes.
   */
  static async generateQuiz(topicTitle: string, noteContent: string): Promise<QuizResult> {
    const openai = getOpenAIClient();

    if (openai) {
      try {
        const prompt = AIPromptService.getQuizGenerationPrompt(topicTitle, noteContent);
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        });

        const text = response.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(text);
        
        return {
          title: parsed.title || `Quiz: ${topicTitle}`,
          questions: parsed.questions || [],
          flashcards: parsed.flashcards || [],
        };
      } catch (error) {
        console.error('OpenAI quiz generation failed, falling back to database templates:', error);
      }
    }

    return this.generateProceduralQuiz(topicTitle);
  }

  /**
   * Procedural generator for offline fallback
   */
  private static generateProceduralQuiz(topicTitle: string): QuizResult {
    const lowerTitle = topicTitle.toLowerCase();

    // 1. RECURSION TEMPLATE
    if (lowerTitle.includes('recursion')) {
      return {
        title: `Quiz: Recursion Fundamentals`,
        questions: [
          {
            type: 'MCQ',
            questionText: 'What is the primary role of a "base case" in a recursive function?',
            options: [
              'To initialize the accumulation variable',
              'To stop the recursive loop and prevent stack overflow',
              'To speed up compilation times',
              'To allocate heap memory dynamically'
            ],
            correctAnswer: 'To stop the recursive loop and prevent stack overflow',
            explanation: 'Without a base case, a recursive function calls itself indefinitely, leading to memory exhaustion (stack overflow).'
          },
          {
            type: 'MCQ',
            questionText: 'Which data structure is implicitly used by the system during recursive function executions?',
            options: ['Queue', 'Linked List', 'Stack', 'Hash Map'],
            correctAnswer: 'Stack',
            explanation: 'The system call stack is used to keep track of active sub-routine returns and local stack frames.'
          },
          {
            type: 'MCQ',
            questionText: 'What is tail recursion optimization (TCO)?',
            options: [
              'Deleting the final return variables to save storage',
              'An optimization where the compiler replaces the call stack frame of a trailing recursion call',
              'Moving all calculations to a background thread',
              'Converting recursive methods into hash lookups'
            ],
            correctAnswer: 'An optimization where the compiler replaces the call stack frame of a trailing recursion call',
            explanation: 'TCO enables the tail-recursive call to execute in constant stack space, resolving stack overflows.'
          },
          {
            type: 'SHORT',
            questionText: 'Explain the difference between a recursive case and a base case.',
            options: null,
            correctAnswer: 'A base case contains a terminating condition that returns a value without further recursion. A recursive case calls the function itself with modified arguments, driving progress towards the base case.',
            explanation: 'A recursive function must balance both cases to complete execution successfully.'
          }
        ],
        flashcards: [
          {
            front: 'What is Stack Overflow in recursion?',
            back: 'An error when the call stack exceeds its limit due to infinite recursive calls without hitting a base case.'
          },
          {
            front: 'What is the time complexity of a recursive Fibonacci sequence without memoization?',
            back: 'O(2^n) - Exponential time complexity due to redundant subproblem evaluations.'
          },
          {
            front: 'How does memoization optimize recursive calls?',
            back: 'By storing results of expensive function calls and returning the cached result when the same inputs occur again.'
          }
        ]
      };
    }

    // 2. OPERATING SYSTEMS TEMPLATE
    if (lowerTitle.includes('operating') || lowerTitle.includes('os') || lowerTitle.includes('cpu')) {
      return {
        title: `Quiz: CPU Scheduling and Deadlocks`,
        questions: [
          {
            type: 'MCQ',
            questionText: 'Which scheduling algorithm is prone to the "convoy effect"?',
            options: [
              'Round Robin',
              'Shortest Job First',
              'First-Come, First-Served (FCFS)',
              'Multi-Level Queue'
            ],
            correctAnswer: 'First-Come, First-Served (FCFS)',
            explanation: 'FCFS can block smaller processes behind a massive CPU-bound job, creating a convoy delay.'
          },
          {
            type: 'MCQ',
            questionText: 'What are the four necessary conditions for a deadlock to occur?',
            options: [
              'Paging, Segmentation, Swapping, Thrashing',
              'Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait',
              'Read, Write, Execute, Lock',
              'Interrupts, Context Switches, System Calls, Thread Pools'
            ],
            correctAnswer: 'Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait',
            explanation: 'All four conditions must hold simultaneously for a deadlock deadlock condition to form.'
          },
          {
            type: 'MCQ',
            questionText: 'What is virtual memory?',
            options: [
              'Memory located entirely on a graphics processing unit',
              'A memory management technique mapping virtual addresses used by program space onto physical addresses',
              'Cloud-based RAM slots',
              'Encrypted storage partitions'
            ],
            correctAnswer: 'A memory management technique mapping virtual addresses used by program space onto physical addresses',
            explanation: 'Virtual memory allows programs to address more memory than physically present by swapping pages to disk.'
          },
          {
            type: 'SHORT',
            questionText: 'Explain the difference between a Process and a Thread.',
            options: null,
            correctAnswer: 'A process is an independent program in execution with its own dedicated memory space. A thread is a lightweight execution unit inside a process that shares the parent process resources.',
            explanation: 'Threads allow fast parallel execution but require careful synchronization.'
          }
        ],
        flashcards: [
          {
            front: 'What is context switching in OS?',
            back: 'The process of saving the state of a CPU process and restoring a different process to resume execution.'
          },
          {
            front: 'What is starvation in CPU Scheduling?',
            back: 'A problem where low-priority processes get blocked indefinitely because higher-priority processes keep executing.'
          },
          {
            front: 'What is a page fault?',
            back: 'An interrupt triggered when a program attempts to access code in virtual memory that is not currently mapped in physical RAM.'
          }
        ]
      };
    }

    // 3. GENERAL FALLBACK TEMPLATE
    return {
      title: `Quiz: Conceptual Active Recall`,
      questions: [
        {
          type: 'MCQ',
          questionText: 'Which study method is scientifically proven to produce the highest long-term retention?',
          options: [
            'Rereading textbooks repeatedly',
            'Watching explanatory video lectures',
            'Active recall combined with Spaced Repetition',
            'Highlighting lines with multiple colors'
          ],
          correctAnswer: 'Active recall combined with Spaced Repetition',
          explanation: 'Testing your memory builds stronger neural pathways compared to passively consuming content.'
        },
        {
          type: 'MCQ',
          questionText: 'What is the "forgetting curve"?',
          options: [
            'A database corruption issue',
            'A mathematical model showing how memory retention declines over time if there is no attempt to retain it',
            'A symptom of studying too late',
            'A psychological blocks against difficult equations'
          ],
          correctAnswer: 'A mathematical model showing how memory retention declines over time if there is no attempt to retain it',
          explanation: 'Developed by Hermann Ebbinghaus, it shows memory decays rapidly unless reviewed at spaced intervals.'
        },
        {
          type: 'MCQ',
          questionText: 'How does teaching a concept to a companion or pet (e.g., Feynman Technique) improve understanding?',
          options: [
            'It provides social coins',
            'It forces you to simplify complex details and identify personal knowledge gaps',
            'It decreases active study time',
            'It removes the need for exams'
          ],
          correctAnswer: 'It forces you to simplify complex details and identify personal knowledge gaps',
          explanation: 'Explaining a topic simply reveals whether you actually understand the underlying principles.'
        },
        {
          type: 'SHORT',
          questionText: 'Describe active recall in your own words.',
          options: null,
          correctAnswer: 'Active recall involves actively retrieving information from memory (e.g. flashcards, self-testing) rather than passively re-reading or reviewing external materials.',
          explanation: 'It forces cognitive struggle, which solidifies long-term comprehension.'
        }
      ],
      flashcards: [
        {
          front: 'What is the spacing effect?',
          back: 'The phenomenon where learning is greater when studying is spread out over time, as opposed to cramming.'
        },
        {
          front: 'What is the Feynman Technique?',
          back: 'A study method where you explain a concept in simple terms, as if teaching it to a complete beginner.'
        },
        {
          front: 'Why does tab switching harm focus?',
          back: 'It incurs a cognitive switching cost, lowering comprehension efficiency and retention.'
        }
      ]
    };
  }
}
