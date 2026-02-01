# Project Guide for Claude

## Your Rules
<!-- Add your project-specific rules, patterns, and conventions here -->

<!-- agentic-loop-detected -->
## Detected Project Info

- Runtime: Node.js
- Framework: Next.js
- Language: TypeScript
- Styling: Tailwind CSS

## Mamoji Project Structure

### Backend (api/)
- **Framework**: Spring Boot 3.5.3, Java 21
- **ORM**: MyBatis-Plus 3.5.5
- **Database**: MySQL 8.0 (Docker)
- **Cache**: Redis 7.x
- **Testing**: JUnit 5, Mockito

### Frontend (web/)
- **Framework**: Next.js 16, React 19
- **Language**: TypeScript
- **UI**: shadcn/ui, TailwindCSS
- **State**: Zustand
- **Testing**: Jest, React Testing Library

### Commands
```bash
# Backend
cd api && mvn compile           # Compile
cd api && mvn test              # Run tests (unit tests only)

# Frontend
cd web && npm run dev           # Development server
cd web && npm test              # Run tests
cd web && npm run type-check    # Type checking
```

### API Configuration
- **Backend URL**: http://localhost:48080
- **Frontend URL**: http://localhost:43000
- **API Base**: http://localhost:48080/api/v1

### Database (Docker)
- **MySQL**: host.docker.internal:3306, database: mamoji_test
- **Redis**: host.docker.internal:6379 (disabled for tests)

### Testing Notes
- Integration tests (Mapper/Service/Controller) require `@Import(TestSecurityConfig.class)`
- Redis is disabled for tests using `@Profile("!test")`
- JWT tests use ObjectProvider for optional RedisTemplate


*Auto-detected by agentic-loop. Edit freely.*
