import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './db.js';
import authRoutes from './routes/auth.js';
import manufacturingRoutes from './routes/manufacturing.js';
import inventoryRoutes from './routes/inventory.js';
import crmRoutes from './routes/crm.js';
import hrmsRoutes from './routes/hrms.js';
import reportsRoutes from './routes/reports.js';
import searchRoutes from './routes/search.js';
import notificationsRoutes from './routes/notifications.js';
import auditRoutes from './routes/audit.js';
import orgRoutes from './routes/organization.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

const ALLOWED_ORIGINS = Array.from(
  new Set([
    ...DEFAULT_ALLOWED_ORIGINS,
    ...(process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean),
  ])
);

const isAllowedOrigin = (origin: string) => {
  if (!origin) return true;

  const normalizedOrigin = origin.replace(/\/$/, '');
  if (ALLOWED_ORIGINS.includes(normalizedOrigin)) return true;

  try {
    const { protocol, hostname, port } = new URL(normalizedOrigin);
    const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
    const devPorts = new Set(['5173', '5174', '4173', '3000', '8080']);
    const allowedProductionHosts = ['.vercel.app', '.netlify.app'];

    const isTrustedProductionHost = allowedProductionHosts.some((suffix) => hostname.endsWith(suffix));

    return (
      (protocol === 'http:' || protocol === 'https:') &&
      (
        (localHosts.has(hostname) && (port === '' || devPorts.has(port))) ||
        isTrustedProductionHost
      )
    );
  } catch {
    return false;
  }
};

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. server-to-server, Postman)
    if (!origin) return callback(null, true);
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

// Request logger for visibility
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', platform: 'Lumirise ERP Core API', version: '1.0.0' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.message, platform: 'Lumirise ERP Core API', version: '1.0.0' });
  }
});

// Domain Routes
app.use('/api/auth', authRoutes);
app.use('/api/manufacturing', manufacturingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/hrms', hrmsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/organization', orgRoutes);

// Global Error Handler - Sanitized for Enterprise Security & User-Friendly UX
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Enterprise Error Handler]', err);

  // Prisma Unique Constraint Violation
  if (err.code === 'P2002') {
    const fields = err.meta?.target ? (Array.isArray(err.meta.target) ? err.meta.target.join(', ') : err.meta.target) : 'field';
    return res.status(409).json({
      message: `A record with this ${fields} already exists. Please choose another value.`,
      code: 'DUPLICATE_RESOURCE',
    });
  }

  // Prisma Foreign Key Constraint Violation
  if (err.code === 'P2003') {
    return res.status(400).json({
      message: 'This operation references data that does not exist or has active dependencies.',
      code: 'CONSTRAINT_VIOLATION',
    });
  }

  // Prisma Record Not Found
  if (err.code === 'P2025') {
    return res.status(404).json({
      message: 'The requested resource was not found.',
      code: 'NOT_FOUND',
    });
  }

  // 403 Forbidden
  if (err.status === 403 || err.statusCode === 403) {
    return res.status(403).json({
      message: err.message || "You don't have permission to perform this action.",
      code: 'FORBIDDEN',
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    message: statusCode === 500 ? 'An unexpected system error occurred. Please try again later.' : (err.message || 'Error occurred'),
    code: err.code || 'SERVER_ERROR',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Lumirise Enterprise API running on http://localhost:${PORT}`);
});

// Export for Vercel serverless deployment
export default app;
