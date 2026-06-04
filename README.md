# Task Management Backend

A fully scalable, production-ready backend system built with **Node.js**, **Express**, and **TypeScript** using a **clean modular architecture**. This system uses **Prisma** with MongoDB for database management, **JWT** for authentication, and integrates with **Cloudinary** for media storage and **Nodemailer** for email services.

---

## 🚀 Technologies Used
- **Node.js & Express.js**: Core server framework.
- **TypeScript**: Static typing for robust code.
- **Prisma & MongoDB**: ORM and NoSQL database.
- **JWT (JSON Web Tokens)**: Secure authentication and authorization.
- **Cloudinary**: Cloud-based image and file management.
- **Nodemailer**: Email sending functionality.
- **Zod**: Schema validation.
- **Socket.io**: Real-time communication (optional depending on modules).

---

## 📂 Code Structure

The project follows a highly modular architecture for better maintainability and scalability.

```text
src/
├── app.ts                 # Express app setup and middleware configuration
├── server.ts              # Entry point to start the server
└── app/
    ├── config/            # Environment variables and configuration loaders
    ├── errors/            # Global error handling and custom error classes
    ├── middlewares/       # Express middlewares (auth, validation, etc.)
    ├── modules/           # Domain-driven modules (e.g., users, tasks, projects)
    │   └── [moduleName]/  # Each module has its own controller, service, route, and interface
    ├── prisma/            # Prisma client instantiation
    ├── routes/            # Centralized API route definitions
    └── utils/             # Helper functions and utilities
```

---

## ⚙️ Environment Variables (`.env`)

Create a `.env` file in the root directory based on the following example:

```env
# Server Configuration
PORT=8321
NODE_ENV=development

# Database Configuration
DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.mongodb.net/database_name?retryWrites=true&w=majority"

# JWT Secrets
JWT_ACCESS_SECRET="your_super_secret_access_key"
JWT_REFRESH_SECRET="your_super_secret_refresh_key"
JWT_ACCESS_EXPIRES_IN=5d
JWT_REFRESH_EXPIRES_IN=30d

# Password Hashing
SALT_ROUNDS=12

# Cloudinary Integration (for file uploads)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Email Configuration (Nodemailer)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your_email@gmail.com"
EMAIL_PASS="your_app_password"
EMAIL_FROM="your_email@gmail.com"

# Frontend URLs for Redirects (e.g., Payment or Auth callbacks)
FRONTEND_SUCCESS_URL="http://localhost:3000/dashboard"
FRONTEND_FAIL_URL="http://localhost:3000/login"
FRONTEND_CANCEL_URL="http://localhost:3000/login"

# Initial Admin Credentials (for seeding or default auth)
ADMIN_EMAIL="admin@gmail.com"
ADMIN_PASSWORD="securepassword"

# Password Reset URL
RESET_PASS_LINK="http://localhost:3000/reset-password"
```

---

## 🛠️ How to Use (Local Setup)

### 1. Install Dependencies
Make sure you have Node.js installed, then run:
```bash
npm install
```

### 2. Configure Environment Variables
Copy the `.env` example above and put it in a `.env` file in the root of the project. Make sure to replace the dummy values with your actual database and API credentials.

### 3. Generate Prisma Client
Since the project uses Prisma with MongoDB, generate the Prisma client:
```bash
npm run postinstall
# or directly: npx prisma generate
```

### 4. Run the Development Server
Start the server in development mode (with auto-reload using `ts-node-dev`):
```bash
npm run dev
```

The server should now be running at `http://localhost:8321` (or your defined `PORT`).

### 5. Build for Production
To build the TypeScript files into JavaScript:
```bash
npm run build
```

Then start the compiled code:
```bash
npm run start
```
