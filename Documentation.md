# TICKET MAN: Ticketing Management System Documentation

Welcome to the official documentation for the **Ticketing Management System**. This system is designed to streamline support requests, facilitate communication between departments, and provide a comprehensive knowledge base for self-resolution.

---

## Technical Stack

*   **Language**: TypeScript
*   **Framework**: React (Vite)
*   **Database**: Supabase (PostgreSQL)
*   **Libraries**:
    *   `react-router-dom` (Routing)
    *   `lucide-react` (Icons)
    *   `dayjs` (Time/Date Management)
    *   `clsx` & `tailwind-merge` (Style Utilities)
*   **Developer Tools**:
    *   Vite (Build Tool)
    *   Tailwind CSS (Styling)
    *   ESLint (Linting)
    *   TypeScript (Typing)

---

## 1. Dashboard Structure

The system uses a unified layout with a persistent navigation bar and a contextual top bar. The content changes dynamically based on the user's role.

### Common Layout Components
*   **Sidebar (Navigation)**: Located on the left, providing quick access to all role-specific pages (Tickets, History, KB, User Management, etc.).
*   **Top Bar**: Features global search, theme toggling (Dark/Light mode), manual data sync, and a notification center.
*   **Main Workspace**: The central area where you interact with lists, forms, and charts.

### Dashboard Sections per Role

#### 👤 Employee Dashboard
Focuses on quick ticket submission and tracking personal requests.
*   **Submit Ticket Hero**: A prominent form to quickly file a new issue with a title, category, and description.
*   **Recent Tickets**: A list showing the latest tickets filed by the employee, their current status, and priority.

#### 👮 Admin Dashboard
Focuses on department-specific oversight and ticket resolution.
*   **Department Ticket History**: An audit view of all resolved and closed tickets within the admin's specific department.
*   **System Filters**: Allows filtering history by date range and exporting records to Excel/PDF.
*   **Performance Metrics**: Visual indicators showing resolution rates and department efficiency.

#### 👑 Super Admin Dashboard
The complete overview of global operations.
*   **Global History**: A holistic view of every resolved ticket across all departments in the organization.
*   **System-Wide Filters**: Ability to filter data by specific departments, date ranges, and ticket metrics.
*   **Global Metrics**: Real-time performance tracking for the entire company.

---

## 2. Key Features and Sections

### Ticket Management
*   **Priority System**: Tickets are categorized as **Urgent, High, Medium, or Low** to ensure critical issues are addressed first.
*   **Status Tracking**: Real-time tracking through stages: `OPEN` -> `IN_PROGRESS` -> `RESOLVED` -> `CLOSED`.
*   **Smart AI Priority**: (Automated) The system suggests or assigns priority based on ticket content.
*   **Deadlines & Countdowns**: Visual timers to help resolvers meet SLAs (Service Level Agreements).

### Communication Hub
*   **Messages**: Built-in chat functionality for real-time discussion between employees and resolvers regarding specific tickets.
*   **Notification Center**: Alerts for status updates, new assignments, and direct mentions.

### Knowledge Base (KB)
*   **Self-Service Portal**: A library of articles, FAQs, and guides to help employees solve minor issues without filing a ticket.
*   **KB Management**: Super Admins can create and update articles to keep the company's knowledge current.

### Administrative Tools
*   **User Management**: Super Admins can add new users, approve registration requests, and assign roles/departments.
*   **Department Management**: Configuration of different organization sectors and their respective categories.

---

## 3. The Ticketing Process

1.  **Filing**: An Employee submits a ticket via their dashboard, selecting a department and providing details.
2.  **Routing**: The ticket appears in the designated Department’s Ticket Pool.
3.  **Assignment**: A Department Admin assigns the ticket to a suitable resolver (or themselves).
4.  **Resolution**: The Resolver communicates with the Employee via the message center and moves the ticket to `IN_PROGRESS`.
5.  **Completion**: Once fixed, the ticket is marked as `RESOLVED`.
6.  **Closure**: After verification, the ticket is moved to `CLOSED` for permanent archiving and reporting.

---

## 4. Step-by-Step Usage Guide

### For Employees (Filing a Ticket)
1.  **Login** to your account.
2.  On the **Dashboard**, locate the "Submit Ticket" section.
3.  Enter a **Subject** and select the appropriate **Department/Category**.
4.  Write a detailed **Description** and click **Submit**.
5.  Check **Recent Tickets** or **Notifications** for updates on your request.

### For Admins (Resolving a Ticket)
1.  Navigate to **Department Tickets** in the Sidebar.
2.  Find an `OPEN` ticket and click **Assign** to choose a resolver.
3.  Update the status to **In Progress** when you begin working.
4.  Click **View** to open the details and use the **Message** section to talk to the filer.
5.  Once the issue is fixed, change the status to **Resolved**.

### For Super Admins (System Setup)
1.  Navigate to **User Management** to approve pending access requests.
2.  Go to **Departments** to ensure all operational teams are correctly configured.
3.  Use **Knowledge Base** management to add helpful articles for the staff.
4.  Visit the **Dashboard** to export performance reports for executive review.
