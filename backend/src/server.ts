import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import stockRouter from './routes/stock';

const app = express();
const PORT = process.env.PORT ?? 3001;
const NODE_ENV = process.env.NODE_ENV ?? 'development';

// Security headers
app.use(helmet());

// CORS — allow configurable origins, default to localhost for dev
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((o) => o.trim());
app.use(cors({ origin: allowedOrigins }));

// Body parsing
app.use(express.json());

// Rate limiting — 30 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

// Routes
app.use('/api/stock', stockRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files in production
if (NODE_ENV === 'production') {
  const path = require('path');
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[${NODE_ENV}] Reverse FCF Backend running on port ${PORT}`);
});
