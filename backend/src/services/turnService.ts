import crypto from 'crypto';
import { config } from '../config';
import { TurnCredentials } from '../types';

export class TurnService {
  getCredentials(): TurnCredentials {
    if (config.turn.serverUrl) {
      return this.generateTempCredentials();
    }
    // Fallback to free STUN servers
    return {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
      ],
      username: '',
      credential: '',
      ttl: 86400,
    };
  }

  private generateTempCredentials(): TurnCredentials {
    const ttl = 86400; // 24 hours
    const timestamp = Math.floor(Date.now() / 1000) + ttl;
    const username = `${timestamp}:ometv-user`;
    const hmac = crypto.createHmac('sha1', config.turn.credential);
    hmac.update(username);
    const credential = hmac.digest('base64');

    return {
      urls: [
        `turn:${config.turn.serverUrl}:3478?transport=udp`,
        `turn:${config.turn.serverUrl}:3478?transport=tcp`,
        `turns:${config.turn.serverUrl}:5349?transport=tcp`,
      ],
      username,
      credential,
      ttl,
    };
  }
}

export const turnService = new TurnService();
