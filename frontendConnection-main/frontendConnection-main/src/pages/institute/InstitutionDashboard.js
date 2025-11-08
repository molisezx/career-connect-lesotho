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
  Row,
  Spinner
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getAdmissions,
  getCourses,
  getFaculties,
  getInstitutionData,
  getInstitutionStats,
  getRecentApplications,
  initializeInstitutionCollections,
  updateApplicationStatus,
} from "../../services/institutionServices";

const InstitutionDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    pendingApplications: 0,
    publishedAdmissions: 0,
    totalFaculties: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [institutionData, setInstitutionData] = useState(null);
  const [admissions, setAdmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadInstitutionData();
    }
  }, [user]);

  const loadInstitutionData = async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    setError(null);
    try {
      await initializeInstitutionCollections(user.uid);

      const [
        institutionData,
        statsData,
        applicationsData,
        facultiesData,
        coursesData,
        admissionsData,
      ] = await Promise.allSettled([
        getInstitutionData(user.uid),
        getInstitutionStats(user.uid),
        getRecentApplications(user.uid),
        getFaculties(user.uid),
        getCourses(user.uid),
        getAdmissions(user.uid),
      ]);

      setInstitutionData(
        institutionData.status === "fulfilled" ? institutionData.value : null
      );
      setStats(
        statsData.status === "fulfilled"
          ? statsData.value
          : {
            totalStudents: 0,
            activeCourses: 0,
            pendingApplications: 0,
            publishedAdmissions: 0,
            totalFaculties: 0,
          }
      );
      setRecentApplications(
        applicationsData.status === "fulfilled" ? applicationsData.value : []
      );
      setFaculties(
        facultiesData.status === "fulfilled" ? facultiesData.value : []
      );
      setCourses(coursesData.status === "fulfilled" ? coursesData.value : []);
      setAdmissions(
        admissionsData.status === "fulfilled" ? admissionsData.value : []
      );

      const errors = [
        institutionData,
        statsData,
        applicationsData,
        facultiesData,
        coursesData,
        admissionsData,
      ].filter((result) => result.status === "rejected");

      if (errors.length > 0) {
        const firstError = errors[0].reason;
        setError("Failed to load some data. Please try again.");
        console.error("Error loading dashboard data:", firstError);
      }
    } catch (error) {
      console.error("❌ Error loading institution data:", error);
      setError(error.message || "Failed to load institution data");
      setDefaultData();
    } finally {
      setIsLoading(false);
    }
  };

  const setDefaultData = () => {
    setInstitutionData({
      name: "Your Institution",
      type: "University",
      location: "Lesotho",
      accreditationStatus: "accredited",
    });

    setStats({
      totalStudents: 0,
      activeCourses: 0,
      pendingApplications: 0,
      publishedAdmissions: 0,
      totalFaculties: 0,
    });

    setRecentApplications([]);
    setFaculties([]);
    setCourses([]);
    setAdmissions([]);
  };

  const handleApplicationAction = async (applicationId, action) => {
    try {
      const result = await updateApplicationStatus(
        applicationId,
        action,
        user.uid
      );

      setRecentApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: action } : app
        )
      );

      const updatedStats = await getInstitutionStats(user.uid);
      setStats(updatedStats);

      if (result.autoRejectedCount > 0) {
        alert(
          `Application ${action} successfully! ${result.autoRejectedCount} other application(s) from this student were automatically rejected.`
        );
      } else {
        alert(`Application ${action} successfully!`);
      }
    } catch (error) {
      console.error("❌ Error updating application:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'manageFaculties':
        navigate('/dashboard/institution/faculties');
        break;
      case 'manageCourses':
        navigate('/dashboard/institution/courses');
        break;
      case 'reviewApplications':
        navigate('/dashboard/institution/applications');
        break;
      case 'publishAdmissions':
        navigate('/dashboard/institution/admissions');
        break;
      case 'studentManagement':
        navigate('/dashboard/institution/students');
        break;
      case 'institutionProfile':
        navigate('/dashboard/institution/profile');
        break;
      default:
        break;
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

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'active':
      case 'accredited':
        return 'success';
      case 'pending':
      case 'review':
        return 'warning';
      case 'rejected':
      case 'inactive':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Recently';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Recently';
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  if (isLoading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted">Loading your institution dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="institution-dashboard px-4 py-3">
      {/* Header Section */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0 bg-primary text-white">
            <Card.Body className="py-4">
              <Row className="align-items-center">
                <Col>
                  <div className="d-flex align-items-center">
                    <div
                      className="institution-avatar me-3 rounded-circle d-flex align-items-center justify-content-center bg-white text-primary"
                      style={{ width: '60px', height: '60px', fontSize: '1.5rem', fontWeight: 'bold' }}
                    >
                      {institutionData?.name?.charAt(0) || "I"}
                    </div>
                    <div>
                      <h1 className="h3 mb-1 fw-bold">
                        Welcome to your Institution Dashboard
                      </h1>
                      <p className="mb-0 opacity-75">
                        Manage your academic programs, student applications, and institutional profile.
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
                      {stats.pendingApplications > 0 && (
                        <Badge
                          bg="danger"
                          pill
                          className="position-absolute top-0 start-100 translate-middle"
                        >
                          {stats.pendingApplications}
                        </Badge>
                      )}
                    </Button>
                    <Dropdown>
                      <Dropdown.Toggle variant="light" size="sm" id="user-dropdown">
                        <i className="bi bi-person-circle me-2"></i>
                        {user?.displayName || user?.email}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleNavigation('/dashboard/institution/profile')}>
                          <i className="bi bi-person me-2"></i>
                          Profile
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleNavigation('/dashboard/institution/settings')}>
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

      {/* Institution Info Bar */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Body className="py-3">
              <Row className="align-items-center">
                <Col md={6}>
                  <div className="d-flex align-items-center">
                    <div
                      className="institution-badge me-3 rounded-circle d-flex align-items-center justify-content-center bg-light text-dark"
                      style={{ width: '50px', height: '50px', fontSize: '1.25rem', fontWeight: 'bold' }}
                    >
                      {institutionData?.name?.charAt(0) || "I"}
                    </div>
                    <div>
                      <h4 className="mb-1 fw-bold">{institutionData?.name || "Your Institution"}</h4>
                      <p className="mb-0 text-muted">
                        {institutionData?.type || "University"} • {institutionData?.location || "Lesotho"}
                      </p>
                    </div>
                  </div>
                </Col>
                <Col md={6} className="text-md-end">
                  <div className="d-flex flex-wrap justify-content-md-end gap-2">
                    {institutionData?.established && (
                      <Badge bg="light" text="dark">
                        Est. {institutionData.established}
                      </Badge>
                    )}
                    <Badge bg={getStatusVariant(institutionData?.accreditationStatus)}>
                      {institutionData?.accreditationStatus?.toUpperCase() || "FULLY ACCREDITED"}
                    </Badge>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" className="d-flex justify-content-between align-items-center">
              <div>{error}</div>
              <Button variant="outline-danger" size="sm" onClick={loadInstitutionData}>
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
            title="Total Students"
            value={stats.totalStudents || 0}
            change="+12 this month"
            icon="👨‍🎓"
            color="#3B82F6"
            onClick={() => handleNavigation('/dashboard/institution/students')}
          />
        </Col>
        <Col md={3}>
          <StatCard
            title="Active Courses"
            value={stats.activeCourses || 0}
            change={`Across ${faculties.length} faculties`}
            icon="📚"
            color="#10B981"
            onClick={() => handleNavigation('/dashboard/institution/courses')}
          />
        </Col>
        <Col md={3}>
          <StatCard
            title="Pending Applications"
            value={stats.pendingApplications || 0}
            change="Require review"
            icon="📝"
            color="#F59E0B"
            onClick={() => handleNavigation('/dashboard/institution/applications')}
          />
        </Col>
        <Col md={3}>
          <StatCard
            title="Published Admissions"
            value={stats.publishedAdmissions || 0}
            change="Active intakes"
            icon="🎓"
            color="#8B5CF6"
            onClick={() => handleNavigation('/dashboard/institution/admissions')}
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
              <p className="text-muted mb-0 small">Manage your institution efficiently</p>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={4} lg={2}>
                  <QuickActionCard
                    icon="🏛️"
                    title="Manage Faculties"
                    description="Add and organize academic faculties"
                    color="#3B82F6"
                    action="manageFaculties"
                  />
                </Col>
                <Col md={4} lg={2}>
                  <QuickActionCard
                    icon="📚"
                    title="Manage Courses"
                    description="Create and update course programs"
                    color="#10B981"
                    action="manageCourses"
                  />
                </Col>
                <Col md={4} lg={2}>
                  <QuickActionCard
                    icon="📋"
                    title="Review Applications"
                    description="Process student applications"
                    color="#F59E0B"
                    action="reviewApplications"
                  />
                </Col>
                <Col md={4} lg={2}>
                  <QuickActionCard
                    icon="🎓"
                    title="Publish Admissions"
                    description="Create new admission cycles"
                    color="#8B5CF6"
                    action="publishAdmissions"
                  />
                </Col>
                <Col md={4} lg={2}>
                  <QuickActionCard
                    icon="👥"
                    title="Student Management"
                    description="Manage enrolled students"
                    color="#EC4899"
                    action="studentManagement"
                  />
                </Col>
                <Col md={4} lg={2}>
                  <QuickActionCard
                    icon="🏫"
                    title="Institution Profile"
                    description="Update institution information"
                    color="#06B6D4"
                    action="institutionProfile"
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
          {/* Recent Applications */}
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-people me-2"></i>
                  Recent Applications
                </h5>
                <p className="text-muted mb-0 small">Latest student applications</p>
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleNavigation('/dashboard/institution/applications')}
              >
                View All
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {recentApplications.length > 0 ? (
                <ListGroup variant="flush">
                  {recentApplications.slice(0, 5).map((application, index) => (
                    <ListGroup.Item
                      key={application.id || index}
                      className="px-3 py-3 border-bottom"
                    >
                      <div className="d-flex align-items-center">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center bg-light text-dark me-3"
                          style={{ width: '40px', height: '40px' }}
                        >
                          {application.studentName?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{application.studentName || 'Student'}</h6>
                          <p className="mb-1 text-muted small">
                            {application.courseName || application.course || 'Course'}
                          </p>
                          <small className="text-muted">
                            Applied {formatDate(application.createdAt)}
                          </small>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg={getStatusVariant(application.status)}>
                            {application.status || 'Pending'}
                          </Badge>
                          {application.status === 'pending' && (
                            <div className="d-flex gap-1">
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleApplicationAction(application.id, 'approved')}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleApplicationAction(application.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-people display-1 text-muted"></i>
                  <p className="text-muted mt-3">No applications yet</p>
                  <small className="text-muted">Applications will appear here when students apply</small>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Course Management */}
          <Card className="shadow-sm border-0 mt-4">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-book me-2"></i>
                  Recent Courses
                </h5>
                <p className="text-muted mb-0 small">Your current course offerings</p>
              </div>
              <Button
                variant="primary"
                onClick={() => handleNavigation('/dashboard/institution/courses')}
              >
                <i className="bi bi-plus me-2"></i>
                Manage Courses
              </Button>
            </Card.Header>
            <Card.Body>
              {courses.length > 0 ? (
                <Row className="g-3">
                  {courses.map((course) => (
                    <Col md={6} key={course.id}>
                      <Card className="h-100 border-0 shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="fw-bold mb-0">{course.name || 'Untitled Course'}</h6>
                            <Badge bg={getStatusVariant(course.status)}>
                              {course.status || 'Active'}
                            </Badge>
                          </div>
                          <p className="text-muted small mb-2">{course.facultyName || 'General'}</p>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="fw-bold text-primary">{course.duration || 'Duration not specified'}</span>
                            <small className="text-muted">
                              {course.enrolledStudents || 0} students
                            </small>
                          </div>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleNavigation(`/dashboard/institution/courses?view=${course.id}`)}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleNavigation(`/dashboard/institution/courses?edit=${course.id}`)}
                            >
                              Edit
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-book display-1 text-muted"></i>
                  <p className="text-muted mt-3">No courses found</p>
                  <Button
                    variant="primary"
                    onClick={() => handleNavigation('/dashboard/institution/courses')}
                  >
                    Create Your First Course
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column */}
        <Col lg={4}>
          {/* Active Admissions */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-mortarboard me-2"></i>
                Active Admissions
              </h5>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleNavigation('/dashboard/institution/admissions')}
              >
                Manage
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {admissions.length > 0 ? (
                <ListGroup variant="flush">
                  {admissions.map((admission) => (
                    <ListGroup.Item key={admission.id} className="px-3 py-3 border-bottom">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="fw-bold mb-1">{admission.title || 'Admission'}</h6>
                        <Badge bg={getStatusVariant(admission.status)}>
                          {admission.status || 'Active'}
                        </Badge>
                      </div>
                      <p className="text-muted small mb-2">
                        {admission.description || 'No description available'}
                      </p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          Deadline: {formatDate(admission.deadline)}
                        </small>
                        <small className="fw-bold">
                          {admission.applicationCount || 0} applications
                        </small>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-mortarboard text-muted display-6"></i>
                  <p className="text-muted mt-2 small">No active admissions</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Faculty Overview */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-building me-2"></i>
                Faculties & Departments
              </h5>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleNavigation('/dashboard/institution/faculties')}
              >
                Manage
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {faculties.length > 0 ? (
                <ListGroup variant="flush">
                  {faculties.slice(0, 3).map((faculty) => (
                    <ListGroup.Item key={faculty.id} className="px-3 py-2 border-bottom">
                      <div className="d-flex align-items-center">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white me-3"
                          style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}
                        >
                          🏛️
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-0 small fw-bold">{faculty.name || 'Faculty'}</h6>
                          <small className="text-muted">
                            {faculty.departmentCount || 0} Departments
                          </small>
                        </div>
                        <div>
                          <Badge bg="light" text="dark" className="small">
                            {faculty.courseCount || 0} Courses
                          </Badge>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-3">
                  <i className="bi bi-building text-muted"></i>
                  <p className="text-muted mt-2 small">No faculties found</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Quick Stats */}
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-graph-up me-2"></i>
                This Month
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between text-center">
                <div>
                  <h4 className="fw-bold text-primary">{stats.pendingApplications}</h4>
                  <small className="text-muted">New Applications</small>
                </div>
                <div>
                  <h4 className="fw-bold text-success">{stats.activeCourses}</h4>
                  <small className="text-muted">Active Courses</small>
                </div>
                <div>
                  <h4 className="fw-bold text-warning">89%</h4>
                  <small className="text-muted">Satisfaction Rate</small>
                </div>
              </div>
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
          <p>You have {stats.pendingApplications} pending applications to review.</p>
          <Button
            variant="primary"
            onClick={() => {
              setShowNotificationModal(false);
              handleNavigation('/dashboard/institution/applications');
            }}
          >
            Review Applications
          </Button>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default InstitutionDashboard;
