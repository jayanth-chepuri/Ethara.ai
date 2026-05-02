# Smart Expense Tracker with Analytics

A full-stack web application for tracking expenses with real-time analytics, smart insights, and budget management.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Chart.js, Axios, React Router v6 |
| Backend | Spring Boot 3.2, Spring Security, JWT |
| Database | MySQL 8.0 |
| ORM | JPA / Hibernate |
| Docs | Springdoc OpenAPI (Swagger) |
| Export | Apache POI (Excel), iText (PDF) |
| Container | Docker, Docker Compose |

---

## Project Structure

```
├── jayanth/                          # Spring Boot Backend
│   ├── src/main/java/com/Ethara/jayanth/
│   │   ├── config/                   # Security & Swagger config
│   │   ├── controller/               # REST controllers
│   │   ├── dto/                      # Request/Response DTOs
│   │   ├── entity/                   # JPA entities
│   │   ├── exception/                # Global exception handling
│   │   ├── repository/               # Spring Data JPA repos
│   │   ├── security/                 # JWT utils & filters
│   │   └── service/                  # Business logic
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── db/init.sql               # Database schema
│   ├── Dockerfile
│   └── pom.xml
│
├── expense-tracker-frontend/         # React Frontend
│   ├── src/
│   │   ├── components/               # Reusable components
│   │   ├── context/                  # Auth context
│   │   ├── pages/                    # Page components
│   │   └── services/                 # API service layer
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
└── README.md
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT token |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | Get expenses (paginated, filterable) |
| GET | `/api/expenses/{id}` | Get expense by ID |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/{id}` | Update expense |
| DELETE | `/api/expenses/{id}` | Delete expense |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/monthly` | Monthly summary + bar chart data |
| GET | `/api/analytics/category` | Category breakdown + pie chart data |
| GET | `/api/analytics/trends` | Daily/weekly trends + predictions |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/budgets` | Set/update monthly budget |
| GET | `/api/budgets/{month}/{year}` | Get budget for month |
| GET | `/api/budgets/year/{year}` | Get all budgets for year |
| DELETE | `/api/budgets/{id}` | Delete budget |

### Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export/excel` | Export to Excel |
| GET | `/api/export/pdf` | Export to PDF |

---

## Running Locally

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8.0
- Maven 3.9+

### 1. Database Setup

```sql
CREATE DATABASE expense_tracker;
```

Or run the init script:
```bash
mysql -u root -p < jayanth/src/main/resources/db/init.sql
```

### 2. Backend

Update `jayanth/src/main/resources/application.properties` with your MySQL credentials:

```properties
spring.datasource.username=your_username
spring.datasource.password=your_password
```

Then run:
```bash
cd jayanth
mvn clean install
mvn spring-boot:run
```

Backend starts at: http://localhost:8080  
Swagger UI: http://localhost:8080/swagger-ui.html

### 3. Frontend

```bash
cd expense-tracker-frontend
npm install
npm start
```

Frontend starts at: http://localhost:3000

---

## Running with Docker Compose

```bash
# From the root directory
docker-compose -f jayanth/compose.yaml up --build
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- MySQL: localhost:3306

---

## Features

### Authentication
- JWT-based stateless authentication
- Secure password hashing with BCrypt
- Token stored in localStorage, sent via Authorization header

### Expense Management
- Full CRUD operations
- 10 expense categories with icons
- Pagination and multi-field filtering (category, date range, amount range)
- Sort by date, amount, or title

### Analytics & Charts
- **Bar Chart**: Monthly spending for the full year
- **Pie Chart**: Category-wise breakdown with percentages
- **Line Chart**: Daily spending trends
- **Weekly Breakdown**: Visual weekly comparison

### Smart Insights
- Month-over-month spending comparison (% change)
- Budget utilization percentage
- Highest spending category detection
- Next month expense prediction (3-month moving average)

### Budget Management
- Set monthly budgets
- Real-time budget vs. spending comparison
- Color-coded alerts (green/yellow/red)
- Overspend notifications

### Export
- Export to Excel (.xlsx) with styled headers
- Export to PDF with formatted report

---

## Demo Credentials

```
Email: demo@example.com
Password: password123
```

---

## Environment Variables (Production)

```properties
# Backend
SPRING_DATASOURCE_URL=jdbc:mysql://host:3306/expense_tracker
SPRING_DATASOURCE_USERNAME=user
SPRING_DATASOURCE_PASSWORD=pass
APP_JWT_SECRET=your-256-bit-secret-key
APP_JWT_EXPIRATION=86400000
```
