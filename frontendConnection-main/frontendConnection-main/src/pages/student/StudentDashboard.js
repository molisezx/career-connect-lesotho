import { useEffect, useState } from "react";
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
  Spinner
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getDashboardStats,
  getJobMatchNotifications,
  getStudentAdmissions,
  getStudentNotifications,
  getStudentProfile,
  initializeStudentProfile,
} from "../../services/studentServices";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingApplications: 0,
    admissions: 0,
    jobMatches: 0,
    profileCompletion: 0,
    unreadNotifications: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMultipleAdmissions, setHasMultipleAdmissions] = useState(false);
  const [jobMatchNotifications, setJobMatchNotifications] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    try {
      console.log("🔄 Loading dashboard data for user:", user.uid);

      try {
        const profileResult = await getStudentProfile(user.uid);
        if (!profileResult.success || !profileResult.data) {
          console.log("📝 Initializing student profile...");
          const initResult = await initializeStudentProfile(user.uid, {
            fullName: user.displayName || user.email?.split("@")[0] || "Student",
            email: user.email,
          });
          if (!initResult.success) {
            console.warn("⚠️ Profile initialization had issues:", initResult.error);
          }
        }
      } catch (profileError) {
        console.warn("⚠️ Profile check failed:", profileError);
      }

      const [statsRes, notificationsRes, admissionsRes, jobMatchesRes] = await Promise.allSettled([
        getDashboardStats(user.uid),
        getStudentNotifications(user.uid),
        getStudentAdmissions(user.uid),
        getJobMatchNotifications(user.uid),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value.success) {
        setStats(statsRes.value.data);
      } else {
        setStats(prev => ({
          ...prev,
          pendingApplications: 0,
          admissions: 0,
          jobMatches: 0,
          unreadNotifications: 0,
        }));
      }

      if (notificationsRes.status === "fulfilled" && notificationsRes.value.success) {
        const recentNotifications = notificationsRes.value.data.slice(0, 4).map((notif) => ({
          id: notif.id,
          type: notif.type,
          message: notif.message,
          time: formatTimeAgo(notif.createdAt),
          status: notif.read ? "read" : "new",
          metadata: notif.metadata,
        }));
        setRecentActivity(recentNotifications);
      } else {
        setRecentActivity([]);
      }

      if (admissionsRes.status === "fulfilled" && admissionsRes.value.success) {
        setHasMultipleAdmissions(admissionsRes.value.data.length > 1);
      } else {
        setHasMultipleAdmissions(false);
      }

      if (jobMatchesRes.status === "fulfilled" && jobMatchesRes.value.success) {
        setJobMatchNotifications(jobMatchesRes.value.data.slice(0, 3));
      } else {
        setJobMatchNotifications([]);
      }
    } catch (error) {
      console.error("❌ Error loading dashboard:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToCourses = () => navigate("/dashboard/student/courses");
  const navigateToInstitutions = () => navigate("/dashboard/student/institutions");
  const navigateToJobs = () => navigate("/dashboard/student/jobs");
  const navigateToApplications = () => navigate("/dashboard/student/applications");
  const navigateToProfile = () => navigate("/dashboard/student/profile");
  const navigateToDocuments = () => navigate("/dashboard/student/documents");
  const navigateToNotifications = () => navigate("/dashboard/student/notifications");
  const navigateToAdmissionSelection = () => navigate("/dashboard/student/admission-selection");
  const navigateToJobMatches = () => navigate("/dashboard/student/job-matches");

  const handleQuickAction = (action) => {
    switch (action) {
      case 'browseCourses':
        navigateToCourses();
        break;
      case 'findInstitutions':
        navigateToInstitutions();
        break;
      case 'jobOpportunities':
        navigateToJobs();
        break;
      case 'myApplications':
        navigateToApplications();
        break;
      default:
        break;
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return "Recently";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return "Recently";
      const now = new Date();
      const diffInHours = Math.floor((now - dateObj) / (1000 * 60 * 60));
      if (diffInHours < 1) return "Just now";
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
      return dateObj.toLocaleDateString();
    } catch {
      return "Recently";
    }
  };

  const StatCard = ({ title, value, change, icon, color, onClick }) => (
    <Card
      className="stat-card h-100 shadow-sm border-0"
      style={{ borderLeft: `4px solid ${color}` }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <Card.Body>
        <div className="d-flex align-items-center mb-2">
          <div
            className="stat-icon me-3 rounded-circle d-flex align-items-center justify-content-center"
            style={{
              backgroundColor: `${color}20`,
              width: '48px',
              height: '48px'
            }}
          >
            <span style={{ fontSize: '1.25rem', color: color }}>{icon}</span>
          </div>
          <div>
            <h3 className="mb-0 fw-bold" style={{ color: color }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </h3>
            <small className="text-muted">{title}</small>
          </div>
        </div>
        {change && (
          <Badge bg="light" text="dark" className="mt-2">
            {change}
          </Badge>
        )}
      </Card.Body>
    </Card>
  );

  const QuickActionCard = ({ icon, title, description, action, color }) => (
    <Card
      className="quick-action-card h-100 shadow-sm border-0"
      style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
      onClick={() => handleQuickAction(action)}
    >
      <Card.Body className="text-center p-4">
        <div
          className="action-icon mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: `${color}20`,
            width: '64px',
            height: '64px'
          }}
        >
          <span style={{ fontSize: '1.5rem', color: color }}>{icon}</span>
        </div>
        <h5 className="fw-bold mb-2">{title}</h5>
        <p className="text-muted small mb-0">{description}</p>
      </Card.Body>
    </Card>
  );

  const getActivityIcon = (type) => {
    switch (type) {
      case 'application': return '📝';
      case 'admission': return '🎓';
      case 'job_match': return '💼';
      case 'job_application': return '📨';
      case 'profile': return '👁️';
      default: return '🔔';
    }
  };

  if (isLoading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted">Loading your dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="student-dashboard px-4 py-3">
      {/* Header Section */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0 bg-primary text-white">
            <Card.Body className="py-4">
              <Row className="align-items-center">
                <Col>
                  <div className="d-flex align-items-center">
                    <div
                      className="student-avatar me-3 rounded-circle d-flex align-items-center justify-content-center bg-white text-primary"
                      style={{ width: '60px', height: '60px', fontSize: '1.5rem', fontWeight: 'bold' }}
                    >
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "S"}
                    </div>
                    <div>
                      <h1 className="h3 mb-1 fw-bold">
                        Welcome back, {user?.displayName || user?.email?.split("@")[0] || "Student"}!
                      </h1>
                      <p className="mb-0 opacity-75">
                        Here's what's happening with your academic and career journey today.
                      </p>
                    </div>
                  </div>
                </Col>
                <Col xs="auto">
                  <div className="d-flex gap-2">
                    <Button
                      variant="light"
                      size="sm"
                      className="position-relative"
                      onClick={() => setShowNotificationModal(true)}
                    >
                      <i className="bi bi-bell"></i>
                      {stats.unreadNotifications > 0 && (
                        <Badge
                          bg="danger"
                          pill
                          className="position-absolute top-0 start-100 translate-middle"
                        >
                          {stats.unreadNotifications}
                        </Badge>
                      )}
                    </Button>
                    <Dropdown>
                      <Dropdown.Toggle variant="light" size="sm" id="user-dropdown">
                        <i className="bi bi-person-circle me-2"></i>
                        {user?.displayName || user?.email}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={navigateToProfile}>
                          <i className="bi bi-person me-2"></i>
                          Profile
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => navigate('/dashboard/student/settings')}>
                          <i className="bi bi-gear me-2"></i>
                          Settings
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item>
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

      {/* Profile Progress */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold">Profile Completion</span>
                <span className="fw-bold text-primary">{stats.profileCompletion}%</span>
              </div>
              <ProgressBar
                now={stats.profileCompletion}
                variant="primary"
                style={{ height: '8px' }}
              />
              <p className="text-muted small mt-2 mb-0">
                Complete your profile to get better job and course recommendations
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Multiple Admissions Alert */}
      {hasMultipleAdmissions && (
        <Row className="mb-4">
          <Col>
            <Alert variant="warning" className="d-flex align-items-center">
              <div className="me-3" style={{ fontSize: '1.5rem' }}>🎓</div>
              <div className="flex-grow-1">
                <Alert.Heading className="h6 mb-1">Multiple Admissions Received!</Alert.Heading>
                <p className="mb-0">You have been admitted to multiple institutions. Please select one to confirm your enrollment.</p>
              </div>
              <Button variant="outline-warning" size="sm" onClick={navigateToAdmissionSelection}>
                Select Institution
              </Button>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Job Matches Alert */}
      {jobMatchNotifications.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Alert variant="info" className="d-flex align-items-center">
              <div className="me-3" style={{ fontSize: '1.5rem' }}>💼</div>
              <div className="flex-grow-1">
                <Alert.Heading className="h6 mb-1">New Job Matches!</Alert.Heading>
                <p className="mb-0">You qualify for {jobMatchNotifications.length} new job position(s) based on your profile.</p>
              </div>
              <Button variant="outline-info" size="sm" onClick={navigateToJobMatches}>
                View Matches
              </Button>
            </Alert>
          </Col>
        </Row>
      )}

      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" className="d-flex justify-content-between align-items-center">
              <div>{error}</div>
              <Button variant="outline-danger" size="sm" onClick={loadDashboardData}>
                Retry
              </Button>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Stats Overview */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <StatCard
            title="Pending Applications"
            value={stats.pendingApplications || 0}
            change="Track your applications"
            icon="📝"
            color="#3B82F6"
            onClick={navigateToApplications}
          />
        </Col>
        <Col md={3}>
          <StatCard
            title="Admissions"
            value={stats.admissions || 0}
            change="Accepted programs"
            icon="🎓"
            color="#10B981"
          />
        </Col>
        <Col md={3}>
          <StatCard
            title="Job Matches"
            value={stats.jobMatches || 0}
            change="Qualified positions"
            icon="💼"
            color="#F59E0B"
            onClick={navigateToJobMatches}
          />
        </Col>
        <Col md={3}>
          <StatCard
            title="Unread Notifications"
            value={stats.unreadNotifications || 0}
            change="New updates"
            icon="🔔"
            color="#8B5CF6"
            onClick={() => setShowNotificationModal(true)}
          />
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-lightning me-2"></i>
                Quick Actions
              </h5>
              <p className="text-muted mb-0 small">Get started with these essential tasks</p>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={3}>
                  <QuickActionCard
                    icon="📚"
                    title="Browse Courses"
                    description="Discover courses from top institutions in Lesotho"
                    color="#3B82F6"
                    action="browseCourses"
                  />
                </Col>
                <Col md={3}>
                  <QuickActionCard
                    icon="🏫"
                    title="Find Institutions"
                    description="Explore universities and colleges"
                    color="#10B981"
                    action="findInstitutions"
                  />
                </Col>
                <Col md={3}>
                  <QuickActionCard
                    icon="💼"
                    title="Job Opportunities"
                    description="Find your dream career after graduation"
                    color="#F59E0B"
                    action="jobOpportunities"
                  />
                </Col>
                <Col md={3}>
                  <QuickActionCard
                    icon="📄"
                    title="My Applications"
                    description="Track your course and job applications"
                    color="#EF4444"
                    action="myApplications"
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
          {/* Recent Activity */}
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-activity me-2"></i>
                  Recent Activity
                </h5>
                <p className="text-muted mb-0 small">Your latest notifications and updates</p>
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={navigateToNotifications}
              >
                View All
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {recentActivity.length > 0 ? (
                <ListGroup variant="flush">
                  {recentActivity.map((activity) => (
                    <ListGroup.Item key={activity.id} className="px-3 py-3 border-bottom">
                      <div className="d-flex align-items-center">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center bg-light text-dark me-3"
                          style={{ width: '40px', height: '40px' }}
                        >
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-grow-1">
                          <p className="mb-1">{activity.message}</p>
                          <small className="text-muted">{activity.time}</small>
                          {activity.metadata?.matchScore && (
                            <Badge bg="success" className="ms-2">
                              Match: {activity.metadata.matchScore}%
                            </Badge>
                          )}
                        </div>
                        <Badge bg={activity.status === 'new' ? 'primary' : 'secondary'}>
                          {activity.status === 'new' ? 'New' : 'Read'}
                        </Badge>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-activity display-1 text-muted"></i>
                  <p className="text-muted mt-3">No recent activity</p>
                  <small className="text-muted">Your notifications will appear here</small>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Profile Completion */}
          <Card className="shadow-sm border-0 mt-4">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-person-check me-2"></i>
                Complete Your Profile
              </h5>
              <p className="text-muted mb-0 small">Boost your chances with a complete profile</p>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={4}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <div className="mb-3" style={{ fontSize: '2rem' }}>📝</div>
                      <h6 className="fw-bold">Personal Information</h6>
                      <p className="text-muted small mb-3">Add your contact details and background</p>
                      <Button variant="outline-primary" size="sm" onClick={navigateToProfile}>
                        Complete
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <div className="mb-3" style={{ fontSize: '2rem' }}>🎓</div>
                      <h6 className="fw-bold">Education History</h6>
                      <p className="text-muted small mb-3">Add your academic qualifications</p>
                      <Button variant="outline-primary" size="sm" onClick={navigateToProfile}>
                        Complete
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <div className="mb-3" style={{ fontSize: '2rem' }}>📄</div>
                      <h6 className="fw-bold">Upload Documents</h6>
                      <p className="text-muted small mb-3">Add your resume and transcripts</p>
                      <Button variant="outline-primary" size="sm" onClick={navigateToDocuments}>
                        Upload
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column */}
        <Col lg={4}>
          {/* Job Matches */}
          {stats.jobMatches > 0 && (
            <Card className="shadow-sm border-0 mb-4">
              <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-briefcase me-2"></i>
                  Your Job Matches
                </h5>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={navigateToJobMatches}
                >
                  View All
                </Button>
              </Card.Header>
              <Card.Body className="p-0">
                <ListGroup variant="flush">
                  {jobMatchNotifications.slice(0, 3).map((jobMatch) => (
                    <ListGroup.Item key={jobMatch.id} className="px-3 py-3 border-bottom">
                      <div className="d-flex align-items-center">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center bg-warning text-white me-3"
                          style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}
                        >
                          💼
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-0 small fw-bold">
                            {jobMatch.metadata?.jobTitle || 'Job Position'}
                          </h6>
                          <small className="text-muted">
                            {jobMatch.metadata?.companyName || 'Company'}
                          </small>
                          {jobMatch.metadata?.matchScore && (
                            <Badge bg="success" className="ms-2 small">
                              {jobMatch.metadata.matchScore}% Match
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/dashboard/student/jobs?apply=${jobMatch.jobId}`)}
                        >
                          Apply
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          )}

          {/* Profile Strength */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-graph-up me-2"></i>
                Profile Strength
              </h5>
            </Card.Header>
            <Card.Body>
              <ProgressBar
                now={stats.profileCompletion}
                variant="primary"
                className="mb-3"
                style={{ height: '6px' }}
              />
              <div className="d-flex justify-content-between small mb-2">
                <span>Basic Info</span>
                <span>{stats.profileCompletion >= 20 ? '✅' : '⏳'}</span>
              </div>
              <div className="d-flex justify-content-between small mb-2">
                <span>Education</span>
                <span>{stats.profileCompletion >= 40 ? '✅' : '⏳'}</span>
              </div>
              <div className="d-flex justify-content-between small mb-2">
                <span>Skills</span>
                <span>{stats.profileCompletion >= 60 ? '✅' : '⏳'}</span>
              </div>
              <div className="d-flex justify-content-between small mb-3">
                <span>Documents</span>
                <span>{stats.profileCompletion >= 80 ? '✅' : '⏳'}</span>
              </div>
              <Button variant="outline-primary" size="sm" className="w-100" onClick={navigateToProfile}>
                Improve Profile
              </Button>
            </Card.Body>
          </Card>

          {/* Quick Tips */}
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-lightbulb me-2"></i>
                Quick Tips
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <ListGroup variant="flush">
                <ListGroup.Item className="px-3 py-2 border-bottom">
                  <div className="d-flex align-items-center">
                    <div className="me-3" style={{ fontSize: '1.25rem' }}>🎯</div>
                    <small>Complete your profile to get better job recommendations</small>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="px-3 py-2 border-bottom">
                  <div className="d-flex align-items-center">
                    <div className="me-3" style={{ fontSize: '1.25rem' }}>📚</div>
                    <small>Apply to courses that match your qualifications</small>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="px-3 py-2">
                  <div className="d-flex align-items-center">
                    <div className="me-3" style={{ fontSize: '1.25rem' }}>💼</div>
                    <small>Check job matches regularly for new opportunities</small>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Notification Modal */}
      <Modal show={showNotificationModal} onHide={() => setShowNotificationModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Notifications</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You have {stats.unreadNotifications} unread notifications.</p>
          <Button
            variant="primary"
            onClick={() => {
              setShowNotificationModal(false);
              navigateToNotifications();
            }}
          >
            View Notifications
          </Button>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default StudentDashboard;
