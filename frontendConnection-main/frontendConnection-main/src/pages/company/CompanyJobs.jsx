/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  InputGroup,
  Spinner,
  Modal
} from 'react-bootstrap';
import { jobService } from '../../services/jobService';
import { useAuth } from '../../context/AuthContext';

const CompanyJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: ''
  });

  useEffect(() => {
    if (user?.uid) {
      loadJobs();
    }
  }, [user]);

  useEffect(() => {
    filterJobs();
  }, [jobs, filters]);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const companyJobs = await jobService.getCompanyJobs(user.uid);
      setJobs(companyJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    if (filters.status !== 'all') {
      filtered = filtered.filter(job => job.status === filters.status);
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(job => job.type === filters.type);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchLower) ||
        job.department?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredJobs(filtered);
  };

  const handleDeleteClick = (job) => {
    setJobToDelete(job);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (jobToDelete) {
      try {
        await jobService.deleteJob(jobToDelete.id);
        await loadJobs();
        setShowDeleteModal(false);
        setJobToDelete(null);
      } catch (error) {
        console.error('Error deleting job:', error);
      }
    }
  };

  const getStatusVariant = (status) => {
    const variants = {
      active: 'success',
      draft: 'secondary',
      closed: 'danger',
      paused: 'warning'
    };
    return variants[status] || 'secondary';
  };

  const getTypeBadgeVariant = (type) => {
    const variants = {
      'full-time': 'primary',
      'part-time': 'info',
      contract: 'warning',
      internship: 'success',
      remote: 'dark'
    };
    return variants[type] || 'secondary';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const stats = {
    total: jobs.length,
    active: jobs.filter(job => job.status === 'active').length,
    applicants: jobs.reduce((total, job) => total + (job.applicantsCount || 0), 0)
  };

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading jobs...</p>
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
              <h1 className="h2 mb-2">Job Management</h1>
              <p className="text-muted mb-0">Create and manage your job postings</p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/dashboard/company/jobs/new')}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Post New Job
            </Button>
          </div>
        </Col>
      </Row>

      {/* Stats */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <i className="bi bi-briefcase display-6 text-primary"></i>
                </div>
                <div>
                  <h3 className="mb-0">{stats.total}</h3>
                  <p className="text-muted mb-0">Total Jobs</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <i className="bi bi-check-circle display-6 text-success"></i>
                </div>
                <div>
                  <h3 className="mb-0">{stats.active}</h3>
                  <p className="text-muted mb-0">Active Jobs</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <i className="bi bi-people display-6 text-info"></i>
                </div>
                <div>
                  <h3 className="mb-0">{stats.applicants}</h3>
                  <p className="text-muted mb-0">Total Applicants</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Job Type</Form.Label>
                <Form.Select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="all">All Types</option>
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="remote">Remote</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Search</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search jobs by title or department..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                </InputGroup>
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
              {filters.search || filters.status !== 'all' || filters.type !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by posting your first job opportunity'
              }
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/dashboard/company/jobs/new')}
            >
              Post Your First Job
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {filteredJobs.map((job) => (
            <Col key={job.id} lg={6} xl={4}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1">
                      <h5 className="card-title mb-1">{job.title}</h5>
                      <div className="d-flex gap-2 mb-2">
                        <Badge bg={getTypeBadgeVariant(job.type)}>
                          {job.type}
                        </Badge>
                        {job.department && (
                          <Badge bg="light" text="dark">
                            {job.department}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge bg={getStatusVariant(job.status)}>
                      {job.status}
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between text-muted small mb-1">
                      <span>Location:</span>
                      <span>{job.location}</span>
                    </div>
                    <div className="d-flex justify-content-between text-muted small mb-1">
                      <span>Salary:</span>
                      <span>{job.salary || 'Negotiable'}</span>
                    </div>
                    <div className="d-flex justify-content-between text-muted small mb-1">
                      <span>Applicants:</span>
                      <span className="fw-bold text-primary">
                        {job.applicantsCount || 0}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between text-muted small">
                      <span>Posted:</span>
                      <span>{formatDate(job.createdAt)}</span>
                    </div>
                  </div>

                  <p className="card-text text-muted small">
                    {job.description?.substring(0, 120)}...
                  </p>
                </Card.Body>

                <Card.Footer className="bg-transparent border-top-0">
                  <div className="d-grid gap-2">
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/dashboard/company/jobs/${job.id}/applications`)}
                    >
                      View Applicants ({job.applicantsCount || 0})
                    </Button>

                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="flex-fill"
                        onClick={() => navigate(`/dashboard/company/jobs/${job.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="flex-fill"
                        onClick={() => navigate(`/dashboard/company/jobs/${job.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteClick(job)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the job posting "{jobToDelete?.title}"?
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete Job
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CompanyJobs;
