import { Router } from 'express';
import { metricsService } from '../utils/metricsService.js';

export const adminRoutes = Router();

adminRoutes.get('/admin/metrics', (req, res) => {
  res.json({
    status: 'success',
    data: metricsService.getMetrics(),
  });
});
