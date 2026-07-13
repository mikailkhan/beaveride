import { HealthRepository } from '../repositories/healthRepository.js';

export interface ApiHealth {
  status: 'ok' | 'error';
  database: 'ok' | 'error';
  timestamp: string;
}

export class HealthService {
  constructor(private readonly healthRepository = new HealthRepository()) {}

  async getApiHealth(): Promise<ApiHealth> {
    try {
      await this.healthRepository.checkDatabase();

      return {
        status: 'ok',
        database: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'error',
        database: 'error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
