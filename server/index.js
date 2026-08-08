import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Routes
import uploadRoutes from './routes/upload.js';
import level1Routes from './routes/level1.js';
import level2Routes from './routes/level2.js';
import level3Routes from './routes/level3.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/level1', level1Routes);
app.use('/api/level2', level2Routes);
app.use('/api/level3', level3Routes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      tavily: !!process.env.TAVILY_API_KEY,
    },
  });
});

// Serve frontend build in production
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
  });
});

app.listen(PORT, () => {
  console.log(`\n🎯 AI Career Coach Server running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
});

export default app;
