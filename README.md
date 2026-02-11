# Faculty Workload & Timetable Optimization System

A premium MERN stack application designed to manage university departments, faculty assignments, and timetable scheduling with an optimized reassignment logic.

## 🚀 Getting Started

### Prerequisites
- **Node.js**: (Version 16 or higher)
- **MongoDB**: A local instance or MongoDB Atlas URI
- **NPM**: Node Package Manager

### 1. Installation

Clone the project and install dependencies for both the backend and frontend.

**Backend Setup:**
```bash
# In the root directory
npm install
```

**Frontend Setup:**
```bash
# In the root directory
cd client
npm install
```

### 2. Configuration

Create a `.env` file in the root directory and add the following variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
```

### 3. Running the Application

You will need two terminal windows open.

**Terminal 1: Backend**
```bash
# In the root directory
npm run dev
```

**Terminal 2: Frontend**
```bash
# In the client directory
cd client
npm run dev
```

The application will be available at `http://localhost:5173` (Frontend) and the API at `http://localhost:5000` (Backend).

## 🔑 Default Credentials

- **Admin Account**: `admin@example.com` / `admin123` (Note: Run `node seed.js` if the database is empty to create initial data).

## ✨ Tech Stack
- **Frontend**: React, Vanilla CSS (Outfit Font), Axios
- **Backend**: Node.js, Express, JWT, Bcrypt
- **Database**: MongoDB & Mongoose
