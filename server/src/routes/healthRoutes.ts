import { Router } from 'express';
import { HealthController } from '../controllers/healthController.js';

const healthController = new HealthController();

export const healthRoutes = Router();

healthRoutes.get('/health', healthController.getApiHealth);

export const rootHealthRoutes = Router();

rootHealthRoutes.get('/health', healthController.getServerHealth);
