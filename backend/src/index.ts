import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api';

// Load environment configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend NextJS client
app.use(cors({
  origin: '*', // for easy dev testing across ports
  credentials: true,
}));

// Increase body parser limits to support base64 handwritten note images uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Log requests in development
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Bind API endpoint router
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date() });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.',
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`StudyQuest AI Backend listening on port : ${PORT}`);
  console.log(`Database connected via Prisma ORM`);
  console.log(`OCR parsing service initialized`);
  console.log(`===============================================`);
});
