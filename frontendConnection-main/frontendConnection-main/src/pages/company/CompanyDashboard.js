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
import { dashboardService } from "../../services/companyServices";

const CompanyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    applications: 0,
    profileViews: 0,
    totalApplicants: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [jobListings, setJobListings] = useState([]);
  const [companyData, setCompanyData] = useState(null);
  const [pipelineStats, setPipelineStats] = useState({});
  const [topCandidates, setTopCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("🔄 Loading company dashboard data...");

      const dashboardData = await dashboardService.getDashboardData();
      console.log("📊 Dashboard data loaded:", dashboardData);

      setCompanyData(dashboardData.company || {});
      setStats(dashboardData.stats || {
        totalJobs: 0,
        activeJobs: 0,
        applications: 0,
        profileViews: 0,
        totalApplicants: 0
      });
      setRecentApplications(dashboardData.recentApplications || []);
      setJobListings(dashboardData.jobListings || []);
      setPipelineStats(dashboardData.pipelineStats || {});
      setTopCandidates(dashboardData.topCandidates || []);
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
      setRecentApplications([]);
      setJobListings([]);
      setTopCandidates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'postJob':
        navigate('/dashboard/company/jobs/new');
        break;
      case 'reviewCandidates':
        navigate('/dashboard/company/applications');
        break;
      case 'updateProfile':
        navigate('/dashboard/company/profile');
        break;
      case 'viewAnalytics':
        navigate('/dashboard/company/analytics');
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

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'hired':
      case 'active':
      case 'approved':
        return 'success';
      case 'reviewed':
      case 'interview':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted">Loading your company dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="company-dashboard px-4 py-3">
      {/* Header Section */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0 bg-primary text-white">
            <Card.Body className="py-4">
              <Row className="align-items-center">
                <Col>
                  <div className="d-flex align-items-center">
                    <div
                      className="company-avatar me-3 rounded-circle d-flex align-items-center justify-content-center bg-white text-primary"
                      style={{ width: '60px', height: '60px', fontSize: '1.5rem', fontWeight: 'bold' }}
                    >
                      {companyData?.name?.charAt(0) || "C"}
                    </div>
                    <div>
                      <h1 className="h3 mb-1 fw-bold">
                        Welcome back, {companyData?.name || "Your Company"}!
                      </h1>
                      <p className="mb-0 opacity-75">
                        Here's what's happening with your hiring today.
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
                      {stats.applications > 0 && (
                        <Badge
                          bg="danger"
                          pill
                          className="position-absolute top-0 start-100 translate-middle"
                        >
                          {stats.applications}
                        </Badge>
                      )}
                    </Button>
                    <Dropdown>
                      <Dropdown.Toggle variant="light" size="sm" id="user-dropdown">
                        <i className="bi bi-person-circle me-2"></i>
                        {user?.displayName || user?.email}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleNavigation('/dashboard/company/profile')}>
                          <i className="bi bi-person me-2"></i>
                          Profile
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleNavigation('/dashboard/company/settings')}>
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
            title="Total Jobs Posted"
            value={stats.totalJobs || 0}
            change={`${stats.activeJobs || 0} active`}
            icon="💼"
            color="#3B82F6"
            onClick={() => handleNavigation('/dashboard/company/jobs')}
          />
        </Col>
        <Col md={3}>
          <StatCard
            title="Active Jobs"
            value={stats.activeJobs || 0}
            change={`${stats.totalApplicants || 0} total applicants`}
            icon="📊"
            color="#10B981"
            onClick={() => handleNavigation('/dashboard/company/jobs')}
          />
        </Col>
        <Col md={3}>
          <StatCard
            title="Applications"
            value={stats.applications || 0}
            change={`${pipelineStats.new || 0} new`}
            icon="📝"
            color="#F59E0B"
            onClick={() => handleNavigation('/dashboard/company/applications')}
          />
        </Col>
        <Col md={3}>
          <StatCard
            title="Profile Views"
            value={stats.profileViews || 0}
            change="This month"
            icon="👁️"
            color="#8B5CF6"
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
              <p className="text-muted mb-0 small">Manage your hiring process efficiently</p>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={3}>
                  <QuickActionCard
                    icon="➕"
                    title="Post New Job"
                    description="Create a new job listing"
                    color="#3B82F6"
                    action="postJob"
                  />
                </Col>
                <Col md={3}>
                  <QuickActionCard
                    icon="👥"
                    title="Review Candidates"
                    description="View and manage applications"
                    color="#10B981"
                    action="reviewCandidates"
                  />
                </Col>
                <Col md={3}>
                  <QuickActionCard
                    icon="🏢"
                    title="Update Profile"
                    description="Edit company information"
                    color="#F59E0B"
                    action="updateProfile"
                  />
                </Col>
                <Col md={3}>
                  <QuickActionCard
                    icon="📈"
                    title="View Analytics"
                    description="See hiring metrics and insights"
                    color="#8B5CF6"
                    action="viewAnalytics"
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
                <p className="text-muted mb-0 small">Latest candidate applications</p>
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleNavigation('/dashboard/company/applications')}
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
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleNavigation(`/dashboard/company/applications/${application.id}`)}
                    >
                      <div className="d-flex align-items-center">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center bg-light text-dark me-3"
                          style={{ width: '40px', height: '40px' }}
                        >
                          {application.candidate?.fullName?.charAt(0) || 'C'}
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{application.candidate?.fullName || 'Candidate'}</h6>
                          <p className="mb-1 text-muted small">{application.jobTitle || 'Position'}</p>
                          <small className="text-muted">
                            Applied {formatDate(application.appliedAt)}
                          </small>
                        </div>
                        <div>
                          <Badge bg={getStatusVariant(application.status)}>
                            {application.status || 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-people display-1 text-muted"></i>
                  <p className="text-muted mt-3">No applications yet</p>
                  <small className="text-muted">Applications will appear here when candidates apply</small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column */}
        <Col lg={4}>
          {/* Hiring Pipeline */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-funnel me-2"></i>
                Hiring Pipeline
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="pipeline-stats">
                {[
                  { stage: 'new', label: 'New Applications', variant: 'primary' },
                  { stage: 'reviewed', label: 'Under Review', variant: 'warning' },
                  { stage: 'interview', label: 'Interview', variant: 'info' },
                  { stage: 'hired', label: 'Hired', variant: 'success' }
                ].map(({ stage, label, variant }, index) => (
                  <div key={stage} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small fw-medium">{label}</span>
                      <span className="fw-bold">{pipelineStats[stage] || 0}</span>
                    </div>
                    <ProgressBar
                      now={((pipelineStats[stage] || 0) / Math.max(stats.applications, 1)) * 100}
                      variant={variant}
                      style={{ height: '6px' }}
                    />
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Top Candidates */}
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-star me-2"></i>
                Top Candidates
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              {topCandidates.length > 0 ? (
                <ListGroup variant="flush">
                  {topCandidates.slice(0, 3).map((candidate, index) => (
                    <ListGroup.Item
                      key={candidate.id || index}
                      className="px-3 py-2 border-bottom"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleNavigation(`/dashboard/company/applications/${candidate.id}`)}
                    >
                      <div className="d-flex align-items-center">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white me-3"
                          style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}
                        >
                          {candidate.candidate?.fullName?.charAt(0) || 'C'}
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-0 small fw-bold">{candidate.candidate?.fullName || 'Candidate'}</h6>
                          <small className="text-muted">{candidate.jobTitle || 'Position'}</small>
                        </div>
                        <div>
                          <Badge bg="success" className="small">
                            {candidate.matchScore || '0'}%
                          </Badge>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-3">
                  <i className="bi bi-star text-muted"></i>
                  <p className="text-muted mt-2 small">No top candidates yet</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Job Listings */}
      <Row className="g-4 mt-2">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-briefcase me-2"></i>
                  Active Job Listings
                </h5>
                <p className="text-muted mb-0 small">Your current job postings</p>
              </div>
              <Button
                variant="primary"
                onClick={() => handleNavigation('/dashboard/company/jobs/new')}
              >
                <i className="bi bi-plus me-2"></i>
                Post New Job
              </Button>
            </Card.Header>
            <Card.Body>
              {jobListings.length > 0 ? (
                <Row className="g-3">
                  {jobListings.map((job) => (
                    <Col md={6} lg={4} key={job.id}>
                      <Card className="h-100 border-0 shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="fw-bold mb-0">{job.title || 'Untitled Job'}</h6>
                            <Badge bg={getStatusVariant(job.status)}>
                              {job.status || 'Active'}
                            </Badge>
                          </div>
                          <p className="text-muted small mb-2">{job.type || 'Full-time'}</p>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="fw-bold text-primary">{job.salary || 'Salary not specified'}</span>
                            <small className="text-muted">
                              {job.applicantsCount || 0} applicants
                            </small>
                          </div>
                          <div className="d-grid gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleNavigation(`/dashboard/company/jobs/${job.id}`)}
                            >
                              View Details
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-briefcase display-1 text-muted"></i>
                  <p className="text-muted mt-3">No active job listings</p>
                  <Button
                    variant="primary"
                    onClick={() => handleNavigation('/dashboard/company/jobs/new')}
                  >
                    Post Your First Job
                  </Button>
                </div>
              )}
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
          <p>You have {stats.applications} new applications to review.</p>
          <Button
            variant="primary"
            onClick={() => {
              setShowNotificationModal(false);
              handleNavigation('/dashboard/company/applications');
            }}
          >
            Review Applications
          </Button>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default CompanyDashboard;
