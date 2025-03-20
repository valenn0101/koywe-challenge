# How to Run the Project

## Prerequisites

- Node.js (v20.18.1 or later)
- npm
- Docker (optional, but recommended)
- Docker Compose (optional, but recommended)

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

## Running the Application

### Option 1: Local Development

```bash
# Start the development server
npm run start:dev
```

### Option 2: Docker Compose (Recommended)

#### Prerequisites
- Docker
- Docker Compose

#### Running with Docker

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

- Local: `http://localhost:${APP_PORT}`
- Docker: `http://localhost:${APP_PORT}`

## Stopping the Application

### Local Development
- Press `Ctrl+C` in the terminal running the application

### Docker
```bash
make down
# or
docker-compose down
```

## Troubleshooting

- Ensure all environment variables are correctly set
- Check Docker and Docker Compose are installed and running
- Verify no other services are using the specified ports