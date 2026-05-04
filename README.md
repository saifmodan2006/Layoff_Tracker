# Layoff Tracker

A full-stack application for tracking, analyzing, and visualizing layoff data across companies. Built with React, Node.js, and Python, this project combines real-time data scraping with interactive dashboards and notifications.

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Development](#development)
- [Deployment](#deployment)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **Real-time Layoff Data**: Scrapes layoff data from multiple sources (Layoffs.fyi, RSS feeds)
- **Interactive Dashboard**: Visualize layoff trends with D3.js and Recharts
- **Admin Interface**: Manage data and view system metrics
- **Alerts System**: Get notifications for new layoff events
- **Trend Analysis**: Analyze layoff patterns by company, sector, and time period
- **Deduplication**: Smart deduplication of layoff records from multiple sources
- **REST API**: Comprehensive backend API for all data operations

## 📁 Project Structure

```
layoff-tracker/
├── frontend/                 # React + Vite + TypeScript frontend
│   ├── src/
│   │   ├── pages/           # Dashboard, Trends, Company, Admin, Alerts pages
│   │   ├── components/      # Reusable React components
│   │   ├── data/            # Mock data and utilities
│   │   ├── lib/             # Analytics and utilities
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── index.js         # Express server setup
│   │   ├── data.js          # Data layer
│   │   └── utils.js         # Utility functions
│   ├── sql/
│   │   └── schema.sql       # Database schema
│   └── package.json
│
├── scraper/                 # Python data scraper & scheduler
│   ├── sources/
│   │   ├── layoffs_fyi.py   # Scrapes layoffs.fyi
│   │   └── rss_feeds.py     # Scrapes RSS feeds
│   ├── main.py              # Scraper entry point
│   ├── scheduler.py         # Job scheduling
│   ├── normalizer.py        # Data normalization
│   ├── deduplicator.py      # Duplicate removal
│   ├── notifier.py          # Alert notifications
│   ├── requirements.txt     # Python dependencies
│   └── README.md            # Scraper-specific docs
│
├── .gitignore
├── vercel.json              # Vercel deployment config
└── README.md                # This file
```

## 📦 Prerequisites

- **Node.js** 18+ (for frontend and backend)
- **Python** 3.8+ (for scraper)
- **npm** 8+ or **yarn** 3+
- **Git**
- Database (MySQL/PostgreSQL - check schema.sql for requirements)

## 🚀 Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/saifmodan2006/Layoff_Tracker.git
cd layoff-tracker
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run build    # Build for production
# or
npm run dev      # Start development server (http://localhost:5173)
```

**Frontend Dependencies:**
- React 19.x
- Vite 8.x
- TypeScript 6.x
- D3.js for data visualization
- Recharts for charts
- React Router for navigation
- Tailwind CSS for styling

### 3. Backend Setup

```bash
cd backend
npm install
npm start        # Start Express server (default: http://localhost:3000)
```

**Backend Dependencies:**
- Express 5.x
- JWT for authentication
- CORS for cross-origin requests
- Morgan for logging
- Helmet for security
- Zod for validation
- Rate limiting middleware

**Create `.env` file in `backend/`:**
```
PORT=3000
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

### 4. Scraper Setup

```bash
cd scraper
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py            # Run scraper once
# or
python scheduler.py       # Run with scheduled jobs
```

**Python Dependencies:**
- feedparser for RSS parsing
- beautifulsoup4 for HTML scraping
- playwright for dynamic content scraping

**Create `.env` file in `scraper/`:**
```
SCRAPER_INTERVAL=3600     # Run every hour (seconds)
NOTIFICATION_EMAIL=your_email@example.com
```

## 💻 Development

### Frontend Development

```bash
cd frontend
npm run dev       # Start Vite dev server with hot reload
npm run lint      # Run ESLint
npm run build     # Build for production
npm run preview   # Preview production build
```

### Backend Development

```bash
cd backend
npm run dev       # Start with nodemon (if configured)
npm start         # Start Node server
```

### Python Scraper Development

```bash
cd scraper
python main.py    # Run scraper once
python -m pytest  # Run tests (if available)
```

## 🌐 Deployment

### Frontend - Vercel

The frontend is configured to deploy automatically to Vercel when you push to the `main` branch.

**Manual Deployment:**
```bash
# From project root
npx vercel --prod
```

**Configuration:** `vercel.json` is already set up to:
- Install dependencies in `frontend/`
- Run `npm run build` from the frontend
- Serve the production build

### Backend - Cloud Deployment

Choose your preferred platform:

**Heroku:**
```bash
heroku create your-app-name
git push heroku main
```

**Railway / Render / Fly.io:**
```bash
# Follow platform-specific instructions
# Ensure DATABASE_URL and JWT_SECRET are set as environment variables
```

### Scraper - Scheduled Tasks

**Google Cloud Scheduler + Cloud Run:**
- Deploy scraper as a container
- Schedule runs hourly/daily

**AWS Lambda + EventBridge:**
- Package scraper as Lambda function
- Set CloudWatch Events to trigger

**Local/VPS Cron:**
```bash
# Add to crontab (every hour)
0 * * * * cd /path/to/scraper && python main.py >> /var/log/layoff-scraper.log 2>&1
```

## 📡 API Endpoints

### Core Endpoints
- `GET /api/layoffs` - Get all layoff records
- `GET /api/layoffs/:id` - Get specific layoff
- `POST /api/layoffs` - Create new record (admin)
- `PUT /api/layoffs/:id` - Update record (admin)
- `DELETE /api/layoffs/:id` - Delete record (admin)

### Analytics Endpoints
- `GET /api/analytics/trends` - Layoff trends over time
- `GET /api/analytics/by-company` - Stats by company
- `GET /api/analytics/by-sector` - Stats by sector

### Admin Endpoints
- `GET /api/admin/stats` - System statistics
- `POST /api/admin/import` - Import data
- `GET /api/admin/logs` - View system logs

See `backend/README.md` for complete API documentation.

## 🔐 Environment Variables

### Frontend `.env`
```
VITE_API_URL=http://localhost:3000/api
```

### Backend `.env`
```
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/layoffs
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRY=7d
NODE_ENV=production
```

### Scraper `.env`
```
SCRAPER_INTERVAL=3600
NOTIFICATION_EMAIL=alerts@example.com
DB_HOST=localhost
DB_USER=scraperuser
DB_PASSWORD=password
DB_NAME=layoffs
```

## 📝 Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Push to GitHub
git push origin feature/your-feature

# Create Pull Request on GitHub
# After review and approval, merge to main
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards

- Use TypeScript for frontend code
- Follow ESLint rules (run `npm run lint`)
- Write meaningful commit messages
- Add tests for new features (if applicable)
- Update documentation when adding features

## 🐛 Troubleshooting

### Frontend Build Issues
```bash
cd frontend
npm ci            # Clean install
npm run build     # Rebuild
```

### Backend Connection Issues
- Check DATABASE_URL is correct
- Verify database is running
- Check port 3000 is not in use

### Scraper Failures
```bash
# Check logs
tail -f /var/log/layoff-scraper.log

# Test scraper manually
python scraper/main.py --debug
```

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 📧 Support

For issues and questions:
- GitHub Issues: [Report a bug](https://github.com/saifmodan2006/Layoff_Tracker/issues)
- GitHub Discussions: [Ask a question](https://github.com/saifmodan2006/Layoff_Tracker/discussions)

## 🙏 Acknowledgments

- Data sources: Layoffs.fyi, industry RSS feeds
- Built with React, Express.js, and Python
- Deployed on Vercel and cloud platforms