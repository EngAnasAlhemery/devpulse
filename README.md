
# DevPulse

### API Monitoring & Observability Platform

DevPulse is a full-stack API monitoring platform designed to help developers monitor service availability, track response times, and manage incidents through a centralized dashboard.

The project focuses on practical backend engineering, database design, scheduled background processing, API development, and real-time operational visibility.

## Features

- **API Monitoring:** Register HTTP and HTTPS endpoints and monitor their availability.
- **Automated Health Checks:** A separate background worker periodically checks active monitors.
- **Response Time Tracking:** Measure and store response times and HTTP status codes.
- **Incident Management:** Automatically create incidents when a service becomes unavailable and resolve them when it recovers.
- **Manual Health Checks:** Trigger individual monitor checks through an API endpoint.
- **Dashboard Analytics:** View monitor statistics, uptime, average response times, and recent monitoring activity.
- **Incident History:** Review open and resolved incidents.
- **Database Health Check:** Verify PostgreSQL connectivity.
- **Automatic Refresh:** Refresh dashboard data periodically.
- **SSRF Protection:** Validate public HTTP/HTTPS destinations and resolve DNS addresses before making monitoring requests.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | Application framework and API routes |
| React 19 | User interface |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| PostgreSQL | Relational database |
| Prisma ORM | Database access and migrations |
| Node.js | Runtime and background worker |
| Recharts | Data visualization |
| Lucide React | Interface icons |
| undici | HTTP requests |
| ipaddr.js | IP address validation |

## Architecture

DevPulse consists of three main components:

### 1. Web Application

The Next.js application provides the monitoring dashboard and API endpoints for managing monitors, retrieving statistics, and viewing incidents.

### 2. Monitoring Worker

A separate Node.js background process periodically checks active monitors based on their configured intervals.

For each check, the worker:

- Sends an HTTP/HTTPS request.
- Measures response time.
- Records the HTTP status code and check result.
- Stores the result in PostgreSQL.
- Updates the incident lifecycle when a service goes down or recovers.

### 3. Incident Management

When a monitor becomes unavailable, DevPulse creates an incident if one is not already open.

When the monitor becomes available again, the existing incident is automatically marked as resolved.

## Project Structure

```text
devpulse/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── scripts/
│   └── worker.ts
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── dashboard/
│   │   │   ├── health/
│   │   │   ├── incidents/
│   │   │   ├── monitors/
│   │   │   └── test-failure/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── lib/
│       ├── prisma.ts
│       └── safe-fetch.ts
├── .env.example
├── package.json
├── prisma.config.ts
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- PostgreSQL

### 1. Clone the repository

```bash
git clone https://github.com/EngAnasAlhemery/devpulse.git
cd devpulse
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root using `.env.example` as a reference.

Set your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME?schema=public"
```

Replace the example values with your actual database credentials.

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Apply database migrations

```bash
npx prisma migrate deploy
```

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Start the monitoring worker

Open a separate terminal in the project directory and run:

```bash
npm run worker
```

The worker runs independently from the web application and performs scheduled monitoring checks.

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check application and database health |
| GET | `/api/dashboard` | Retrieve dashboard statistics |
| GET | `/api/monitors` | Retrieve configured monitors |
| POST | `/api/monitors` | Register a new monitor |
| POST | `/api/monitors/[id]/check` | Trigger a manual health check |
| GET | `/api/incidents` | Retrieve incident history |
| GET | `/api/test-failure` | Development-only test endpoint |

### Example: Create a Monitor

**Request**

```http
POST /api/monitors
Content-Type: application/json
```

**Body**

```json
{
  "name": "My API",
  "url": "https://example.com"
}
```

The API validates the submitted URL before registering the monitor.

## Database Design

DevPulse currently uses three main database models:

- **Monitor:** Stores endpoint information and monitoring configuration.
- **CheckResult:** Stores individual health check results, response times, status codes, and errors.
- **Incident:** Tracks service outages and their resolution times.

Prisma manages database relationships and schema migrations.

## Security Considerations

- Only HTTP and HTTPS monitoring URLs are accepted.
- Localhost and private or reserved IP addresses are rejected.
- DNS resolution is validated before monitoring requests.
- Redirects are not followed automatically.
- Environment secrets are excluded from version control.

These protections are part of the application's URL validation and request-handling layer; they should not be considered a substitute for a complete production security audit.

## Development Status

DevPulse is an actively developed project.

The core monitoring workflow, PostgreSQL integration, background worker, dashboard statistics, monitor registration, and incident lifecycle are implemented.

Further improvements to analytics, monitoring reliability, and production deployment are planned.

## About the Developer

**Anas Amin Mohamed Sultan**

Full Stack Developer interested in backend engineering, API development, database design, and building practical software solutions.

DevPulse is a hands-on project demonstrating full-stack development, background processing, database integration, and API monitoring.

**Contact & Links**

- Email: enganasamin1610@gmail.com
- GitHub: https://github.com/EngAnasAlhemery

---

*Designed and developed by Eng Anas Alhemery.*
