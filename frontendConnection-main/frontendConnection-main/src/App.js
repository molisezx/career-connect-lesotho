import "bootstrap/dist/css/bootstrap.min.css";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import "./App.css";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdmissionsManagement from "./pages/admin/AdmissionsManagement";
import CompanyManagement from "./pages/admin/CompanyManagement";
import FacultiesManagement from "./pages/admin/FacultiesManagement";
import InstitutionsManagement from "./pages/admin/InstitutionsManagement";
import SystemReports from "./pages/admin/SystemReports";
import SystemSettings from "./pages/admin/SystemSettings";
import UserManagement from "./pages/admin/UserManagement";
import Login from "./pages/auth/Login";
import Registration from "./pages/auth/Register";

// Company Pages
import ApplicationDetails from "./pages/company/ApplicationDetails";
import CompanyApplications from "./pages/company/Applications";
import CompanyAnalytics from "./pages/company/CompanyAnalytics";
import CompanyDashboard from "./pages/company/CompanyDashboard";
import CompanyJobs from "./pages/company/CompanyJobs";
import CompanyProfile from "./pages/company/CompanyProfile";
import JobPosting from "./pages/company/JobPosting";

import EmployerDashboard from "./pages/Employer/EmployerDashboard";
import Home from "./pages/Home";
import InstitutionDashboard from "./pages/institute/InstitutionDashboard";
import InstitutionProfile from "./pages/institute/InstitutionProfile";
import ManageCourses from "./pages/institute/ManageCourses";
import ManageFaculties from "./pages/institute/ManageFaculties";
import PublishAdmissions from "./pages/institute/PublishAdmissions";
import ReviewApplications from "./pages/institute/ReviewApplications";
import StudentManagement from "./pages/institute/StudentManagement";
import AdmissionSelection from "./pages/student/AdmissionSelection";
import StudentApplications from "./pages/student/Applications";
import ApplyCourse from "./pages/student/ApplyCourse";
import ApplyJob from "./pages/student/ApplyJob";
import Courses from "./pages/student/Courses";
import Documents from "./pages/student/Documents";
import Institutions from "./pages/student/Institutions";
import JobMatches from "./pages/student/JobMatches";
import Jobs from "./pages/student/Jobs";
import Notifications from "./pages/student/Notifications";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProfile from "./pages/student/StudentProfile";
import ViewApplication from "./pages/student/ViewApplication";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registration />} />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={<Navigate to="/dashboard/student" replace />}
            />

            {/* Student Routes */}
            <Route path="student" element={<StudentDashboard />} />
            <Route path="student/profile" element={<StudentProfile />} />
            <Route path="student/courses" element={<Courses />} />
            <Route path="student/institutions" element={<Institutions />} />
            <Route path="student/jobs" element={<Jobs />} />
            <Route
              path="student/applications"
              element={<StudentApplications />}
            />
            <Route path="student/documents" element={<Documents />} />
            <Route path="student/notifications" element={<Notifications />} />
            <Route path="student/apply-course" element={<ApplyCourse />} />
            <Route
              path="student/apply-course/:courseId"
              element={<ApplyCourse />}
            />
            <Route path="student/apply-job" element={<ApplyJob />} />
            <Route path="student/apply-job/:jobId" element={<ApplyJob />} />
            <Route
              path="student/view-application/:applicationId"
              element={<ViewApplication />}
            />
            <Route path="student/job-matches" element={<JobMatches />} />
            <Route
              path="student/admission-selection"
              element={<AdmissionSelection />}
            />

            {/* Company Routes */}
            <Route path="company" element={<CompanyDashboard />} />
            <Route path="company/jobs" element={<CompanyJobs />} />
            <Route path="company/jobs/new" element={<JobPosting />} />
            <Route path="company/jobs/:jobId" element={<JobPosting />} />
            <Route path="company/jobs/:jobId/edit" element={<JobPosting />} />
            <Route
              path="company/applications"
              element={<CompanyApplications />}
            />
            <Route
              path="company/applications/:applicationId"
              element={<ApplicationDetails />}
            />
            <Route path="company/profile" element={<CompanyProfile />} />
            <Route path="company/analytics" element={<CompanyAnalytics />} />

            {/* Institution Routes */}
            <Route path="institution" element={<InstitutionDashboard />} />
            <Route path="institution/faculties" element={<ManageFaculties />} />
            <Route path="institution/courses" element={<ManageCourses />} />
            <Route
              path="institution/applications"
              element={<ReviewApplications />}
            />
            <Route
              path="institution/admissions"
              element={<PublishAdmissions />}
            />
            <Route
              path="institution/students"
              element={<StudentManagement />}
            />
            <Route
              path="institution/profile"
              element={<InstitutionProfile />}
            />

            {/* Employer Routes */}
            <Route path="employer" element={<EmployerDashboard />} />

            {/* Admin Routes */}
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/user-management" element={<UserManagement />} />
            <Route
              path="admin/institutions"
              element={<InstitutionsManagement />}
            />
            <Route path="admin/faculties" element={<FacultiesManagement />} />
            <Route path="admin/admissions" element={<AdmissionsManagement />} />
            <Route path="admin/companies" element={<CompanyManagement />} />
            <Route path="admin/reports" element={<SystemReports />} />
            <Route path="admin/settings" element={<SystemSettings />} />

            {/* Nested Admin Routes for Detail Pages */}
            <Route
              path="admin/institutions/:id"
              element={<InstitutionsManagement />}
            />
            <Route
              path="admin/institutions/:id/faculties"
              element={<FacultiesManagement />}
            />
            <Route
              path="admin/faculties/:id/courses"
              element={<FacultiesManagement />}
            />
            <Route path="admin/companies/:id" element={<CompanyManagement />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
