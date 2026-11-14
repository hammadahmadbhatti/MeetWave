.PHONY: dev build start stop logs clean migrate seed deploy

# Development
dev:
	docker compose up --build

dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev

# Production
build:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml build

start:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

stop:
	docker compose down

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

# Database
migrate:
	cd backend && npx prisma migrate dev

migrate-prod:
	docker compose exec backend npx prisma migrate deploy

seed:
	cd backend && npx prisma db seed

studio:
	cd backend && npx prisma studio

# Install
install:
	cd backend && npm install
	cd frontend && npm install

# Clean
clean:
	docker compose down -v
	rm -rf backend/dist backend/node_modules frontend/.next frontend/node_modules

# AWS Deployment
deploy-infra:
	aws cloudformation deploy \
		--template-file infrastructure/aws/cloudformation.yml \
		--stack-name meetwave-production \
		--capabilities CAPABILITY_IAM \
		--parameter-overrides Environment=production

push-images:
	docker build -f infrastructure/docker/Dockerfile.backend -t meetwave-backend .
	docker build -f infrastructure/docker/Dockerfile.frontend -t meetwave-frontend .
	aws ecr get-login-password | docker login --username AWS --password-stdin $(ECR_REGISTRY)
	docker tag meetwave-backend $(ECR_REGISTRY)/meetwave-backend:latest
	docker tag meetwave-frontend $(ECR_REGISTRY)/meetwave-frontend:latest
	docker push $(ECR_REGISTRY)/meetwave-backend:latest
	docker push $(ECR_REGISTRY)/meetwave-frontend:latest
