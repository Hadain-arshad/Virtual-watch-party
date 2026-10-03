# Virtual Watch Party

Offline standalone watch-party application with a React/Vite frontend, FastAPI backend, and Microsoft SQL Server database.

## Requirements

- Node.js 18+
- Python 3.11+
- Microsoft SQL Server Express with the instance `DESKTOP-DUJ43DM\SQLEXPRESS`
- Microsoft ODBC Driver 17 for SQL Server

## First-time setup

From the project root (`C:\Users\Hadi\Desktop\FYP-1`):

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend\.env` and set a long private `JWT_SECRET` before using the app.

Install the frontend packages:

```powershell
cd ..\virtual-watch-party
npm install
```

## Start the app

Open two PowerShell terminals from the project root.

Terminal 1, backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API is available at `http://localhost:8000` and its interactive docs are at `http://localhost:8000/docs`.

Terminal 2, frontend:

```powershell
cd virtual-watch-party
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## Database behavior

When the backend starts, it connects to the SQL Server instance using Windows authentication, creates `VirtualWatchPartyDB` if it does not exist, and creates the `users` table. Profile pictures are stored on disk in `backend/uploads` and served through the API.

## Useful checks

```powershell
# Frontend production build
cd virtual-watch-party
npm run build

# Backend syntax check
cd ..
backend\.venv\Scripts\python.exe -m py_compile backend\main.py
```
