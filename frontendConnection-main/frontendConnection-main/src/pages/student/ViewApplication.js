import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getStudentApplications,
  getStudentJobApplications,
  getStudentProfile
} from '../../services/studentServices';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Spinner,
  Alert
} from 'react-bootstrap';

const ViewApplication = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const location = useLocation();

  const [application, setApplication] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applicationType, setApplicationType] = useState('');

  useEffect(() => {
    if (user?.uid && applicationId) {
      loadApplication();
    }
  }, [user, applicationId]);

  const loadApplication = async () => {
    try {
      setIsLoading(true);

      // Determine application type from navigation state or try both
      const type = location.state?.type || '';
      setApplicationType(type);

      let applicationData = null;

      if (type === 'course' || !type) {
        const courseApps = await getStudentApplications(user.uid);
        if (courseApps.success) {
          applicationData = courseApps.data.find(app => app.id === applicationId);
        }
      }

      if ((type === 'job' || !type) && !applicationData) {
        const jobApps = await getStudentJobApplications(user.uid);
        if (jobApps.success) {
          applicationData = jobApps.data.find(app => app.id === applicationId);
          if (applicationData) setApplicationType('job');
        }
      }

      if (applicationData) {
        setApplication(applicationData);
      } else {
        console.error('Application not found');
      }

      // Load student profile
      const profileRes = await getStudentProfile(user.uid);
      if (profileRes.success) {
        setStudentProfile(profileRes.data);
      }
    } catch (error) {
      console.error('Error loading application:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';

    try {
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString();
      } else if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      } else {
        return 'Invalid Date';
      }
    } catch (error) {
      return 'N/A';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', label: 'Pending' },
      under_review: { variant: 'info', label: 'Under Review' },
      approved: { variant: 'success', label: 'Approved' },
      rejected: { variant: 'danger', label: 'Rejected' }
    };

    const config = statusConfig[status] || { variant: 'warning', label: 'Pending' };
    return <Badge bg={config.variant}>{config.label}</Badge>;
  };

  const navigateBack = () => navigate(-1);

  if (isLoading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted">Loading application details...</p>
        </div>
      </Container>
    );
  }

  if (!application) {
    return (
      <Container fluid className="px-4 py-3">
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm border-0 bg-light">
              <Card.Body className="py-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h1 className="h3 mb-1 fw-bold">Application Not Found</h1>
                    <p className="text-muted mb-0">The requested application could not be found.</p>
                  </div>
                  <Button variant="outline-secondary" onClick={navigateBack}>
                    ← Back
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid className="px-4 py-3">
      {/* Header Section */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0 bg-light">
            <Card.Body className="py-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h1 className="h3 mb-1 fw-bold">
                    {applicationType === 'job' ? 'Job' : 'Course'} Application Details
                  </h1>
                  <p className="text-muted mb-0">View your application information and status</p>
                </div>
                <Button variant="outline-secondary" onClick={navigateBack}>
                  ← Back to Applications
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={8} className="mx-auto">
          {/* Application Header */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h2 className="h4 mb-2">
                    {applicationType === 'job' ? application.jobTitle : application.courseName}
                  </h2>
                  <p className="text-muted mb-0">
                    Application ID: {application.id}
                  </p>
                </div>
                {getStatusBadge(application.status)}
              </div>
            </Card.Body>
          </Card>

          {/* Application Information */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0 fw-bold">Application Information</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted">Application Type</small>
                    <p className="mb-0 fw-bold">
                      {applicationType === 'job' ? 'Job Application' : 'Course Application'}
                    </p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted">Applied On</small>
                    <p className="mb-0 fw-bold">{formatDate(application.appliedAt)}</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted">Status</small>
                    <div>{getStatusBadge(application.status)}</div>
                  </div>
                </Col>
                {application.updatedAt && (
                  <Col md={6}>
                    <div className="mb-3">
                      <small className="text-muted">Last Updated</small>
                      <p className="mb-0 fw-bold">{formatDate(application.updatedAt)}</p>
                    </div>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>

          {/* Course/Job Details */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0 fw-bold">
                {applicationType === 'job' ? 'Job Details' : 'Course Details'}
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                {applicationType === 'job' ? (
                  <>
                    <Col md={6}>
                      <div className="mb-3">
                        <small className="text-muted">Job Title</small>
                        <p className="mb-0 fw-bold">{application.jobTitle}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <small className="text-muted">Company</small>
                        <p className="mb-0 fw-bold">{application.companyName}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <small className="text-muted">Location</small>
                        <p className="mb-0 fw-bold">{application.location || 'Not specified'}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <small className="text-muted">Job Type</small>
                        <p className="mb-0 fw-bold">{application.jobType || 'Not specified'}</p>
                      </div>
                    </Col>
                  </>
                ) : (
                  <>
                    <Col md={6}>
                      <div className="mb-3">
                        <small className="text-muted">Course Name</small>
                        <p className="mb-0 fw-bold">{application.courseName}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <small className="text-muted">Institution</small>
                        <p className="mb-0 fw-bold">{application.institutionName}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <small className="text-muted">Course Duration</small>
                        <p className="mb-0 fw-bold">{application.duration || 'Not specified'}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <small className="text-muted">Fees</small>
                        <p className="mb-0 fw-bold">{application.fees ? `$${application.fees}` : 'Not specified'}</p>
                      </div>
                    </Col>
                  </>
                )}
              </Row>
            </Card.Body>
          </Card>

          {/* Applicant Information */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0 fw-bold">Applicant Information</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted">Full Name</small>
                    <p className="mb-0 fw-bold">{studentProfile?.fullName || application.studentName}</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted">Email</small>
                    <p className="mb-0 fw-bold">{studentProfile?.email || application.studentEmail}</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted">Education Level</small>
                    <p className="mb-0 fw-bold">{studentProfile?.educationLevel || 'Not specified'}</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted">Phone</small>
                    <p className="mb-0 fw-bold">{studentProfile?.phone || 'Not provided'}</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Status Timeline */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0 fw-bold">Application Timeline</h5>
            </Card.Header>
            <Card.Body>
              <div className="timeline">
                <div className="d-flex align-items-center mb-4">
                  <div className="timeline-marker bg-success rounded-circle me-3" style={{ width: '20px', height: '20px' }}></div>
                  <div>
                    <h6 className="mb-1">Application Submitted</h6>
                    <p className="text-muted mb-0">{formatDate(application.appliedAt)}</p>
                  </div>
                </div>

                <div className="d-flex align-items-center mb-4">
                  <div className={`timeline-marker rounded-circle me-3 ${['under_review', 'approved', 'rejected'].includes(application.status) ? 'bg-success' : application.status === 'pending' ? 'bg-secondary' : 'bg-primary'}`} style={{ width: '20px', height: '20px' }}></div>
                  <div>
                    <h6 className="mb-1">Under Review</h6>
                    <p className="text-muted mb-0">
                      {application.status === 'under_review' ? 'Currently being reviewed' :
                        ['approved', 'rejected'].includes(application.status) ? 'Review completed' : 'Pending review'}
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-center">
                  <div className={`timeline-marker rounded-circle me-3 ${['approved', 'rejected'].includes(application.status) ? 'bg-success' : 'bg-secondary'}`} style={{ width: '20px', height: '20px' }}></div>
                  <div>
                    <h6 className="mb-1">Decision Made</h6>
                    <p className="text-muted mb-0">
                      {application.status === 'approved' ? 'Application approved' :
                        application.status === 'rejected' ? 'Application rejected' :
                          'Waiting for decision'}
                    </p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Action Buttons */}
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex gap-2 justify-content-end">
                <Button variant="outline-secondary" onClick={navigateBack}>
                  Back to Applications
                </Button>
                {application.status === 'pending' && (
                  <Button variant="outline-danger">
                    Withdraw Application
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ViewApplication;
