# Shareline - File Upload & Sharing Server

A full-stack file upload and sharing application built with Spring Boot and React. Features Google OAuth authentication, file upload/download, and public file sharing with expiration dates.

## Features

- 🔐 Google OAuth2 authentication
- 📤 File upload (up to 100MB)
- 📥 File download
- 🔗 Public file sharing with unique URLs
- ⏰ Share link expiration dates
- 🗄️ PostgreSQL database for metadata storage
- 🐳 Docker Compose deployment

## Technology Stack

- **Backend**: Spring Boot 3.2.0, Spring Security OAuth2, Spring Data JPA
- **Frontend**: React 18, Vite
- **Database**: PostgreSQL 15
- **Build Tool**: Maven (with frontend-maven-plugin)
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Docker and Docker Compose installed
- Google OAuth2 credentials (Client ID and Client Secret)

## Setup Instructions

### 1. Get Google OAuth2 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen
6. Create a Web application client ID
7. Add authorized redirect URIs:
   - `http://localhost:8080/login/oauth2/code/google` (for local development)
   - `http://your-domain:8080/login/oauth2/code/google` (for production)
8. Copy the Client ID and Client Secret

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
POSTGRES_DB=shareline
POSTGRES_USER=shareline
POSTGRES_PASSWORD=your-secure-password
```

### 3. Build and Run with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

The application will be available at `http://localhost:8080`

### 4. Access the Application

1. Open your browser and navigate to `http://localhost:8080`
2. Click "Sign in with Google"
3. Authenticate with your Google account
4. Start uploading and sharing files!

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user information

### File Management (Authenticated)
- `POST /api/files/upload` - Upload a file
- `GET /api/files` - List user's files
- `GET /api/files/{id}` - Download a file
- `DELETE /api/files/{id}` - Delete a file

### Public Sharing
- `POST /api/files/{id}/share` - Create a share link
- `DELETE /api/files/{id}/share` - Revoke a share link
- `GET /api/share/{token}` - Download shared file (public)
- `GET /api/share/{token}/info` - Get shared file info (public)

## Project Structure

```
shareline/
├── src/main/java/com/shareline/
│   ├── config/          # Security and web configuration
│   ├── controller/      # REST controllers
│   ├── entity/          # JPA entities
│   ├── repository/      # JPA repositories
│   ├── service/         # Business logic
│   └── dto/             # Data transfer objects
├── src/main/resources/
│   ├── db/migration/    # Flyway migrations
│   └── static/          # React build output
├── frontend/            # React application
├── pom.xml             # Maven configuration
├── Dockerfile          # Docker build instructions
└── docker-compose.yml  # Docker Compose configuration
```

## Development

### Running Locally (without Docker)

1. **Start PostgreSQL**:
   ```bash
   docker run -d \
     --name shareline-postgres \
     -e POSTGRES_DB=shareline \
     -e POSTGRES_USER=shareline \
     -e POSTGRES_PASSWORD=shareline \
     -p 5432:5432 \
     postgres:15-alpine
   ```

2. **Set environment variables**:
   ```bash
   export GOOGLE_CLIENT_ID=your-client-id
   export GOOGLE_CLIENT_SECRET=your-client-secret
   ```

3. **Build frontend**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

4. **Run Spring Boot**:
   ```bash
   mvn spring-boot:run
   ```

### Building Frontend Separately

```bash
cd frontend
npm install
npm run dev  # Development server with hot reload
npm run build  # Production build (outputs to src/main/resources/static)
```

## Docker Volumes

- `postgres_data`: Persistent PostgreSQL database storage
- `file_uploads`: Persistent file storage

## Configuration

### Application Properties

- `shareline.upload-dir`: Directory for file storage (default: `./uploads`)
- `shareline.base-url`: Base URL for share links (default: `http://localhost:8080`)
- `spring.servlet.multipart.max-file-size`: Maximum file size (default: 100MB)

### Database Connection

In Docker, the application connects to PostgreSQL using the service name `postgres` on port `5432`. The connection is configured automatically via environment variables.

## Troubleshooting

### OAuth Login Not Working

- Verify your Google OAuth credentials are correct
- Check that redirect URI matches exactly in Google Cloud Console
- Ensure the application is accessible at the configured URL

### Database Connection Issues

- Verify PostgreSQL container is running: `docker-compose ps`
- Check database logs: `docker-compose logs postgres`
- Ensure environment variables are set correctly

### File Upload Fails

- Check file size (max 100MB)
- Verify upload directory has write permissions
- Check application logs: `docker-compose logs app`

## License

MIT License

