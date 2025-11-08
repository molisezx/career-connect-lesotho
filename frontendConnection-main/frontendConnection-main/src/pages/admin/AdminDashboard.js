import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Dropdown,
  ListGroup,
  Modal,
  ProgressBar,
  Row,
  Spinner,
  Table
} from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  AdminServices,
  getDashboardStats,
  getInstitutions,
  getSystemHealth,
  runSystemDiagnostics,
  subscribeToActivities,
  subscribeToPendingCompanies
} from "../../services/adminService";

// Custom hook for dashboard navigation
const useDashboardNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = useCallback((path, options = {}) => {
    const { replace = false, forceRefresh = false } = options;

    if (location.pathname === path && forceRefresh) {
      navigate(path, { replace: true });
    } else {
      navigate(path, { replace });
    }
  }, [navigate, location.pathname]);

  const handleRefresh = useCallback(() => {
    navigate(location.pathname, { replace: true });
  }, [navigate, location.pathname]);

  return {
    handleNavigation,
    handleRefresh,
    currentPath: location.pathname
  };
};

// Stat Card Component
const StatCard = ({ title, value, change, icon, color, onClick, isSystem = false }) => (
  <Card
    className={`stat-card h-100 shadow-sm border-0 ${onClick ? 'clickable' : ''} ${isSystem ? 'system-stat' : ''}`}
    style={{
      borderLeft: `4px solid ${color}`,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease-in-out'
    }}
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : -1}
    onKeyPress={(e) => onClick && e.key === 'Enter' && onClick()}
  >
    <Card.Body className="p-3">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div
          className="stat-icon rounded-circle d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: `${color}20`,
            width: '48px',
            height: '48px'
          }}
        >
          <span style={{ fontSize: '1.25rem', color: color }}>{icon}</span>
        </div>
        {isSystem && (
          <Badge bg={value >= 80 ? "success" : value >= 60 ? "warning" : "danger"}>
            {value}%
          </Badge>
        )}
      </div>
      <h3 className="mb-1 fw-bold" style={{
        color: isSystem ? (value >= 80 ? '#10B981' : value >= 60 ? '#F59E0B' : '#EF4444') : color
      }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </h3>
      <small className="text-muted">{title}</small>
      {change && (
        <Badge bg="light" text="dark" className="mt-2">
          {change}
        </Badge>
      )}
    </Card.Body>
  </Card>
);

// Quick Action Card Component
const QuickActionCard = ({ icon, title, description, action, color, isDanger = false, onAction }) => (
  <Card
    className={`quick-action-card h-100 shadow-sm border-0 ${isDanger ? 'border-danger' : ''}`}
    style={{
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      borderLeft: isDanger ? '4px solid #EF4444' : 'none'
    }}
    onClick={() => onAction(action)}
    role="button"
    tabIndex={0}
    onKeyPress={(e) => e.key === 'Enter' && onAction(action)}
  >
    <Card.Body className="text-center p-3">
      <div
        className="action-icon mx-auto mb-2 rounded-circle d-flex align-items-center justify-content-center"
        style={{
          backgroundColor: `${color}20`,
          width: '50px',
          height: '50px'
        }}
      >
        <span style={{ fontSize: '1.25rem', color: color }}>{icon}</span>
      </div>
      <h6 className="fw-bold mb-1">{title}</h6>
      <p className="text-muted small mb-0">{description}</p>
    </Card.Body>
  </Card>
);

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { handleNavigation } = useDashboardNavigation();
  const [stats, setStats] = useState({
    totalInstitutions: 0,
    totalFaculties: 0,
    totalCourses: 0,
    activeAdmissions: 0,
    registeredCompanies: 0,
    pendingApprovals: 0,
    totalStudents: 0,
    systemHealth: 100
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState({ show: false, company: null, action: '' });

  // Memoized data loading function
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      console.log("🔄 Loading admin dashboard data...");

      const [statsData, institutionsData, healthData] = await Promise.allSettled([
        getDashboardStats(),
        getInstitutions(),
        getSystemHealth()
      ]);

      // Handle stats data
      if (statsData.status === 'fulfilled') {
        const data = statsData.value;
        setStats({
          totalInstitutions: data.totalInstitutions || 0,
          totalFaculties: data.totalFaculties || 0,
          totalCourses: data.totalCourses || 0,
          activeAdmissions: data.activeAdmissions || 0,
          registeredCompanies: data.totalCompanies || 0,
          pendingApprovals: data.pendingCompanies || 0,
          totalStudents: data.totalStudents || 0,
          systemHealth: healthData.status === 'fulfilled' ? healthData.value.overallHealth : 100
        });
      } else {
        console.warn("⚠️ Failed to load stats:", statsData.reason);
        throw new Error(statsData.reason?.message || "Failed to load statistics");
      }

      // Handle institutions data
      if (institutionsData.status === 'fulfilled') {
        setInstitutions(institutionsData.value.slice(0, 4));
      } else {
        console.warn("⚠️ Failed to load institutions:", institutionsData.reason);
        setInstitutions([]);
      }

      // Handle system health data
      if (healthData.status === 'fulfilled') {
        setSystemMetrics(healthData.value);
      } else {
        console.warn("⚠️ Failed to load system health:", healthData.reason);
        setSystemMetrics({});
      }

    } catch (error) {
      console.error("❌ Error loading admin dashboard data:", error);
      setError(error.message || "Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initialize dashboard with real-time subscriptions
  useEffect(() => {
    let isMounted = true;
    let unsubscribeActivities, unsubscribeCompanies;

    const initializeDashboard = async () => {
      await loadDashboardData();

      if (isMounted) {
        try {
          // Set up real-time listeners
          unsubscribeActivities = subscribeToActivities((activities) => {
            if (isMounted) {
              console.log("📡 Activities update:", activities);
              setRecentActivities(prev => [...activities].slice(0, 6));
            }
          });

          unsubscribeCompanies = subscribeToPendingCompanies((companies) => {
            if (isMounted) {
              console.log("📡 Pending companies update:", companies);
              setPendingCompanies(companies.slice(0, 4));
            }
          });
        } catch (error) {
          console.error("❌ Error setting up real-time listeners:", error);
          if (isMounted) {
            setError("Some real-time features may not be available");
          }
        }
      }
    };

    initializeDashboard();

    return () => {
      isMounted = false;
      if (unsubscribeActivities) unsubscribeActivities();
      if (unsubscribeCompanies) unsubscribeCompanies();
    };
  }, [loadDashboardData]);

  const handleApproveCompany = async (companyId) => {
    try {
      setError(null);
      await AdminServices.companies.approveCompany(companyId);
      console.log("✅ Company approved:", companyId);

      // Update local state immediately for better UX
      setPendingCompanies(prev => prev.filter(company => company.id !== companyId));
      setStats(prev => ({
        ...prev,
        pendingApprovals: Math.max(0, prev.pendingApprovals - 1),
        registeredCompanies: prev.registeredCompanies + 1
      }));

      setShowApprovalModal({ show: false, company: null, action: '' });
    } catch (error) {
      console.error("❌ Error approving company:", error);
      setError(`Failed to approve company: ${error.message}`);
    }
  };

  const handleRejectCompany = async (companyId, reason = "Rejected by administrator") => {
    try {
      setError(null);
      await AdminServices.companies.rejectCompany(companyId, reason);
      console.log("❌ Company rejected:", companyId);

      // Update local state immediately for better UX
      setPendingCompanies(prev => prev.filter(company => company.id !== companyId));
      setStats(prev => ({
        ...prev,
        pendingApprovals: Math.max(0, prev.pendingApprovals - 1)
      }));

      setShowApprovalModal({ show: false, company: null, action: '' });
    } catch (error) {
      console.error("❌ Error rejecting company:", error);
      setError(`Failed to reject company: ${error.message}`);
    }
  };

  const handleQuickAction = useCallback((action) => {
    switch (action) {
      case 'manageInstitutions':
        handleNavigation("/dashboard/admin/institutions");
        break;
      case 'manageFaculties':
        handleNavigation("/dashboard/admin/faculties");
        break;
      case 'admissions':
        handleNavigation("/dashboard/admin/admissions");
        break;
      case 'companyManagement':
        handleNavigation("/dashboard/admin/companies");
        break;
      case 'systemReports':
        handleNavigation("/dashboard/admin/reports");
        break;
      case 'systemSettings':
        handleNavigation("/dashboard/admin/settings");
        break;
      case 'userManagement':
        handleNavigation("/dashboard/admin/users");
        break;
      case 'systemHealth':
        setShowSystemModal(true);
        break;
      case 'refreshData':
        loadDashboardData(true);
        break;
      default:
        console.warn("Unknown action:", action);
    }
  }, [handleNavigation, loadDashboardData]);

  const handleRunDiagnostics = async () => {
    try {
      setError(null);
      const diagnostics = await runSystemDiagnostics();
      setSystemMetrics(prev => ({ ...prev, diagnostics }));
      console.log("✅ System diagnostics completed:", diagnostics);
    } catch (error) {
      console.error("❌ Error running diagnostics:", error);
      setError(`Failed to run system diagnostics: ${error.message}`);
    }
  };

  const getActivityIcon = useCallback((type) => {
    const icons = {
      'company_approved': '✅',
      'company_rejected': '❌',
      'company_suspended': '⏸️',
      'institution_added': '🏫',
      'institution_updated': '✏️',
      'admission_added': '📢',
      'faculty_added': '🎓',
      'user_status_updated': '👤',
      'user_role_updated': '🔧',
      'system_alert': '🚨',
      'system_maintenance': '🔧',
      'user_registered': '👥'
    };
    return icons[type] || '📝';
  }, []);

  const getStatusVariant = useCallback((status) => {
    const variants = {
      'active': 'success',
      'approved': 'success',
      'completed': 'success',
      'pending': 'warning',
      'review': 'warning',
      'rejected': 'danger',
      'suspended': 'danger',
      'error': 'danger',
      'maintenance': 'info'
    };
    return variants[status?.toLowerCase()] || 'secondary';
  }, []);

  const formatTimeAgo = useCallback((timestamp) => {
    if (!timestamp) return 'Recently';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      handleNavigation("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setError("Failed to logout. Please try again.");
    }
  };

  // Memoized user display name
  const userDisplayName = useMemo(() => {
    return user?.displayName || user?.fullName || user?.email || 'Administrator';
  }, [user]);

  if (isLoading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted">Loading admin dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="admin-dashboard px-4 py-3">
      {/* Header Section */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0 bg-dark text-white">
            <Card.Body className="py-4">
              <Row className="align-items-center">
                <Col>
                  <div className="d-flex align-items-center">
                    <div
                      className="admin-avatar me-3 rounded-circle d-flex align-items-center justify-content-center bg-warning text-dark"
                      style={{ width: '60px', height: '60px', fontSize: '1.5rem', fontWeight: 'bold' }}
                    >
                      ⚙️
                    </div>
                    <div>
                      <h1 className="h3 mb-1 fw-bold">
                        System Administration
                      </h1>
                      <p className="mb-0 opacity-75">
                        Welcome back, {userDisplayName}. Manage platform operations and monitor system health.
                      </p>
                    </div>
                  </div>
                </Col>
                <Col xs="auto">
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-light"
                      size="sm"
                      onClick={() => handleQuickAction('refreshData')}
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-arrow-clockwise me-2"></i>
                          Refresh
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline-light"
                      size="sm"
                      onClick={() => handleQuickAction('systemHealth')}
                    >
                      <i className="bi bi-graph-up me-2"></i>
                      System Health
                    </Button>
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-light" size="sm" id="admin-dropdown">
                        <i className="bi bi-person-gear me-2"></i>
                        {userDisplayName}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleNavigation('/dashboard/admin/profile')}>
                          <i className="bi bi-person me-2"></i>
                          Admin Profile
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleNavigation('/dashboard/admin/settings')}>
                          <i className="bi bi-gear me-2"></i>
                          System Settings
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleNavigation('/dashboard/admin/audit')}>
                          <i className="bi bi-shield-check me-2"></i>
                          Audit Log
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={handleLogout}>
                          <i className="bi bi-box-arrow-right me-2"></i>
                          Logout
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Error Alert */}
      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="warning" className="d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
              <Button variant="outline-warning" size="sm" onClick={() => loadDashboardData(true)}>
                Retry
              </Button>
            </Alert>
          </Col>
        </Row>
      )}

      {/* System Overview Stats */}
      <Row className="g-3 mb-4">
        <Col md={2}>
          <StatCard
            title="Institutions"
            value={stats.totalInstitutions}
            change="Registered"
            icon="🏫"
            color="#3B82F6"
            onClick={() => handleQuickAction('manageInstitutions')}
          />
        </Col>
        <Col md={2}>
          <StatCard
            title="Faculties"
            value={stats.totalFaculties}
            change="Active"
            icon="🎓"
            color="#10B981"
            onClick={() => handleQuickAction('manageFaculties')}
          />
        </Col>
        <Col md={2}>
          <StatCard
            title="Courses"
            value={stats.totalCourses}
            change="Available"
            icon="📚"
            color="#F59E0B"
          />
        </Col>
        <Col md={2}>
          <StatCard
            title="Companies"
            value={stats.registeredCompanies}
            change={`${stats.pendingApprovals} pending`}
            icon="🏢"
            color="#EF4444"
            onClick={() => handleQuickAction('companyManagement')}
          />
        </Col>
        <Col md={2}>
          <StatCard
            title="Students"
            value={stats.totalStudents}
            change="Registered"
            icon="👨‍🎓"
            color="#8B5CF6"
          />
        </Col>
        <Col md={2}>
          <StatCard
            title="System Health"
            value={stats.systemHealth}
            change={stats.systemHealth >= 80 ? "Optimal" : stats.systemHealth >= 60 ? "Stable" : "Needs Attention"}
            icon="💚"
            color={stats.systemHealth >= 80 ? "#10B981" : stats.systemHealth >= 60 ? "#F59E0B" : "#EF4444"}
            onClick={() => handleQuickAction('systemHealth')}
            isSystem={true}
          />
        </Col>
      </Row>

      {/* Quick Actions - Admin Focused */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-lightning me-2"></i>
                Administration Tools
              </h5>
              <p className="text-muted mb-0 small">Platform management and monitoring</p>
            </Card.Header>
            <Card.Body>
              <Row className="g-2">
                <Col md={3}>
                  <QuickActionCard
                    icon="🏫"
                    title="Institutions"
                    description="Manage higher learning institutions"
                    color="#3B82F6"
                    action="manageInstitutions"
                    onAction={handleQuickAction}
                  />
                </Col>
                <Col md={3}>
                  <QuickActionCard
                    icon="🎓"
                    title="Faculties & Courses"
                    description="Manage academic programs"
                    color="#10B981"
                    action="manageFaculties"
                    onAction={handleQuickAction}
                  />
                </Col>
                <Col md={3}>
                  <QuickActionCard
                    icon="🏢"
                    title="Company Approvals"
                    description="Review and approve companies"
                    color="#EF4444"
                    action="companyManagement"
                    onAction={handleQuickAction}
                  />
                </Col>
                <Col md={3}>
                  <QuickActionCard
                    icon="📊"
                    title="System Reports"
                    description="View platform analytics"
                    color="#8B5CF6"
                    action="systemReports"
                    onAction={handleQuickAction}
                  />
                </Col>
                <Col md={3}>
                  <QuickActionCard
                    icon="👥"
                    title="User Management"
                    description="Manage user accounts and roles"
                    color="#06B6D4"
                    action="userManagement"
                    onAction={handleQuickAction}
                  />
                </Col>
                <Col md={3}>
                  <QuickActionCard
                    icon="⚙️"
                    title="System Settings"
                    description="Configure platform settings"
                    color="#F59E0B"
                    action="systemSettings"
                    onAction={handleQuickAction}
                  />
                </Col>
                <Col md={3}>
                  <QuickActionCard
                    icon="📢"
                    title="Admissions"
                    description="Manage admission cycles"
                    color="#EC4899"
                    action="admissions"
                    onAction={handleQuickAction}
                  />
                </Col>
                <Col md={3}>
                  <QuickActionCard
                    icon="🚨"
                    title="System Health"
                    description="Monitor platform performance"
                    color="#10B981"
                    action="systemHealth"
                    onAction={handleQuickAction}
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Left Column */}
        <Col lg={8}>
          {/* System Activities */}
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-activity me-2"></i>
                  System Activities
                </h5>
                <p className="text-muted mb-0 small">Recent platform events and actions</p>
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleNavigation('/dashboard/admin/activities')}
              >
                View All
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {recentActivities.length > 0 ? (
                <ListGroup variant="flush">
                  {recentActivities.map((activity, index) => (
                    <ListGroup.Item key={activity.id || index} className="px-3 py-2 border-bottom">
                      <div className="d-flex align-items-center">
                        <div className="me-3" style={{ fontSize: '1.25rem' }}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-grow-1">
                          <p className="mb-1 small">
                            {activity.message || 'System activity occurred'}
                          </p>
                          <small className="text-muted">
                            {formatTimeAgo(activity.timestamp || activity.createdAt)}
                          </small>
                        </div>
                        <Badge bg={getStatusVariant(activity.priority || activity.status)} className="small">
                          {activity.priority || activity.status || 'medium'}
                        </Badge>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-activity display-1 text-muted"></i>
                  <p className="text-muted mt-2">No recent activities</p>
                  <small className="text-muted">System activities will appear here</small>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Institutions Overview */}
          <Card className="shadow-sm border-0 mt-4">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-building me-2"></i>
                  Institutions Overview
                </h5>
                <p className="text-muted mb-0 small">Recently registered institutions</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleNavigation('/dashboard/admin/institutions')}
              >
                Manage All
              </Button>
            </Card.Header>
            <Card.Body>
              {institutions.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Institution</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {institutions.map((institution) => (
                      <tr key={institution.id}>
                        <td>
                          <strong>{institution.name}</strong>
                        </td>
                        <td>{institution.type || 'N/A'}</td>
                        <td>{institution.location || 'N/A'}</td>
                        <td>
                          <Badge bg={getStatusVariant(institution.status)}>
                            {institution.status || 'active'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleNavigation(`/dashboard/admin/institutions/${institution.id}`)}
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-building display-1 text-muted"></i>
                  <p className="text-muted mt-2">No institutions registered</p>
                  <Button
                    variant="primary"
                    onClick={() => handleNavigation('/dashboard/admin/institutions/create')}
                  >
                    Add First Institution
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column */}
        <Col lg={4}>
          {/* Pending Approvals */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0 fw-bold text-warning">
                  <i className="bi bi-clock-history me-2"></i>
                  Pending Approvals
                </h5>
                <p className="text-muted mb-0 small">Require immediate attention</p>
              </div>
              <Badge bg="warning" text="dark">
                {pendingCompanies.length}
              </Badge>
            </Card.Header>
            <Card.Body className="p-0">
              {pendingCompanies.length > 0 ? (
                <ListGroup variant="flush">
                  {pendingCompanies.map((company) => (
                    <ListGroup.Item key={company.id} className="px-3 py-2 border-bottom">
                      <div className="d-flex align-items-center">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center bg-warning text-white me-3"
                          style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}
                        >
                          🏢
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-0 small fw-bold">{company.name}</h6>
                          <small className="text-muted">{company.industry || 'N/A'}</small>
                          <br />
                          <small className="text-muted">Registered: {formatTimeAgo(company.createdAt)}</small>
                        </div>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => setShowApprovalModal({
                              show: true,
                              company,
                              action: 'approve'
                            })}
                          >
                            ✓
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => setShowApprovalModal({
                              show: true,
                              company,
                              action: 'reject'
                            })}
                          >
                            ✗
                          </Button>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-3">
                  <i className="bi bi-check-circle text-success display-6"></i>
                  <p className="text-muted mt-2 small">No pending approvals</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* System Status */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-heart-pulse me-2"></i>
                System Status
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Platform Health</span>
                <Badge bg={stats.systemHealth >= 80 ? "success" : stats.systemHealth >= 60 ? "warning" : "danger"}>
                  {stats.systemHealth}%
                </Badge>
              </div>
              <ProgressBar
                now={stats.systemHealth}
                variant={stats.systemHealth >= 80 ? "success" : stats.systemHealth >= 60 ? "warning" : "danger"}
                className="mb-3"
              />

              <div className="d-flex justify-content-between small mb-2">
                <span>Database</span>
                <Badge bg={systemMetrics.databaseStatus === 'online' ? "success" : "danger"}>
                  {systemMetrics.databaseStatus || 'Online'}
                </Badge>
              </div>
              <div className="d-flex justify-content-between small mb-2">
                <span>Authentication</span>
                <Badge bg={systemMetrics.authStatus === 'active' ? "success" : "warning"}>
                  {systemMetrics.authStatus || 'Active'}
                </Badge>
              </div>
              <div className="d-flex justify-content-between small mb-3">
                <span>File Storage</span>
                <Badge bg={systemMetrics.storageStatus === 'stable' ? "success" : "warning"}>
                  {systemMetrics.storageStatus || 'Stable'}
                </Badge>
              </div>

              <Button
                variant="outline-primary"
                size="sm"
                className="w-100"
                onClick={() => handleQuickAction('systemHealth')}
              >
                Detailed Report
              </Button>
            </Card.Body>
          </Card>

          {/* Quick Admin Tools */}
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-tools me-2"></i>
                Quick Tools
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleNavigation('/dashboard/admin/admissions/create')}
                >
                  <i className="bi bi-megaphone me-2"></i>
                  Publish Admission
                </Button>
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={() => handleNavigation('/dashboard/admin/institutions/create')}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Add Institution
                </Button>
                <Button
                  variant="outline-info"
                  size="sm"
                  onClick={() => handleNavigation('/dashboard/admin/reports')}
                >
                  <i className="bi bi-graph-up me-2"></i>
                  Generate Report
                </Button>
                <Button
                  variant="outline-warning"
                  size="sm"
                  onClick={() => handleNavigation('/dashboard/admin/audit')}
                >
                  <i className="bi bi-shield-check me-2"></i>
                  View Audit Log
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleRunDiagnostics}
                >
                  <i className="bi bi-gear me-2"></i>
                  Run Diagnostics
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* System Health Modal */}
      <Modal show={showSystemModal} onHide={() => setShowSystemModal(false)} size="lg">
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>
            <i className="bi bi-heart-pulse me-2"></i>
            System Health Report
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <h6>Platform Metrics</h6>
              <div className="d-flex justify-content-between mb-2">
                <span>Uptime</span>
                <Badge bg="success">{systemMetrics.uptime || '99.9%'}</Badge>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Response Time</span>
                <Badge bg="success">{systemMetrics.responseTime || '128ms'}</Badge>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>Error Rate</span>
                <Badge bg="success">{systemMetrics.errorRate || '0.2%'}</Badge>
              </div>
            </Col>
            <Col md={6}>
              <h6>Resource Usage</h6>
              <div className="d-flex justify-content-between mb-2">
                <span>CPU</span>
                <Badge bg={systemMetrics.cpuUsage < 70 ? "success" : "warning"}>
                  {systemMetrics.cpuUsage || '42'}%
                </Badge>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Memory</span>
                <Badge bg={systemMetrics.memoryUsage < 80 ? "success" : "warning"}>
                  {systemMetrics.memoryUsage || '68'}%
                </Badge>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>Storage</span>
                <Badge bg={systemMetrics.storageUsage < 80 ? "success" : "warning"}>
                  {systemMetrics.storageUsage || '35'}%
                </Badge>
              </div>
            </Col>
          </Row>

          {systemMetrics.diagnostics && (
            <div className="mt-3">
              <h6>Recent Diagnostics</h6>
              <Alert variant="info" className="small">
                <i className="bi bi-info-circle me-2"></i>
                Last diagnostics: {systemMetrics.diagnostics.timestamp || '2 days ago'}
              </Alert>
            </div>
          )}

          <Alert variant="info" className="small mt-3">
            <i className="bi bi-info-circle me-2"></i>
            System is operating within normal parameters. Last maintenance: 2 days ago.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSystemModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleRunDiagnostics}>
            Run Diagnostics
          </Button>
          <Button variant="success" onClick={() => handleNavigation('/dashboard/admin/reports')}>
            Detailed Analytics
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Approval Confirmation Modal */}
      <Modal show={showApprovalModal.show} onHide={() => setShowApprovalModal({ show: false, company: null, action: '' })}>
        <Modal.Header closeButton>
          <Modal.Title>
            {showApprovalModal.action === 'approve' ? 'Approve Company' : 'Reject Company'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {showApprovalModal.company && (
            <p>
              Are you sure you want to {showApprovalModal.action} <strong>{showApprovalModal.company.name}</strong>?
              {showApprovalModal.action === 'reject' && (
                <span className="text-danger"> This action cannot be undone.</span>
              )}
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowApprovalModal({ show: false, company: null, action: '' })}
          >
            Cancel
          </Button>
          <Button
            variant={showApprovalModal.action === 'approve' ? 'success' : 'danger'}
            onClick={() => {
              if (showApprovalModal.action === 'approve') {
                handleApproveCompany(showApprovalModal.company.id);
              } else {
                handleRejectCompany(showApprovalModal.company.id);
              }
            }}
          >
            {showApprovalModal.action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;
