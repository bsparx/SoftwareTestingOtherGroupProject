# IBA Hostel & Maintenance System

A comprehensive, role-based web application designed to manage hostel operations efficiently. This system allows residents to log maintenance complaints, request visitor passes, and trigger real-time emergency alerts, while providing administrative and maintenance staff with powerful dashboards to track, manage, and resolve issues.

## 🚀 Features
- **Role-Based Access Control:** Distinct dashboards and permissions for **Resident**, **Admin**, **Maintenance**, and **Guard** roles.
- **Maintenance Requests:** Residents can log issues; Admins can assign them to Maintenance staff; Maintenance can mark them as resolved.
- **Emergency System:** A 2-click emergency button for residents that triggers instant, real-time polling alerts on the Admin dashboard.
- **Visitor Management:** Residents can request visitor passes. Includes automated curfew enforcement (10 PM - 6 AM) and 1-hour auto-rejection for no-shows.
- **Email Verification:** Complete NodeMailer integration for secure user registration and forgotten passwords.
- **Audit Logs:** Tracks administrative actions for accountability and security.

## 🛠️ Tech Stack
- **Frontend:** React.js, Vite, Axios, React-Toastify
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs

## 📋 Prerequisites
Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local installation or MongoDB Atlas URI)

## ⚙️ Installation & Setup

### 1. Clone the repository (if applicable)
```bash
git clone <your-repository-url>
cd Hostel_maintenance_system
```

### 2. Backend Setup
Open a terminal and navigate to the `backend` directory:
```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory and add the following configuration variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```
*(Note: For `EMAIL_USER` and `EMAIL_PASS`, use a valid email and generate an App Password from your email provider so Nodemailer can send verification emails).*

### 3. Frontend Setup
Open a new terminal window and navigate to the `frontend` directory:
```bash
cd frontend
npm install
```

## 🚀 Running the Application

You will need two separate terminal windows or tabs to run the frontend and backend concurrently.

**Terminal 1: Start the Backend Server**
```bash
cd backend
npm run dev
```
*(The backend server will run on `http://localhost:5000` using nodemon)*

**Terminal 2: Start the Frontend Application**
```bash
cd frontend
npm run dev
```
*(The frontend will start using Vite and can usually be accessed at `http://localhost:5173`)*

## 📖 Initial Usage Guide
1. **Register a User:** Navigate to the frontend URL and create a new account.
2. **Verify Email:** Check the email address you registered with, click the verification link, and then log in.
3. **Change Roles:** To test different dashboards (Admin, Maintenance, Guard), log into your MongoDB database (e.g., using MongoDB Compass) and manually change your user document's `role` field from `Resident` to `Admin`, `Maintenance`, or `Guard`.
4. **Test the System:** Create a complaint as a Resident, switch to the Admin tab to see it auto-populate, and assign it to a Maintenance worker!