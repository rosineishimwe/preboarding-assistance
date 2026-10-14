# Pre-Boarding Assistance System for Passengers with Disabilities in Kigali

This project is a full-stack web application for pre-boarding accessibility support in Kigali, Rwanda. Passengers can request assistance before travel, while staff and administrators review, assign, and track those requests.

## Project structure

- client/ - React + Vite frontend
- server/ - Express.js API
- database/ - MySQL schema and application data structure
- start-project.bat - one-click launcher for Windows
- stop-project.bat - stops project processes
- package.json - root scripts for launching both apps together

## Required software

- Node.js LTS
- MySQL or XAMPP/MySQL running locally
- A browser such as Chrome or Edge

## Safe setup for GitHub and local development

1. Clone the project.
2. In the project root, install the root scripts:

```bash
npm install
```

3. Copy the example environment files and replace the sample values with your local settings:

```powershell
Copy-Item .env.example .env
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

4. Update the values in the copied files only.
   - server/.env contains database credentials, JWT secret, and backend settings
   - client/.env contains the frontend API URL
   - Never commit real passwords, API keys, or tokens

5. Make sure MySQL is running.
6. Import the schema if it has not been created yet:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -uroot
CREATE DATABASE IF NOT EXISTS preboarding_assistance;
USE preboarding_assistance;
SOURCE database/schema.sql;
```

## Deployment and GitHub Pages note

This project is designed for a local development environment and for a deployed frontend/backend pair. The frontend is configured to use a live API URL via `VITE_API_BASE_URL`, and the Vite config uses a repository-aware base path for GitHub Pages deployments.

If the frontend is hosted on GitHub Pages, the backend must also be publicly reachable. A GitHub Pages frontend cannot use `http://localhost:5000/api` in production, because that address is local to the developer machine.

## How to start the project

### Option 1: One-click startup on Windows

Double-click:

- start-project.bat

This starts:
- Express backend on http://localhost:5000
- React frontend on http://localhost:5173
- the browser on the frontend URL

### Option 2: Manual startup from the project root

```bash
npm install
npm run start
```

### Option 3: Run backend and frontend separately

```bash
npm run start:backend
npm run start:frontend
```

## How to stop the project

- Close the terminal windows manually, or
- Run:

```bash
npm run stop
```

## Default local URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Health check: http://localhost:5000/api/health

## Configuration checklist for local and production use

### Required local values

- server/.env
  - DB_HOST
  - DB_PORT
  - DB_USER
  - DB_PASSWORD
  - DB_NAME
  - JWT_SECRET
  - FRONTEND_ORIGIN

- client/.env
  - VITE_API_BASE_URL

### Production guidance

- Replace localhost URLs with the real frontend and backend domains.
- Keep all secrets in `.env` files only.
- Do not hardcode local hostnames into shipped builds.
- Use environment variables for deployment configuration.

## Security and GitHub publishing

The project is prepared for safe publishing to GitHub:

- `.env` files are ignored by `.gitignore`
- example files contain placeholder values only
- real credentials stay local to your machine
- no password or API key is stored in the Git-tracked project files

> Do not commit actual `.env` files. Keep them on your local device or a secret manager.

## Verified application flows

The project has been validated for:

- registration and login
- passenger request submission
- generated reference numbers
- staff assignment
- request tracking and status updates
- passenger-only access restrictions
- database-backed request storage

The backend verification suite covers these flows:

```powershell
cd server
npm test
```

## MySQL verification

Check if MySQL is running:

```powershell
Get-Service mysql
```

If using XAMPP:

- Open XAMPP Control Panel
- Start MySQL

Then confirm the database is reachable:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -uroot -e "SHOW DATABASES;"
```

## Final deployment checklist

### Ready

- [x] React/Vite frontend builds successfully
- [x] Node.js/Express backend starts successfully
- [x] MySQL integration works with the app schema
- [x] Passenger and staff flows are implemented and validated
- [x] Local startup script works on Windows
- [x] `.gitignore` protects `.env` files
- [x] Example environment files use placeholders only
- [x] README explains setup and startup clearly

### Failed or blocked

- [ ] Real email notifications are not active until valid SMTP credentials are supplied
- [ ] Official organization contact details must be confirmed before publication
- [ ] Any live WhatsApp or SMS integration must be approved and secured by the real organization

### Still needed before public launch

- [ ] Configure real SMTP settings in server/.env
- [ ] Confirm official organization email and phone number
- [ ] Set production-safe frontend and backend URLs in environment files
- [ ] Deploy the backend to a secure host or reverse proxy
- [ ] Deploy the frontend to a hosting provider or static server
- [ ] Run final acceptance testing with real staff/admin accounts

## Notes

This project preserves the current working app structure and does not remove working features. It is ready for local testing and safe deployment preparation, but it should not claim real email delivery or official contact information until the organization confirms those details.

## License

Academic prototype project for coursework and demonstration purposes.
