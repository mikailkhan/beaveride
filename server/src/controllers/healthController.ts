import type { Request, Response } from 'express';
import { HealthService } from '../services/healthService.js';

export class HealthController {
  constructor(private readonly healthService = new HealthService()) {}

  getServerHealth = (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  };

  getApiHealth = async (_req: Request, res: Response) => {
    const health = await this.healthService.getApiHealth();
    res.status(health.status === 'ok' ? 200 : 503).json(health);
  };
}
