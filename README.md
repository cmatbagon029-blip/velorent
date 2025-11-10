# Velorent - Vehicle Rental Application

A full-stack vehicle rental application built with Ionic/Angular (frontend) and Node.js/Express (backend).

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)
- Ionic CLI: `npm install -g @ionic/cli`
- MySQL Database

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

### Running the Application

**Option 1: Single Command (Recommended)**
```bash
npm start
```

**Option 2: Windows Batch File**
Double-click `start.bat`

**Option 3: PowerShell**
```powershell
.\start.ps1
```

This will start:
- **Backend API**: http://localhost:3000
- **Frontend App**: http://localhost:8100

### Stopping the Application

- Press `Ctrl + C` in the terminal, or
- Run `stop.bat` (Windows)

## Project Structure

```
velorent/
├── backend/           # Node.js/Express backend
│   ├── app.js        # Main server file
│   ├── routes/       # API routes
│   └── config/       # Database configuration
├── velorent-app/     # Ionic/Angular frontend
│   └── src/          # Source files
└── package.json      # Root package.json with scripts
```

## Available Scripts

- `npm start` - Start both backend and frontend
- `npm run backend` - Start only backend
- `npm run frontend` - Start only frontend
- `npm run install:all` - Install all dependencies

## Configuration

1. Configure database in `backend/config/database.js`
2. Set environment variables in `backend/config.env`
3. Update API URL in `velorent-app/src/environments/environment.ts`

## Building Android APK

To build an APK for testing on your mobile phone, see [BUILD_ANDROID_APK.md](BUILD_ANDROID_APK.md) for detailed instructions.

Quick steps:
1. Update API URL in `velorent-app/src/environments/environment.prod.ts` with your backend server IP
2. Build the app: `cd velorent-app && npm run android:build`
3. Open Android Studio and generate signed APK
4. Install on your phone

## Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Web deployment instructions
- [BUILD_ANDROID_APK.md](BUILD_ANDROID_APK.md) - Android APK build instructions

## License

ISC

