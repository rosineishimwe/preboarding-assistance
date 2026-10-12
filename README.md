# Pre-Boarding Assistance System for Passengers with Disabilities in Kigali

This project is a full-stack web application for pre-boarding accessibility support in Kigali, Rwanda. It lets passengers request help before travel, while staff and administrators review and coordinate assistance requests.

## Project structure

- client/ - React + Vite frontend
- server/ - Express.js API
- database/ - MySQL schema and demo data
- start-project.bat - one-click launcher for Windows
- stop-project.bat - stops only project processes
- package.json - convenience scripts for starting the app from the root folder

## Required software

- Node.js LTS
- MySQL or XAMPP/MySQL service running locally
- A browser such as Chrome or Edge

## First-time setup

1. Open a terminal in the project root folder.
2. Install the root scripts:

```bash
npm install
```

3. Make sure the backend environment file exists:
   - server/.env

4. Make sure the frontend environment file exists:
   - client/.env

5. Check the values in these files:
   - server/.env contains the DB settings, JWT secret, and API port.
   - client/.env contains VITE_API_BASE_URL.

6. Start MySQL.

7. Import the schema and sample data if needed:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -uroot
```

Then run:

```sql
CREATE DATABASE IF NOT EXISTS preboarding_assistance;
USE preboarding_assistance;
SOURCE database/schema.sql;
SOURCE database/seed.sql;
```

If you are using XAMPP, open XAMPP Control Panel and click Start for MySQL.

## How to start the project

### First time

From the project root:

```bash
npm install
npm run start
```

This starts the backend and frontend together.

### One-click startup on Windows

Double-click:

- start-project.bat

This will:
- start the backend in one terminal
- start the frontend in another terminal
- open the app in your default browser
- keep both processes running

The app runs at:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## How to stop the project

You can stop the app in either of these ways:

1. Close the terminal windows manually.
2. Double-click stop-project.bat.
3. Run this command from the root folder:

```bash
npm run stop
```

## Frontend and backend ports

The project is configured as follows:

- Frontend port: 5173
- Backend port: 5000

These values are set in:

- client/vite.config.js
- server/src/server.js
- server/.env

Do not change them unless you also update the matching frontend API URL and environment config.

## MySQL configuration and verification

The database connection is configured in:

- server/src/config/db.js
- server/.env

Important:
- Never share or commit your real database password.
- Keep the password only in your local server/.env file.

To verify MySQL is running on Windows:

```powershell
Get-Service mysql
```

Or, if you are using XAMPP:

- Open XAMPP Control Panel
- Start MySQL

To verify the database is reachable:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -uroot -e "SHOW DATABASES;"
```

Then check that the database exists:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -uroot -D preboarding_assistance -e "SHOW TABLES;"
```

If your project is using a custom password, update the DB_PASSWORD value in server/.env only. Keep the password local and do not overwrite it with a shared value.

## Default demo accounts

The seeded accounts are:

- Passenger: passenger@example.com / Pass@1234
- Staff: staff@example.com / Staff@1234
- Admin: admin@example.com / Admin@1234

## Common troubleshooting

### Node.js not found

Install Node.js LTS and reopen the terminal.

### Backend port 5000 is already in use

Another app may already be using that port. Stop the conflicting program or change the PORT value in server/.env.

### Frontend port 5173 is already in use

Another app may be running on 5173. Stop it or change the port in client/vite.config.js.

### MySQL connection failed

- Check if MySQL is running.
- Confirm the database name and credentials in server/.env.
- Verify the database exists with SHOW DATABASES.

### Browser says the page is blank or the API is unreachable

- Confirm the backend is running.
- Visit http://localhost:5000/api/health
- Confirm the frontend is running on http://localhost:5173
- Check the terminal windows opened by the batch file for error messages.

## Notes

This project preserves the existing React pages, Express routes, authentication, dashboards, and MySQL schema. The launcher only makes it easier to start and stop the application on Windows.

## License

Academic prototype project for coursework and demonstration purposes.
