import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyOTP from "./pages/auth/VerifyOTP";
import ResetPassword from "./pages/auth/ResetPassword";
import PasswordChanged from "./pages/auth/PasswordChanged";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeList from "./pages/admin/EmployeeList";
import AddEmployee from "./pages/admin/AddEmployee";
import ViewEmployee from "./pages/admin/ViewEmployee";
import EditEmployee from "./pages/admin/EditEmployee";
import DepartmentManagement from "./pages/admin/DepartmentManagement";
import AttendanceManagement from "./pages/admin/AttendanceManagement";
import LeaveManagement from "./pages/admin/LeaveManagement";
import PayrollManagement from "./pages/admin/PayrollManagement";
import TaskManagement from "./pages/admin/TaskManagement";
import DocumentManagement from "./pages/admin/DocumentManagement";
import PerformanceManagement from "./pages/admin/PerformanceManagement";
import ReportsManagement from "./pages/admin/ReportsManagement";
import NotificationManagement from "./pages/admin/NotificationManagement";
import ActivityLogManagement from "./pages/admin/ActivityLogManagement";
import Settings from "./pages/admin/Settings";
import AdminProfile from "./pages/admin/AdminProfile";



import EmployeeProfile from "./pages/employee/EmployeeProfile";
import EmployeeTasks from "./pages/employee/EmployeeTasks";
import EmployeeLeave from "./pages/employee/EmployeeLeave";
import EmployeeAttendance from "./pages/employee/EmployeeAttendance";
import EmployeeDocuments from "./pages/employee/EmployeeDocuments";
import EmployeePerformance from "./pages/employee/EmployeePerformance";
import EmployeeNotifications from "./pages/employee/EmployeeNotifications";

function App() {
    return (
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/password-changed" element={<PasswordChanged />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRole="Admin">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="employees" element={<EmployeeList />} />
              <Route path="employees/add" element={<AddEmployee />} />
              <Route path="employees/:id" element={<ViewEmployee />} />
              <Route path="employees/:id/edit" element={<EditEmployee />} />
              <Route path="departments" element={<DepartmentManagement />} />
              <Route path="attendance" element={<AttendanceManagement />} />
              <Route path="leave" element={<LeaveManagement />} />
              <Route path="payroll" element={<PayrollManagement />} />
              <Route path="tasks" element={<TaskManagement />} />
              <Route path="documents" element={<DocumentManagement />} />
              <Route path="performance" element={<PerformanceManagement />} />
              <Route path="reports" element={<ReportsManagement />} />
              <Route
                path="notifications"
                element={<NotificationManagement />}
              />
              <Route path="activity-logs" element={<ActivityLogManagement />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>

            <Route
              path="/employee"
              element={
                <ProtectedRoute allowedRole="Employee">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<EmployeeDashboard />} />
              <Route path="profile" element={<EmployeeProfile />} />
              <Route path="tasks" element={<EmployeeTasks />} />
              <Route path="leave" element={<EmployeeLeave />} />
              <Route path="attendance" element={<EmployeeAttendance />} />
              <Route path="documents" element={<EmployeeDocuments />} />
              <Route path="performance" element={<EmployeePerformance />} />
              <Route path="notifications" element={<EmployeeNotifications />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    );
}

export default App;