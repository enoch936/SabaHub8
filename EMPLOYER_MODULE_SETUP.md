# 📦 Employer Module Dependencies Installation Guide

## Backend Dependencies (Spring Boot)

Add these to your `pom.xml`:

```xml
<!-- Stripe Payment Processing -->
<dependency>
    <groupId>com.stripe</groupId>
    <artifactId>stripe-java</artifactId>
    <version>24.18.0</version>
</dependency>

<!-- MongoDB (Already included) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-mongodb</artifactId>
</dependency>

<!-- Spring Security (Already included) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- Lombok (Already included) -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>

<!-- Validation -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

## Frontend Dependencies (Next.js)

Install with npm/pnpm/yarn:

```bash
# Navigate to frontend directory
cd frontend

# Install required packages
pnpm install framer-motion recharts lucide-react

# Or with npm
npm install framer-motion recharts lucide-react

# Or with yarn
yarn add framer-motion recharts lucide-react
```

### Package Details:
- **framer-motion**: Animations & transitions
- **recharts**: Charts & data visualization
- **lucide-react**: Beautiful icons

## Environment Variables

### Backend (`application.properties` or `.env`)

```properties
# Stripe Configuration
stripe.api.key=sk_test_YOUR_STRIPE_SECRET_KEY
stripe.platform.account.id=acct_YOUR_PLATFORM_ACCOUNT_ID

# MongoDB (Already configured)
spring.data.mongodb.uri=mongodb+srv://username:password@cluster.mongodb.net/sabahub?retryWrites=true&w=majority

# JWT (Already configured)
jwt.secret=your_jwt_secret_key_here
jwt.expiration=86400000

# Twilio (Already configured)
twilio.account.sid=YOUR_TWILIO_ACCOUNT_SID
twilio.auth.token=YOUR_TWILIO_AUTH_TOKEN
twilio.phone.number=+1234567890
```

### Frontend (`.env.local`)

```bash
# API Base URL
NEXT_PUBLIC_API_URL=http://localhost:8080
# or for production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Stripe Public Key (for frontend payment forms)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY
```

## Stripe Setup (Production)

### 1. Create Stripe Account
1. Go to [stripe.com](https://stripe.com)
2. Sign up for an account
3. Complete business verification

### 2. Get API Keys
1. Dashboard → Developers → API Keys
2. Copy **Secret Key** (starts with `sk_live_` or `sk_test_`)
3. Copy **Publishable Key** (starts with `pk_live_` or `pk_test_`)

### 3. Enable Connect (for escrow/marketplace)
1. Dashboard → Connect → Get Started
2. Set up your platform details
3. Configure onboarding settings
4. Copy **Platform Account ID**

### 4. Webhook Setup
1. Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `transfer.completed`
   - `transfer.failed`
   - `account.updated`
   - `charge.dispute.created`
4. Copy **Webhook Secret** (starts with `whsec_`)

## MongoDB Indexes (Performance)

Run these commands in MongoDB Compass or shell:

```javascript
// Employers collection
db.employers.createIndex({ userId: 1 }, { unique: true });
db.employers.createIndex({ kycStatus: 1 });
db.employers.createIndex({ industry: 1 });
db.employers.createIndex({ rating: -1 });
db.employers.createIndex({ companyName: "text" });

// Projects collection
db.projects.createIndex({ employerId: 1 });
db.projects.createIndex({ status: 1 });
db.projects.createIndex({ category: 1 });
db.projects.createIndex({ visibility: 1 });
db.projects.createIndex({ requiredSkills: 1 });
db.projects.createIndex({ title: "text", description: "text" });
db.projects.createIndex({ createdAt: -1 });

// Contracts collection
db.contracts.createIndex({ employerId: 1 });
db.contracts.createIndex({ freelancerId: 1 });
db.contracts.createIndex({ projectId: 1 });
db.contracts.createIndex({ status: 1 });
db.contracts.createIndex({ "paymentMilestones.status": 1 });

// Proposals collection
db.proposals.createIndex({ projectId: 1 });
db.proposals.createIndex({ freelancerId: 1 });
db.proposals.createIndex({ status: 1 });
db.proposals.createIndex({ { projectId: 1, freelancerId: 1 }, { unique: true } });
```

## Build & Run

### Backend (Spring Boot)

```bash
cd backend-spring

# Build
./mvnw clean install

# Run
./mvnw spring-boot:run

# Or with Docker
docker build -t sabahub-backend .
docker run -p 8080:8080 sabahub-backend
```

### Frontend (Next.js)

```bash
cd frontend

# Install dependencies
pnpm install

# Development mode
pnpm dev

# Production build
pnpm build
pnpm start

# Or with Docker
docker build -t sabahub-frontend .
docker run -p 3000:3000 sabahub-frontend
```

## Testing the Endpoints

### Using cURL:

```bash
# 1. Login as Employer
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employer@example.com",
    "password": "password123"
  }'

# Save the JWT token from response

# 2. Create Employer Profile
curl -X POST http://localhost:8080/api/employer/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "companyName": "Tech Corp",
    "companyDescription": "Leading tech company",
    "industry": "Technology",
    "teamSize": 50,
    "website": "https://techcorp.com"
  }'

# 3. Post a Project
curl -X POST http://localhost:8080/api/employer/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Build React Dashboard",
    "description": "Need a responsive dashboard with charts",
    "category": "WEB_DEVELOPMENT",
    "budgetType": "FIXED_PRICE",
    "budget": 5000,
    "currency": "USD",
    "requiredSkills": ["React", "TypeScript", "Tailwind CSS"],
    "experienceLevel": "INTERMEDIATE",
    "projectScope": "MEDIUM",
    "visibility": "PUBLIC",
    "deadline": "2024-12-31T23:59:59"
  }'

# 4. Get Analytics
curl -X GET http://localhost:8080/api/employer/analytics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman:

1. Import the collection: `OTP_API_Postman_Collection.json`
2. Set environment variables:
   - `base_url`: `http://localhost:8080`
   - `token`: Your JWT token
3. Test all employer endpoints

## Troubleshooting

### Common Issues:

1. **Stripe Error: "No API key provided"**
   - Solution: Add `stripe.api.key` to `application.properties`
   - Make sure it starts with `sk_test_` or `sk_live_`

2. **MongoDB Connection Failed**
   - Solution: Check MongoDB URI in `application.properties`
   - Verify IP whitelist in MongoDB Atlas

3. **CORS Error on Frontend**
   - Solution: Add CORS configuration in Spring Boot:
   ```java
   @Configuration
   public class WebConfig {
       @Bean
       public WebMvcConfigurer corsConfigurer() {
           return new WebMvcConfigurer() {
               @Override
               public void addCorsMappings(CorsRegistry registry) {
                   registry.addMapping("/api/**")
                       .allowedOrigins("http://localhost:3000")
                       .allowedMethods("GET", "POST", "PUT", "DELETE");
               }
           };
       }
   }
   ```

4. **JWT Token Expired**
   - Solution: Re-login to get a new token
   - Increase `jwt.expiration` in properties (default: 24 hours)

5. **Animations Not Smooth**
   - Solution: Check browser performance
   - Disable animations in `framer-motion` if needed:
   ```tsx
   <motion.div
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     transition={{ duration: 0.3 }}
   >
   ```

## Production Checklist

Before deploying to production:

- [ ] Switch Stripe from test to live keys
- [ ] Set strong JWT secret (64+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure MongoDB Atlas production cluster
- [ ] Set up Stripe webhooks with production URL
- [ ] Add rate limiting on API endpoints
- [ ] Enable API request logging
- [ ] Set up error tracking (Sentry)
- [ ] Configure CDN for frontend assets
- [ ] Add database backups
- [ ] Set up monitoring (New Relic, DataDog)
- [ ] Configure load balancer
- [ ] Enable Redis caching for analytics

## Next Steps

1. **Test all endpoints** with Postman/cURL
2. **Create seed data** for development
3. **Add integration tests** for critical flows
4. **Deploy to staging** environment
5. **Perform load testing** (1000+ concurrent users)
6. **Deploy to production** 🚀

---

**Need Help?** Check the main documentation:
- [EMPLOYER_MODULE_COMPLETE.md](./EMPLOYER_MODULE_COMPLETE.md)
- [OTP_IMPLEMENTATION_SUMMARY.md](./OTP_IMPLEMENTATION_SUMMARY.md)
- [ENTERPRISE_ARCHITECTURE.md](./ENTERPRISE_ARCHITECTURE.md)
