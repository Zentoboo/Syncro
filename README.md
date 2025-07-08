# Syncro

> A full-stack task and project management system designed for efficient team collaboration

[![ASP.NET Core](https://img.shields.io/badge/ASP.NET%20Core-9.0-purple)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-18+-blue)](https://reactjs.org/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-2019+-red)](https://www.microsoft.com/en-us/sql-server)
[![JWT](https://img.shields.io/badge/JWT-Authentication-green)](https://jwt.io/)

## 📋 Overview

Syncro is a comprehensive project management platform that enables teams to plan, organize, and track work effectively. Built with modern web technologies, it provides a streamlined alternative to tools like Trello or Asana, focusing on essential features that teams need most.

### Key Features

- **🔐 Role-Based Access Control** - Admin, Project Manager, and Contributor roles
- **📊 Project Management** - Create, edit, and archive projects with team workspaces
- **✅ Task Management** - Full task lifecycle with subtasks, priorities, and due dates
- **💬 Collaboration** - In-task comments and team member mentions
- **📈 Analytics Dashboard** - Personal and project-level insights with visual charts
- **🔄 Real-time Updates** - Live collaboration and instant progress tracking

## 🎯 Role-Based Permissions

### 👤 Contributor
- View assigned projects and tasks
- Create and update own tasks
- Add comments and collaborate
- Upload file attachments

### 👨‍💼 Project Manager
- All Contributor permissions
- Create and manage projects
- Invite team members
- Assign tasks and set priorities
- Manage project settings

### 👑 Admin
- All Project Manager permissions
- Change user roles system-wide
- Access user management panel
- View system analytics
- Full administrative control

## 🚀 Tech Stack

### Frontend
- **React 18+** - Modern UI library with hooks
- **React Router** - Client-side routing
- **Axios** - HTTP client for API communication
- **Tailwind CSS** - Utility-first CSS framework
- **JWT Authentication** - Secure token-based auth

### Backend
- **ASP.NET Core 9.0** - High-performance web API
- **Entity Framework Core** - ORM for database operations
- **SQL Server** - Enterprise-grade relational database
- **JWT Bearer Authentication** - Secure API endpoints
- **BCrypt** - Password hashing

### Database
- **SQL Server 2019+** - Primary data store with ACID compliance
- **Entity Framework Migrations** - Schema management and versioning

## 📦 Dependencies

### Backend Packages
```xml
<PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.0.6" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="9.0.6" />
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.6" />
<PackageReference Include="Microsoft.IdentityModel.Tokens" Version="8.12.1" />
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.12.1" />
```

### Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.8.1",
  "axios": "^1.3.4",
  "tailwindcss": "^3.2.7"
}
```

## ⚙️ Installation & Setup

### Prerequisites
- [.NET 9.0 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- [SQL Server 2019+](https://www.microsoft.com/en-us/sql-server) or [SQL Server Express](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd syncro/syncroAPI
   ```

2. **Configure Database**
   
   Update `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Database=SyncroAppDB;Trusted_Connection=true;TrustServerCertificate=true;"
     },
     "Jwt": {
       "SecretKey": "your-very-long-secret-key-at-least-32-characters-long",
       "Issuer": "SyncroAPI",
       "Audience": "SyncroUsers"
     },
     "FileUpload": {
       "MaxFileSize": 10485760,
       "AllowedExtensions": [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".jpg", ".jpeg", ".png", ".gif"]
     }
   }
   ```

3. **Install Dependencies & Run Migrations**
   ```bash
   dotnet restore
   dotnet ef migrations add InitialCreate
   dotnet ef database update
   ```

4. **Start the API Server**
   ```bash
   dotnet run
   ```
   API will be available at `https://localhost:5095`

### Frontend Setup

1. **Navigate to Frontend Directory**
   ```bash
   cd ../syncro-frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure API Endpoint**
   
   Update `src/contexts/AuthContext.jsx`:
   ```javascript
   axios.defaults.baseURL = 'http://localhost:5095'; // Your API URL
   ```

4. **Start Development Server**
   ```bash
   npm start
   ```
   Application will be available at `http://localhost:3000`

## 🗃️ Database Schema

The application uses SQL Server with the following main entities:

- **Users** - Authentication and role management
- **Projects** - Project information and settings  
- **ProjectMembers** - User-project relationships with roles
- **Tasks** - Task management with status and priority
- **TaskComments** - Collaboration and communication
- **TaskAttachments** - File uploads and document sharing

### Key SQL Server Features Used
- **IDENTITY columns** for auto-incrementing primary keys
- **GETDATE()** for default timestamps
- **Unique constraints** on usernames and emails
- **Foreign key relationships** with cascade delete
- **Indexed columns** for performance optimization

## 🔒 Authentication Flow

1. User registers/logs in with credentials
2. Server validates and returns JWT token
3. Client stores token and includes in API requests
4. Server validates token and extracts user roles
5. Role-based permissions enforced on both client and server

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Projects
- `GET /api/project` - Get user's projects
- `POST /api/project` - Create new project
- `GET /api/project/{id}` - Get project details
- `PUT /api/project/{id}` - Update project
- `POST /api/project/{id}/members` - Add project member
- `DELETE /api/project/{id}/members/{memberId}` - Remove member

### Tasks
- `GET /api/task` - Get tasks with filters
- `POST /api/task` - Create new task
- `PUT /api/task/{id}` - Update task
- `DELETE /api/task/{id}` - Delete task
- `POST /api/task/{id}/comments` - Add comment
- `GET /api/task/my-tasks` - Get user's assigned tasks

### Dashboard
- `GET /api/dashboard/personal` - Personal dashboard data
- `GET /api/dashboard/project/{id}` - Project dashboard
- `GET /api/dashboard/overview` - Overview statistics

### File Management
- `POST /api/file/upload/{taskId}` - Upload file to task
- `GET /api/file/download/{attachmentId}` - Download file
- `DELETE /api/file/{attachmentId}` - Delete attachment

### Admin (Admin only)
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/{id}/role` - Update user role
- `GET /api/admin/statistics` - System statistics

## 🚧 Development Status

- [x] SQL Server connection established
- [x] Database, backend, & frontend integration
- [x] Complete database schema implementation
- [x] Role-Based Access Control (RBAC)
- [x] CRUD operations for projects and tasks
- [x] React Router & Axios integration
- [x] JWT Authentication system
- [x] User management (Admin panel)
- [x] File upload/download system
- [x] Dashboard analytics
- [ ] Real-time notifications
- [ ] Advanced task filtering
- [ ] Email notifications
- [ ] Task templates

## 🌐 Deployment Options

The application is designed to be deployed on:

- **Frontend**: 
- **Backend**: 
- **Database**: Azure

### SQL Server Deployment Notes
- Supports both SQL Server Express (free) and full SQL Server
- Compatible with Azure SQL Database for cloud deployment
- Uses Windows Authentication (Trusted_Connection) for local development
- Can be configured for SQL Authentication for cloud deployments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Built with ❤️ using ASP.NET Core and React**

Server=tcp:syncro-sqlserver123.database.windows.net,1433;Initial Catalog=syncrodb;Persist Security Info=False;User ID=sqladmin;Password=ZXCvbnm123456;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;