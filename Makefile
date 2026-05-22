.PHONY: dev db migrate seed stop logs install build clean

install:
	cd backend && npm install
	cd frontend && npm install

db:
	docker-compose up -d postgres redis

migrate:
	cd backend && npx prisma migrate dev --name init

seed:
	cd backend && npx prisma db seed

dev:
	docker-compose up -d
	@echo "Waiting for services..."
	@sleep 3
	@echo "Start backend: cd backend && npm run dev"
	@echo "Start frontend: cd frontend && npm run dev"

stop:
	docker-compose down

logs:
	docker-compose logs -f

build:
	cd backend && npm run build
	cd frontend && npm run build

clean:
	docker-compose down -v
	rm -rf backend/node_modules frontend/node_modules
	rm -rf backend/dist frontend/dist
