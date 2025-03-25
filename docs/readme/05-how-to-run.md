# How to Run the Project

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

1. Copy the `.env.example` file to `.env`
2. Fill in the required environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file with your specific configuration:
- `APP_PORT`: Application port
- `NODE_ENV`: Environment (development, production)
- `DATABASE_URL`: Database connection string
- `POSTGRES_USER`: Database username
- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_DB`: Database name
- `APP_DB_PORT`: Database port
- `JWT_SECRET_KEY`: Secret key for JWT tokens

### 4. Database Migrations

**Important:** You must run Prisma migrations to set up your database schema:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

## Running the Application

### Option 1: Local Development

```bash
# Start the development server
npm run start:dev
```

### Option 2: Docker Compose (Recommended)

#### Running with Docker

Docker setup will automatically run migrations during container startup.

```bash
# Build and start the services
make build
make up

# Alternative Docker Compose command
docker-compose up -d
```

#### Docker Compose Services
- `db`: PostgreSQL database
- `app`: NestJS application

### Useful Docker Commands

```bash
# View running containers
docker-compose ps

# View logs
make logs
# or
docker-compose logs -f

# Stop services
make down
# or
docker-compose down

# Clean up containers and volumes
make clean
# or
docker-compose down --volumes --remove-orphans
```

## Accessing the Application

- API: `http://localhost:${APP_PORT}`
- Swagger Documentation: `http://localhost:${APP_PORT}/api/docs`

## Stopping the Application

### Local Development
- Press `Ctrl+C` in the terminal running the application

### Docker
```bash
make down
# or
docker-compose down
```