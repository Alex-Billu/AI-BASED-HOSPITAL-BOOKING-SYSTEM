# 🚀 Comprehensive Setup & Run Guide

This guide explains how to set up and run the **RED ALERT NETWORK** project from scratch.

## 📋 Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **MongoDB** (Local instance running at `localhost:27017`)
- **npm** (comes with Node.js)

---

## 🛠️ Step 1: Backend Configuration
The backend serves the API and handles real-time communication.

1.  **Navigate to the backend directory**:
    ```bash
    cd backend
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
    *This installs Express, Mongoose (for MongoDB), Socket.IO (for real-time tracking), and node-cron (for auto-escalation).*
3.  **Environment Setup**:
    Check the `.env` file. It should contain:
    ```env
    PORT=5000
    MONGODB_URI=mongodb://localhost:27017/emerge_ai
    JWT_SECRET=emerge_ai_super_secret_key_2024
    JWT_EXPIRE=7d
    FRONTEND_URL=http://localhost:3000
    ```

---

## 🗄️ Step 2: Database Seeding
To see the app in action, you need hospitals and ambulances in your database.

1.  **Run the seed script**:
    ```bash
    npm run seed
    ```
    *This clears any old data and populates the database with 4 hospitals and 3 ambulances located in Delhi.*

---

## 💻 Step 3: Frontend Configuration
The frontend is built with React and interactive maps via Leaflet.

1.  **Navigate to the frontend directory**:
    ```bash
    cd ../frontend
    ```
2.  **Install dependencies**:
    ```bash
    npm install --legacy-peer-deps
    ```
    *> [!NOTE]  
    > We use `--legacy-peer-deps` because certain map libraries (Leaflet) may have strict version requirements.*

---

## 🏃 Step 4: Running the App
You need **two** terminal windows open (one for backend, one for frontend).

### Window 1: Backend
```bash
cd backend
npm run dev
```
*You should see: `✅ MongoDB Connected` and `🚀 Server running on port 5000`.*

### Window 2: Frontend
```bash
cd frontend
npm start
```
*Wait for the browser to open at `http://localhost:3000`.*

---

## 🔑 Step 5: Demo Login
Use these pre-configured accounts to test current features:

| Role | Email | Password | What to do? |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@demo.com` | `password123` | Request an emergency & view the map. |
| **Hospital** | `admin@aiims.com` | `password123` | Accept/Reject incoming patients. |
| **Driver** | `driver@demo.com` | `password123` | Update location and status. |

---

## 🛠️ Troubleshooting
- **Map not showing?** Ensure you have an internet connection to load the OpenStreetMap tiles.
- **Login fails?** Ensure you ran `npm run seed` in the backend folder first.
- **Port 3000/5000 busy?** Close any other running apps or restart your terminal.
