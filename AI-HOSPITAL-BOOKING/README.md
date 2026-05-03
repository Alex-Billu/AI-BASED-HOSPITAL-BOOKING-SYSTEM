# 🚨 RED ALERT NETWORK – Real-Time Emergency Healthcare Coordination Platform

**RED ALERT NETWORK** is a life-saving digital ecosystem designed to minimize emergency response times. It connects patients, ambulances, and hospitals in real-time, using AI-driven recommendations to ensure patients reach the **right hospital at the right time**.

## 🚀 Key Features

*   **Intelligent Hospital Recommendations**: AI engine ranks hospitals by distance, current load, and specialist availability.
*   **Live Ambulance Tracking**: Real-time GPS synchronization between ambulance and hospital.
*   **Blood Availability Network**: City-wide live search for critical blood units.
*   **Auto-Escalation**: If a hospital doesn't respond within 3 minutes, the request is automatically rerouted to the next best facility.
*   **Digital Pre-Registration**: Sends AI-generated patient case summaries to the ER before the ambulance even arrives.

The app will be available at **http://localhost:3000**

---

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@demo.com | password123 |
| Hospital Admin (AIIMS) | admin@aiims.com | password123 |
| Hospital Admin (Apollo) | admin@apollo.com | password123 |
| Ambulance Driver | driver@demo.com | password123 |

---

## 🏗️ Project Structure

```
AI AVENGERS/
├── backend/
│   ├── models/          # MongoDB schemas
│   │   ├── User.js      # Patient, Ambulance, Hospital Admin
│   │   ├── Hospital.js  # Blood inventory, readiness score
│   │   ├── Emergency.js # Emergency requests with escalation
│   │   ├── Ambulance.js # GPS tracking
│   │   └── Notification.js
│   ├── routes/          # REST API endpoints
│   │   ├── auth.js      # JWT login/register
│   │   ├── hospitals.js # Hospital management + blood
│   │   ├── emergency.js # Emergency request + recommendation
│   │   ├── ambulance.js # Location tracking
│   │   ├── blood.js     # Blood availability search
│   │   └── notifications.js
│   ├── services/
│   │   ├── recommendationService.js  # AI hospital scoring
│   │   ├── escalationService.js      # Auto-rerouting
│   │   └── caseSummaryService.js     # AI case summary
│   ├── middleware/
│   │   └── auth.js      # JWT + role protection
│   ├── scripts/
│   │   └── seed.js      # Demo data (4 hospitals, 3 ambulances)
│   └── server.js        # Express + Socket.IO + cron
└── frontend/
    └── src/
        ├── context/AuthContext.js
        ├── utils/api.js, socket.js
        └── pages/
            ├── LandingPage.js
            ├── Login.js / Register.js
            ├── PatientDashboard.js
            ├── HospitalDashboard.js
            ├── AmbulanceDashboard.js
            ├── EmergencyRequest.js
            ├── BloodAvailability.js
            └── EmergencyTracking.js
```

---

## ✨ Core Features

### 🩸 Blood Availability (Key Feature)
- Real-time blood inventory across all hospitals (8 blood types)
- City-wide blood summary dashboard
- Search hospitals by blood type
- Critical shortage alerts via WebSocket
- Hospital admin can update blood units in real-time

### 🤖 AI Hospital Recommendation
Scoring factors (0-100 points):
- **Distance** (0-30 pts): Haversine formula
- **Readiness Score** (0-40 pts): Doctors + load + accepting status
- **Emergency Type Match** (0-20 pts): Specialization matching
- **Blood Availability** (0-10 pts): Required blood type units

### ⚡ Auto-Escalation
- Cron job runs every 30 seconds
- If hospital doesn't respond in 3 minutes → auto-reroute
- Escalation counter tracked per emergency
- Real-time patient notification

### 📋 AI Case Summary
- Auto-generated on emergency submission
- Includes patient info, emergency type, recommended actions
- Sent to hospital before patient arrival

### 🔴 Real-Time Updates
- Socket.IO for all live updates
- Hospital blood inventory changes
- Emergency status progression
- Ambulance GPS location

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Custom CSS (dark theme) |
| State | React Context API |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Real-Time | Socket.IO |
| Auth | JWT (jsonwebtoken) |
| Scheduling | node-cron (escalation) |
| Maps | GPS Geolocation API |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/hospitals | All hospitals with readiness |
| PUT | /api/hospitals/:id/blood | Update blood inventory |
| POST | /api/emergency | Create emergency + get recommendation |
| PUT | /api/emergency/:id/respond | Hospital accept/reject |
| GET | /api/blood | Blood availability all hospitals |
| GET | /api/blood/search?bloodType=O+ | Search by blood type |
| GET | /api/blood/summary | City-wide blood summary |
| PUT | /api/ambulance/:id/location | Update GPS location |

---

## 🔧 Troubleshooting

### PowerShell Execution Policy Error
If you see an error like `File ...\npm.ps1 cannot be loaded because running scripts is disabled`, it means your system blocks PowerShell scripts.

**Fix:** Run commands using `cmd` instead of PowerShell, or bypass the policy:
```powershell
# Option 1: Run via CMD
cmd /c "npm run dev"

# Option 2: Bypass policy temporarily
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm run dev
```

### MongoDB Connection Error
If the backend crashes or logs `MongooseError: buffering timed out`, make sure your local MongoDB service is running.
```bash
# Verify MongoDB is running
mongod
# OR start the service
net start MongoDB
```

---

## 🎯 Demo Scenario

1. Login as **Patient** → Request Emergency (cardiac, critical)
2. System recommends best hospital based on AI scoring
3. Ambulance auto-dispatched, case summary sent to hospital
4. Login as **Hospital Admin** → Accept/Reject emergency
5. If rejected → auto-escalation to next hospital in 3 minutes
6. Track emergency in real-time with timeline
7. Check **Blood Availability** page for city-wide blood map

---


