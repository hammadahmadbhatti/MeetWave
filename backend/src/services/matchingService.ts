import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../config/logger';
import { QueueEntry, MatchPreferences } from '../types';

const QUEUE_KEY = 'matching:queue';
const USER_DATA_PREFIX = 'matching:user:';
const ONLINE_COUNT_KEY = 'stats:online_count';

export class MatchingService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 50, 2000);
      },
    });
    this.redis.on('error', (err) => logger.error('Redis matching error:', err));
  }

  async addToQueue(entry: QueueEntry): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.zadd(QUEUE_KEY, entry.timestamp, entry.userId);
    pipeline.set(
      `${USER_DATA_PREFIX}${entry.userId}`,
      JSON.stringify(entry),
      'EX',
      300 // 5 min TTL
    );
    await pipeline.exec();
    logger.debug(`User ${entry.userId} added to queue`);
  }

  async removeFromQueue(userId: string): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.zrem(QUEUE_KEY, userId);
    pipeline.del(`${USER_DATA_PREFIX}${userId}`);
    await pipeline.exec();
    logger.debug(`User ${userId} removed from queue`);
  }

  async findMatch(userId: string, preferences: MatchPreferences): Promise<QueueEntry | null> {
    const queueMembers = await this.redis.zrange(QUEUE_KEY, 0, -1);

    for (const candidateId of queueMembers) {
      if (candidateId === userId) continue;

      const candidateData = await this.redis.get(`${USER_DATA_PREFIX}${candidateId}`);
      if (!candidateData) {
        await this.redis.zrem(QUEUE_KEY, candidateId);
        continue;
      }

      const candidate: QueueEntry = JSON.parse(candidateData);

      if (this.isCompatible(preferences, candidate)) {
        // Remove matched user from queue
        await this.removeFromQueue(candidateId);
        await this.removeFromQueue(userId);
        return candidate;
      }
    }

    return null;
  }

  private isCompatible(preferences: MatchPreferences, candidate: QueueEntry): boolean {
    // Check gender preference of requester
    if (preferences.gender && preferences.gender !== 'ANY' && candidate.gender) {
      if (candidate.gender !== preferences.gender) return false;
    }

    // Check country preference of requester
    if (preferences.country && candidate.country) {
      if (candidate.country !== preferences.country) return false;
    }

    // Check candidate's preferences against requester
    if (candidate.preferences.gender && candidate.preferences.gender !== 'ANY') {
      // Will be checked when the match is confirmed
    }

    return true;
  }

  async getQueueSize(): Promise<number> {
    return this.redis.zcard(QUEUE_KEY);
  }

  async incrementOnlineCount(): Promise<number> {
    return this.redis.incr(ONLINE_COUNT_KEY);
  }

  async decrementOnlineCount(): Promise<number> {
    const count = await this.redis.decr(ONLINE_COUNT_KEY);
    if (count < 0) {
      await this.redis.set(ONLINE_COUNT_KEY, 0);
      return 0;
    }
    return count;
  }

  async getOnlineCount(): Promise<number> {
    const count = await this.redis.get(ONLINE_COUNT_KEY);
    return parseInt(count || '0', 10);
  }

  async cleanup(): Promise<void> {
    await this.redis.quit();
  }
}

export const matchingService = new MatchingService();
