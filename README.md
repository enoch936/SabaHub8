# SabaHub8: Full-Stack Freelancer Marketplace Platform

## Overview

SabaHub8 is a comprehensive full-stack freelancer marketplace platform featuring a **Next.js 16** frontend and **Spring Boot 3.3** backend. It includes a complete OTP-based authentication system (email + SMS), role-based access control, and modern UI foundations.

## Project Structure

### Backend (`backend-spring/`)
- Spring Boot 3.3 application with **Java 21**
- **MongoDB** and **Redis** integration
- JWT-based authentication with OTP (email/SMS)
- REST APIs and WebSocket support
- Hybrid Python AI integration

### Frontend (`frontend/`)
- **Next.js 16** application with **React 19** and **Tailwind CSS**
- Modern admin dashboard with real-time streaming
- OTP registration and authentication flow
- Job marketplace with freelancer profiles
- Chat/messaging system for collaborations
- Comprehensive user dashboards for employers and freelancers

### AI and Automation
- **Python AI service** for intelligent job recommendations
- Content moderation and automated matching
- Smart job posting categorization
- AI-powered user recommendations

## Key Features

### Authentication & Security
- OTP verification via email and SMS
- JWT token-based authentication with role-based access
- Two-factor authentication support
- Session management and security best practices

### Job Marketplace
- Job posting and bidding system
- Freelancer profiles with portfolios
- Project-based and hourly rate options
- Real-time job matching recommendations

### Communication & Collaboration
- Real-time chat and messaging
- Stream/reel functionality for video content
- Social features for professional networking
- Notification center and alerts

### Admin & Operations
- Comprehensive admin dashboard with analytics
- User and content moderation
- Payment processing and management
- System monitoring and reporting

### Technology Stack
- **Frontend**: Next.js 16, React 18, TypeScript, Tailwind CSS, Material-UI
- **Backend**: Spring Boot 3.3, Java 21, MongoDB, Redis, JPA
- **AI Integration**: Python 3.x, Machine Learning models
- **WebSocket**: Real-time communication
- **DevOps**: Docker, GitHub Actions

## Quick Start Guide

### Prerequisites
- Java 21+
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional)

### Local Development

#### 1. Backend Setup
```bash
# From repository root:
./start-backend.sh
```

#### 2. Frontend Setup
```bash
cd frontend
pnpm install
pnpm dev
```

#### 3. Full Project Setup (Recommended)
```bash
# Start entire project with tmux
./start-main.sh
```

### Utility Scripts
- `status-main.sh` - Check project status
- `stop-main.sh` - Stop all services
- `setup-admin.sh` - Initialize admin accounts
- `setup-otp.sh` - Configure OTP services
- `test-backend.sh` - Run backend tests

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Jobs & Marketplace
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create job posting
- `GET /api/jobs/{id}` - Get specific job
- `POST /api/jobs/{id}/apply` - Apply for job

### Freelancer Profiles
- `GET /api/freelancer/profile/me` - Get freelancer profile
- `PUT /api/freelancer/profile` - Update profile
- `POST /api/freelancer/register` - Create freelancer profile

### Chats & Messaging
- `GET /api/chat/threads` - List chat threads
- `GET /api/chat/threads/{id}` - Get specific chat
- `POST /api/chat/threads/{id}/messages` - Send message

## System Architecture

### Backend Services
1. **Auth Service** - JWT token management and OTP verification
2. **Job Service** - Job posting and management
3. **Freelancer Service** - Freelancer profiles and portfolios
4. **Chat Service** - Real-time messaging
5. **AI Service** - Job recommendations and content intelligence

### Frontend Components
1. **Dashboard** - Main application layout and navigation
2. **Auth Flow** - Login, registration, and verification
3. **Job Marketplace** - Job search and browsing
4. **User Profiles** - Profile management and portfolios
5. **Live Streaming** - Real-time video content
6. **Admin Panel** - System administration and monitoring

### Data Flow
```
Frontend (Next.js) ←→ Backend APIs (Spring Boot)
                            ↓
                       MongoDB (User Data)
                            ↓
                       Redis (Session Cache)
                            ↓
                       Python AI Service (Recommendations)
```

## Development Setup

### Backend Development
```bash
cd backend-spring
mvn clean install
```

### Frontend Development
```bash
cd frontend
pnpm install  # Install dependencies
pnpm dev      # Start development server
pnpm build   # Build for production
```

## Project Configuration

### Environment Variables
Create `.env` file in `backend-spring/`:
```env
SPRING_DATA_MONGODB_URI=mongodb://localhost:27017/sabahub
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-jwt-secret-key-here
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-email-password
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_VERIFY_SERVICE_SID=your-twilio-verify-service-id
```

### Frontend Environment
Create `.env.local` file in `frontend/`:
```env
NEXT_PUBLIC_API_BASE=http://localhost:8080
NEXT_PUBLIC_WS_ENDPOINT=ws://localhost:8080
NEXT_PUBLIC_APP_ENV=development
```

## Testing

### Backend Tests
```bash
./test-backend.sh
```

### API Testing
- Postman collections available in root directory
- API documentation at `/swagger-ui.html`

## Deployment

### Docker Deployment
```bash
cd backend-spring
docker compose up --build
```

### Production Deployment
- CI/CD pipeline configured for GitHub Actions
- Docker images built and pushed to Docker Hub
- Environment-specific configurations

## Key Benefits

### For Users
- **Verified Profiles**: Professional authentication and background verification
- **Secure Payments**: Escrow system protecting both parties
- **Smart Matching**: AI-powered job recommendations
- **Real-time Communication**: Instant messaging and collaboration

### For Freelancers
- **Global Reach**: Access to international job market
- **Flexible Work**: Choose projects that match your skills and schedule
- **Professional Platform**: Clean, modern interface
- **Built-in Analytics**: Track performance and earnings

### For Employers
- **Quality Talent**: Verified freelancer profiles
- **Efficient Hiring**: Streamlined application and interview process
- **Cost Control**: Transparent pricing and budget management
- **Advanced Tools**: Analytics and reporting

## Security

### Authentication
- JWT-based token authentication
- OTP verification for sensitive operations
- Role-based access control (Admin, Employer, Freelancer)

### Data Protection
- MongoDB encryption for sensitive data
- Regular security audits
- API rate limiting and DDoS protection
- Secure password storage with bcrypt

### Compliance
- GDPR compliant data handling
- Regular security updates
- Privacy policy and terms of service

## Support & Documentation

### Technical Support
- Issue tracking via GitHub
- Documentation in this README
- API documentation at `/swagger-ui.html`

### Community
- GitHub Discussions
- Stack Overflow tagged questions
- Slack/ Discord communities (if available)

## Code Quality

### Standards
- **Backend**: Java best practices, SOLID principles
- **Frontend**: React hooks, TypeScript strict mode
- **Documentation**: Comprehensive docstrings and comments
- **Testing**: Unit and integration tests

### CI/CD Pipeline
- Automated testing on every pull request
- Security scanning
- Production deployment with blue-green strategy

## Future Roadmap

### Phase 1: Core Features (Completed)
- User authentication and profiles
- Job marketplace
- Basic messaging

### Phase 2: Advanced Features (In Development)
- Advanced AI matching algorithms
- Video streaming and reels
- Freelance skill assessment

### Phase 3: Enterprise Features (Planned)
- Enterprise client tools
- Advanced analytics
- Integration partnerships

## License

MIT License

Copyright (c) 2026 SabaHub Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT of OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Contributing

### Contribution Guidelines
1. Fork the repository
2. Create a feature branch
3. Follow the code style guidelines
4. Write tests for new functionality
5. Submit a pull request

### Code of Conduct
Please treat everyone with respect and follow the established community guidelines.

## Acknowledgements

Special thanks to:
- Open source contributors
- AI and machine learning communities
- Database and cloud providers
- Community members and early adopters

---

*This project is built with ❤️ and aims to provide a comprehensive, secure, and user-friendly freelancer marketplace platform.*

**For more information, visit our GitHub repository or contribute to making the platform better!**
