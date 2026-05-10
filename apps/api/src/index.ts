import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import savesRoutes from './routes/saves.routes';
import settlementRoutes from './routes/settlement.routes';
import legacyRoutes from './routes/legacy.routes';
import aiRoutes from './routes/ai.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Life Echo API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/saves', savesRoutes);
app.use('/api/saves', settlementRoutes);
app.use('/api/legacy', legacyRoutes);
app.use('/api/ai', aiRoutes);

// 全局错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
