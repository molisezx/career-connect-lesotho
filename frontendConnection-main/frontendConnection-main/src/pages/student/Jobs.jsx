// pages/student/Jobs.jsx
import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Row,
  Spinner
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jobService } from '../../services/jobService';
import { getStudentApplications } from '../../services/studentServices';

const StudentJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [studentApplications, setStudentApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [message, setMessage] = useState('');
  const [jobTypes, setJobTypes] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (user?.uid) {
      loadJobs();
    }
  }, [user]);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, selectedType, selectedLocation]);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      setMessage('');

      console.log("🔄 Loading jobs and applications...");

      const [jobsResult, applicationsResult] = await Promise.all([
        jobService.getActiveJobs(),
        getStudentApplications(user.uid)
      ]);

      if (jobsResult.success) {
        const jobsData = jobsResult.data || [];
        console.log(`📊 Loaded ${jobsData.length} active jobs`);
        setJobs(jobsData);

        // Extract unique types and locations for filters
        const types = [...new Set(jobsData.map(job => job.type).filter(Boolean))];
        const locs = [...new Set(jobsData.map(job => job.location).filter(Boolean))];
        setJobTypes(types);
        setLocations(locs);
      } else {
        console.error("❌ Failed to load jobs:", jobsResult.error);
        setMessage('Error loading jobs. Please try again.');
        setJobs([]);
        setJobTypes([]);
        setLocations([]);
      }

      if (applicationsResult.success) {
        const applications = applicationsResult.data || [];
        console.log(`📋 Loaded ${applications.length} applications`);
        setStudentApplications(applications);
      } else {
        console.warn("⚠️ Failed to load applications:", applicationsResult.error);
        setStudentApplications([]);
      }
    } catch (error) {
      console.error('❌ Error loading jobs:', error);
      setMessage('Error loading jobs. Please try again.');
      setJobs([]);
      setStudentApplications([]);
      setJobTypes([]);
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(job =>
        job.title?.toLowerCase().includes(searchLower) ||
        job.companyName?.toLowerCase().includes(searchLower) ||
        job.description?.toLowerCase().includes(searchLower)
      );
    }

    if (selectedType) {
      filtered = filtered.filter(job =>
        job.type?.toLowerCase() === selectedType.toLowerCase()
      );
    }

    if (selectedLocation) {
      filtered = filtered.filter(job =>
        job.location?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    // Mark jobs that user has already applied to
    const jobsWithApplicationStatus = filtered.map(job => ({
      ...job,
      applied: studentApplications.some(app =>
        app.jobId === job.id &&
        ['pending', 'under_review', 'approved'].includes(app.status)
      )
    }));

    setFilteredJobs(jobsWithApplicationStatus);
  };

  const hasAppliedForJob = (jobId) => {
    return studentApplications.some(app =>
      app.jobId === jobId &&
      ['pending', 'under_review', 'approved'].includes(app.status)
    );
  };

  const handleApplyNow = (jobId) => {
    if (!user) {
      setMessage('Please log in to apply for jobs');
      return;
    }
    navigate(`/dashboard/student/apply-job/${jobId}`);
  };

  const getTypeVariant = (type) => {
    const variants = {
      'full-time': 'primary',
      'part-time': 'info',
      contract: 'warning',
      internship: 'success',
      remote: 'dark'
    };
    return variants[type] || 'secondary';
  };

  const formatSalary = (salary) => {
    if (!salary) return 'Negotiable';
    if (typeof salary === 'object' && salary.amount) {
      return `M${salary.amount}${salary.currency ? ` ${salary.currency}` : ''}`;
    }
    if (typeof salary === 'number') {
      return `M${salary}`;
    }
    if (typeof salary === 'string') {
      return salary;
    }
    return 'Negotiable';
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return 'Open until filled';
    try {
      const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
      if (isNaN(deadlineDate.getTime())) return 'Open until filled';
      return deadlineDate.toLocaleDateString();
    } catch {
      return 'Open until filled';
    }
  };

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading job opportunities...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 mb-2">Job Opportunities</h1>
              <p className="text-muted mb-0">Find your dream career after graduation</p>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                onClick={() => navigate("/dashboard/student/applications")}
              >
                My Applications
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => navigate("/dashboard/student")}
              >
                ← Dashboard
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Message Alert */}
      {message && (
        <Alert
          variant={message.includes('Error') ? 'danger' : 'success'}
          className="mb-4"
          dismissible
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      {/* Filters Section */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Search Jobs</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search by title, company, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Job Type</Form.Label>
                <Form.Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="">All Types</option>
                  {jobTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Location</Form.Label>
                <Form.Select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  <option value="">All Locations</option>
                  {locations.map(location => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>&nbsp;</Form.Label>
                <div className="text-muted small pt-2">
                  {filteredJobs.length} of {jobs.length} jobs
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <i className="bi bi-briefcase display-1 text-muted"></i>
            <h3 className="mt-3 text-muted">No jobs found</h3>
            <p className="text-muted mb-4">
              {searchTerm || selectedType || selectedLocation
                ? 'Try adjusting your search filters'
                : 'No job opportunities available at the moment'
              }
            </p>
            {(searchTerm || selectedType || selectedLocation) && (
              <Button
                variant="primary"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('');
                  setSelectedLocation('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {filteredJobs.map((job) => {
            const applied = hasAppliedForJob(job.id);

            return (
              <Col key={job.id} lg={6} xl={4}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="flex-grow-1">
                        <h5 className="card-title mb-2">{job.title}</h5>
                        <div className="d-flex align-items-center mb-2">
                          <div className="me-2">
                            <i className="bi bi-building text-muted"></i>
                          </div>
                          <span className="text-muted">
                            {job.companyName || 'Company'}
                          </span>
                        </div>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-1">
                        {applied && (
                          <Badge bg="success" className="mb-1">
                            Applied
                          </Badge>
                        )}
                        <Badge bg={getTypeVariant(job.type)}>
                          {job.type}
                        </Badge>
                      </div>
                    </div>

                    <p className="card-text text-muted small mb-3">
                      {job.description?.substring(0, 120)}...
                    </p>

                    <div className="mb-3">
                      <div className="d-flex justify-content-between text-muted small mb-1">
                        <span>Location:</span>
                        <span>{job.location || 'Remote'}</span>
                      </div>
                      <div className="d-flex justify-content-between text-muted small mb-1">
                        <span>Salary:</span>
                        <span>{formatSalary(job.salary)}</span>
                      </div>
                      <div className="d-flex justify-content-between text-muted small">
                        <span>Deadline:</span>
                        <span>{formatDeadline(job.deadline)}</span>
                      </div>
                    </div>

                    {job.requirements && (
                      <div className="mb-3">
                        <small className="fw-bold text-muted">Requirements:</small>
                        <div className="text-muted small">
                          {Array.isArray(job.requirements) ? (
                            <ul className="mb-0 ps-3">
                              {job.requirements.slice(0, 2).map((req, index) => (
                                <li key={index}>{req}</li>
                              ))}
                              {job.requirements.length > 2 && (
                                <li>...and {job.requirements.length - 2} more</li>
                              )}
                            </ul>
                          ) : (
                            <span>
                              {job.requirements.length > 80 ?
                                `${job.requirements.substring(0, 80)}...` :
                                job.requirements
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </Card.Body>

                  <Card.Footer className="bg-transparent border-top-0">
                    <div className="d-flex gap-2">
                      <Button
                        variant={applied ? "outline-success" : "primary"}
                        className="flex-fill"
                        onClick={() => handleApplyNow(job.id)}
                        disabled={applied || !user}
                      >
                        {!user ? 'Login to Apply' : applied ? 'Already Applied' : 'Apply Now'}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => navigate(`/dashboard/student/job-details/${job.id}`)}
                      >
                        Details
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Container>
  );
};

export default StudentJobs;
