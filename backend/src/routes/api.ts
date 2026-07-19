import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { SessionController } from '../controllers/session.controller';
import { TopicController } from '../controllers/topic.controller';
import { GamificationController } from '../controllers/gamification.controller';
import { QuizController } from '../controllers/quiz.controller';
import { JournalController } from '../controllers/journal.controller';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// ================= AUTH ROUTES =================
router.post('/auth/signup', AuthController.signup);
router.post('/auth/login', AuthController.login);
router.get('/auth/profile', authenticateToken, AuthController.getProfile);

// ================= SESSION ROUTES =================
router.post('/session/start', authenticateToken, SessionController.startSession);
router.patch('/session/:sessionId', authenticateToken, SessionController.updateSession);
router.post('/session/:sessionId/end', authenticateToken, SessionController.endSession);
router.get('/session/history', authenticateToken, SessionController.getHistory);

// ================= TOPIC & NOTES ROUTES =================
router.post('/topic', authenticateToken, TopicController.createTopic);
router.get('/topic', authenticateToken, TopicController.getTopics);
router.post('/topic/note', authenticateToken, TopicController.createNote);
router.post('/topic/ocr', authenticateToken, TopicController.uploadNotebookOCR);

// ================= GAMIFICATION STORE & VILLAGE ROUTES =================
router.get('/gamification/store', authenticateToken, GamificationController.getStoreItems);
router.post('/gamification/purchase', authenticateToken, GamificationController.purchaseItem);
router.get('/gamification/placements', authenticateToken, GamificationController.getVillagePlacements);
router.post('/gamification/placements', authenticateToken, GamificationController.updateVillagePlacements);

// ================= QUIZ & FLASHCARDS ROUTES =================
router.post('/quiz/generate', authenticateToken, QuizController.generateQuizForNote);
router.post('/quiz/submit', authenticateToken, QuizController.submitQuizScore);
router.get('/quiz/flashcards', authenticateToken, QuizController.getFlashcards);
router.post('/quiz/flashcards/review', authenticateToken, QuizController.reviewFlashcard);

// ================= JOURNAL ROUTES =================
router.post('/journal', authenticateToken, JournalController.createJournalEntry);
router.get('/journal', authenticateToken, JournalController.getJournalEntries);

// ================= ANALYTICS ROUTES =================
router.get('/analytics', authenticateToken, AnalyticsController.getDashboardAnalytics);

export default router;
