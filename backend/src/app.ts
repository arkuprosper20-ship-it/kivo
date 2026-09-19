import cors from 'cors';
import express from 'express';
import { config } from './config';
import { errorHandler, notFound } from './middleware/errorHandler';
import { buildRouter } from './routes';

export function buildApp() {
  const app = express();
  app.use(cors({ origin: [config.frontendOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'] }));
  app.use(express.json({ limit: '256kb' }));

  app.use('/api', buildRouter());
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
