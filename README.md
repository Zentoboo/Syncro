# Syncro - Team Project Management System

A modern, full-stack project management application built for seamless team collaboration and task management. Syncro combines a robust ASP.NET Core API backend with a responsive React frontend to deliver a comprehensive project management solution.

## 🚀 Key Features

### Project Management
- Create and manage projects with team collaboration
- Archive/unarchive projects with status tracking
- Role-based project access (Admin, Project Manager, Contributor)
- Real-time project analytics and progress tracking

### Task Management
- Task workflow: To Do → In Progress → In Review → Done
- Priority levels (Low, Medium, High, Critical)
- File attachments and comment system with @mentions
- Task assignments and due date tracking

### Team Collaboration
- User management with role-based permissions
- Real-time notifications system
- Daily email digest for project updates
- Interactive calendar with multiple view modes
- Project member management and analytics

### User Experience
- Modern dark-themed UI with Tailwind CSS
- Responsive design for all devices
- Advanced search and filtering capabilities
- Protected routes with authentication
- Comprehensive admin panel for system management

## 🛠️ Technology Stack

**Backend (ASP.NET Core)**
- C# with Entity Framework Core
- SQL Server database
- JWT authentication
- MailKit for email services
- Background services for scheduled tasks

**Frontend (React)**
- React.js with modern hooks
- Tailwind CSS for styling
- React Router for navigation
- Context API for state management
- Axios for API integration

## 📁 Project Structure

```
syncro/
├── syncroAPI/                    # Backend API
│   ├── Controllers/              # API endpoints
│   ├── Models/                   # Data models and DTOs
│   ├── Data/                     # Database context
│   └── Services/                 # Business logic services
└── syncro-frontend/              # React frontend
    ├── src/
    │   ├── components/           # React components
    │   ├── contexts/             # State management
    │   └── hooks/                # Custom React hooks
    └── public/                   # Static assets
```

## 🚦 Quick Start

### Prerequisites
- .NET 6.0 or later
- Node.js 14+ and npm
- SQL Server (LocalDB or full instance)

### Backend Setup
```bash
cd syncroAPI
dotnet restore
dotnet ef database update
dotnet run
```

### Frontend Setup
```bash
cd syncro-frontend
npm install
npm start
```

## 🔐 User Roles & Permissions

| Feature | Admin | Project Manager | Contributor |
|---------|-------|-----------------|-------------|
| User Management | ✅ | ❌ | ❌ |
| Create Projects | ✅ | ✅ | ✅ |
| Manage Project Members | ✅ | ✅ | ❌ |
| Create/Assign Tasks | ✅ | ✅ | ❌ |
| Complete Tasks | ✅ | ✅ | ✅ |
| Comment & Upload Files | ✅ | ✅ | ✅ |

## 📊 Core Functionality

### Dashboard Features
- Personal task overview with priorities
- Project progress analytics
- Team performance metrics
- Calendar integration with task visualization

### Task Workflow
1. **Create**: Tasks are created within projects
2. **Assign**: Assign to team members with priorities
3. **Track**: Monitor progress through status updates
4. **Review**: Submit for review and approval
5. **Complete**: Mark as done after approval

### Notification System
- Real-time notifications for task updates
- @mention system in comments
- Email notifications for important events
- Daily digest emails for project summaries

## 🏗️ Architecture Highlights

### Backend Design
- Clean architecture with separation of concerns
- Repository pattern with Entity Framework
- JWT-based authentication and authorization
- Background services for email digests
- Comprehensive API with Swagger documentation

### Frontend Design
- Component-based React architecture
- Context API for global state management
- Role-based access control (RBAC) components
- Responsive design with mobile support
- Real-time updates and notifications

## 🔒 Security Features

- JWT token authentication
- Role-based authorization
- Input validation and sanitization
- Secure file upload handling
- Password hashing with BCrypt
- Protected API endpoints

## 📱 User Interface

- **Dark Theme**: Modern slate color palette
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Intuitive Navigation**: Breadcrumb navigation and clear routing
- **Rich Interactions**: Modals, dropdowns, and interactive elements
- **Loading States**: Smooth user experience with loading indicators

## 🤝 Team Collaboration

Syncro is designed to facilitate effective team collaboration through:
- Clear role definitions and permissions
- Transparent task assignment and tracking
- Real-time communication through comments
- File sharing and attachment management
- Progress visibility for all team members

## 📈 Getting Started as a Team

1. **Admin Setup**: Admin creates user accounts and assigns roles
2. **Project Creation**: Project Managers create and configure projects
3. **Team Building**: Add team members with appropriate roles
4. **Task Management**: Create, assign, and track tasks
5. **Collaboration**: Use comments, files, and notifications to stay connected

## 📚 Documentation

- API documentation available at `/swagger` in development
- Role-based component system for UI permissions
- Comprehensive error handling and user feedback
- Built-in help and guidance throughout the application

---

**Syncro** - Streamlining project management for modern teams with powerful features, intuitive design, and seamless collaboration tools.