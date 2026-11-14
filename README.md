# MeetWave - Random Video Chat Platform

A production-ready random video chat application inspired by Ome.TV, built with modern web technologies and designed for AWS deployment.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Nginx (Reverse Proxy)             │
│                    SSL / Rate Limiting               │
├────────────────────┬────────────────────────────────┤
│                    │                                │
│  Frontend          │  Backend                       │
│  (Next.js 14)      │  (Express + Socket.IO)         │
│  Port 3000         │  Port 3001                     │
│                    │                                │
│  - Landing Page    │  - REST API (/api/*)           │
│  - Video Chat UI   │  - WebSocket Signaling         │
│  - WebRTC Client   │  - Matching Engine             │
│                    │  - Auth (JWT)                  │
│                    │                                │
├────────────────────┴────────────────────────────────┤
│                                                      │
│  PostgreSQL          Redis           Coturn (TURN)   │
│  (Users, Reports,    (Match Queue,   (NAT Traversal  │
│   Chat Sessions)     Online Count)   for WebRTC)     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Frontend       | Next.js 14, TypeScript, Tailwind CSS |
| State          | Zustand                             |
| Real-time      | Socket.IO, WebRTC                   |
| Backend        | Express, TypeScript                 |
| Database       | PostgreSQL + Prisma ORM             |
| Cache/Queue    | Redis                               |
| TURN Server    | Coturn                              |
| Proxy          | Nginx                               |
| Infrastructure | Docker, AWS (ECS Fargate, RDS, ElastiCache) |

## Features

- Random video chat matching with gender/country preferences
- Peer-to-peer WebRTC video with STUN/TURN support
- Real-time text chat alongside video
- Guest login (no registration required)
- User reporting and auto-ban system
- Online user counter
- Mobile-responsive dark UI
- Production Docker containers with multi-stage builds
- AWS CloudFormation infrastructure template
- Rate limiting, security headers, graceful shutdown

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15 (or use Docker)
- Redis 7 (or use Docker)

### Development (with Docker)

```bash
# 1. Clone and setup
cp .env.example .env  # Edit with your values

# 2. Start all services
make dev

# 3. Access
# Frontend: http://localhost:3000
# Backend:  http://localhost:4000
# Via Nginx: http://localhost:80
```

### Development (without Docker)

```bash
# 1. Install dependencies
make install

# 2. Setup database
cd backend
cp ../.env.example .env  # Configure DATABASE_URL
npx prisma migrate dev
npx prisma generate

# 3. Run services (separate terminals)
make dev-backend   # Terminal 1
make dev-frontend  # Terminal 2
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | Required |
| `PORT` | Backend port | `4000` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `TURN_SERVER_URL` | TURN server address | - |
| `TURN_CREDENTIAL` | TURN shared secret | - |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | `http://localhost:4000/api` |
| `NEXT_PUBLIC_SOCKET_URL` | Frontend WebSocket URL | `http://localhost:4000` |

## AWS Deployment

### 1. Deploy Infrastructure

```bash
# Set up SSM parameters first
aws ssm put-parameter --name /meetwave/db/username --value "admin" --type String
aws ssm put-parameter --name /meetwave/db/password --value "secure-pass" --type SecureString
aws ssm put-parameter --name /meetwave/jwt-secret --value "your-secret" --type SecureString

# Deploy CloudFormation stack
make deploy-infra
```

### 2. Push Docker Images

```bash
# Create ECR repositories
aws ecr create-repository --repository-name meetwave-backend
aws ecr create-repository --repository-name meetwave-frontend

# Build and push
ECR_REGISTRY=<account-id>.dkr.ecr.<region>.amazonaws.com make push-images
```

### 3. Create ECS Services

```bash
aws ecs create-service \
  --cluster meetwave-production \
  --service-name meetwave-backend \
  --task-definition meetwave-backend \
  --desired-count 2 \
  --launch-type FARGATE
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/guest` | Guest login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/chat/active` | Get active chat session |
| GET | `/api/chat/:id/messages` | Get chat messages |
| POST | `/api/reports` | Report a user |
| GET | `/api/turn/credentials` | Get TURN credentials |
| GET | `/api/stats` | Get online stats |
| GET | `/api/health` | Health check |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-queue` | Client -> Server | Join matching queue |
| `leave-queue` | Client -> Server | Leave queue |
| `match-found` | Server -> Client | Matched with peer |
| `webrtc-offer` | Bidirectional | SDP offer relay |
| `webrtc-answer` | Bidirectional | SDP answer relay |
| `webrtc-ice-candidate` | Bidirectional | ICE candidate relay |
| `chat-message` | Bidirectional | Text chat message |
| `next-partner` | Client -> Server | Skip to next |
| `partner-disconnected` | Server -> Client | Peer left |
| `online-count` | Server -> Client | Live user count |
| `report-user` | Client -> Server | Report partner |

## License

MIT
