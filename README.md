# Syncro

## What is Syncro?

Syncro is a full-stack web-based task and project management system designed to help teams plan, organize, and track work effectively. It enables users to manage tasks across multiple projects, assign responsibilities, monitor progress, and collaborate through in-task comments and shared dashboards. The system supports both individual productivity and team coordination, making it suitable for use in software development teams, academic project groups, and business operations. 

Think of it as a simplified version of Trello or Asana - streamlined for efficient team collaboration and project tracking.

## Requirements

1. **User & Team Management** - Role-based access (Admin, Project Manager, Contributor) with JWT-based authentication and project member assignment
2. **Project Management** - Create, edit, and archive projects with member workspaces, goals, and timeline definition
3. **Task & Subtask Management** - Create and assign tasks with priority levels, due dates, file attachments, and status transitions (To-Do → In Progress → Done)
4. **Collaboration Features** - In-task commenting system with user mentions and notifications
5. **Personal Dashboard** - Individual view for upcoming tasks, overdue items, and personal productivity tracking
6. **Project Dashboard** - Team overview with overall progress monitoring and task distribution visualization
7. **Visual Analytics** - Interactive charts (bar charts, pie charts, timelines) for project insights and team performance
8. **Real-time Updates** - Live collaboration features for seamless team coordination and instant progress updates

## Tech Stack

**Frontend:**
- React with React Router for navigation
- Axios for API communication
- Tailwind CSS for styling (optional)
- Vite for development and build tooling

**Backend:**
- ASP.NET Core Web API
- Entity Framework Core
- SQL Server database
- JWT-based authentication and authorization
## Setup
- Setup `appsettings.json` on backend folder
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=syncrodb;User=your_username;Password=your_password;Port=3306;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```
## Task
- [ ] setup MySQL connection
- [ ] setup database schema necessary
- [ ] setup Role Based Access Control (RBAC)
- [ ] setup simple CRUD
- [ ] setup react-router & axios of application
