# Velorent Application - Deployment Guide

This guide explains how to run the Velorent application with both backend and frontend servers.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- Ionic CLI installed globally: `npm install -g @ionic/cli`

## Installation

### First Time Setup

1. Install all dependencies:
```bash
npm run install:all
```

Or manually install in each directory:
```bash
# Root directory
npm install

# Backend
cd backend
npm install
cd ..

# Frontend
cd velorent-app
npm install
cd ..
```

## Running the Application

### Option 1: Using npm (Recommended)

Run both backend and frontend with a single command:

```bash
npm start
```

Or:

```bash
npm run dev
```

This will start:
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:8100

### Option 2: Using Batch File (Windows)

Double-click `start.bat` or run in command prompt:

```bash
start.bat
```

This will open two separate command windows:
- One for the backend server
- One for the frontend server

### Option 3: Using PowerShell (Windows)

Right-click `start.ps1` and select "Run with PowerShell", or run:

```powershell
.\start.ps1
```

### Option 4: Run Separately

If you prefer to run them separately:

**Backend only:**
```bash
npm run backend
```

**Frontend only:**
```bash
npm run frontend
```

Or manually:
```bash
# Backend
cd backend
node app.js

# Frontend (in a new terminal)
cd velorent-app
ionic serve
```

## Stopping the Application

### Using npm

Press `Ctrl + C` in the terminal where you ran `npm start`

### Using Batch File

Run `stop.bat` to kill all Node.js processes:

```bash
stop.bat
```

### Manual Stop

Press `Ctrl + C` in each terminal window, or use:

```bash
# Windows
taskkill /f /im node.exe

# Mac/Linux
pkill -f node
```

## Available Scripts

- `npm start` or `npm run dev` - Start both backend and frontend
- `npm run backend` - Start only the backend server
- `npm run frontend` - Start only the frontend server
- `npm run install:all` - Install all dependencies for root, backend, and frontend

## Troubleshooting

### Port Already in Use

If port 3000 or 8100 is already in use:

1. Stop any existing Node.js processes
2. Change the port in the respective configuration files
3. Or use `stop.bat` to kill all Node.js processes

### Backend Not Starting

- Check if MySQL is running
- Verify database connection settings in `backend/config/database.js`
- Check if port 3000 is available

### Frontend Not Starting

- Verify Ionic CLI is installed: `ionic --version`
- Check if port 8100 is available
- Try clearing node_modules and reinstalling: `cd velorent-app && rm -rf node_modules && npm install`

### Concurrently Not Found

If you get an error about `concurrently` not found:

```bash
npm install
```

This will install `concurrently` as a dev dependency.

## Development Notes

- Backend runs on: http://localhost:3000
- Frontend runs on: http://localhost:8100
- API endpoints are prefixed with `/api`
- Backend uses MySQL database (configure in `backend/config/database.js`)
- Frontend uses Ionic/Angular framework

## Building Android APK

To build an Android APK for mobile testing, see [BUILD_ANDROID_APK.md](BUILD_ANDROID_APK.md) for comprehensive instructions.

## Environment Variables

Make sure to configure environment variables in `backend/config.env`:

- Database credentials
- JWT secret
- S3 credentials (if using cloud storage)

