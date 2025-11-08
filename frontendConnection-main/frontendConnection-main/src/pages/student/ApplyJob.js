/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  ListGroup,
  Modal,
  ProgressBar,
  Row,
  Spinner
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jobService } from '../../services/jobService';
import {
  applyForJob,
  checkExistingApplication,
  getStudentProfile,
  updateStudentProfile,
  uploadResume
} from '../../services/studentServices';

const ApplyJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { jobId } = useParams();
  const fileInputRef = useRef(null);

  const [job, setJob] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasApplied, setHasApplied] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (user?.uid && jobId) {
      loadData();
    } else if (!jobId) {
      setMessage({
        type: 'warning',
        text: 'No job selected. Please go back and select a job to apply.'
      });
      setIsLoading(false);
    }
  }, [user, jobId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setMessage({ type: '', text: '' });

      console.log('🔄 Loading job and profile data...');

      const [jobResult, profileResult, appliedCheck] = await Promise.all([
        jobService.getJob(jobId),
        getStudentProfile(user.uid),
        checkExistingApplication(user.uid, jobId)
      ]);

      if (jobResult.success) {
        setJob(jobResult.data);
        console.log('✅ Job loaded:', jobResult.data.title);
      } else {
        setMessage({
          type: 'error',
          text: jobResult.error || 'Failed to load job details'
        });
      }

      if (profileResult.success) {
        setStudentProfile(profileResult.data);
        console.log('✅ Profile loaded');
      } else {
        setMessage({
          type: 'warning',
          text: 'Please complete your student profile'
        });
      }

      setHasApplied(appliedCheck);
      if (appliedCheck) {
        setMessage({
          type: 'warning',
          text: 'You have already applied for this job position.'
        });
      }

    } catch (error) {
      console.error('❌ Error loading data:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load application data. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!validTypes.includes(file.type)) {
      setMessage({
        type: 'error',
        text: 'Please upload a PDF or Word document (PDF, DOC, DOCX)'
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: 'File size must be less than 5MB'
      });
      return;
    }

    setResumeFile(file);
    setMessage({ type: 'success', text: 'File selected successfully!' });
  };

  const handleUploadResume = async () => {
    if (!resumeFile) {
      setMessage({ type: 'error', text: 'Please select a file to upload' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setMessage({ type: '', text: '' });

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const uploadResult = await uploadResume(resumeFile, user.uid);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadResult.success) {
        // Update student profile with new resume URL
        const updateResult = await updateStudentProfile(user.uid, {
          resumeUrl: uploadResult.url,
          updatedAt: new Date()
        });

        if (updateResult.success) {
          setStudentProfile(prev => ({
            ...prev,
            resumeUrl: uploadResult.url
          }));
          setMessage({
            type: 'success',
            text: 'Resume uploaded successfully!'
          });
          setShowUploadModal(false);
          setResumeFile(null);
        } else {
          setMessage({
            type: 'error',
            text: 'Failed to update profile with resume URL'
          });
        }
      } else {
        setMessage({
          type: 'error',
          text: uploadResult.error || 'Failed to upload resume'
        });
      }
    } catch (error) {
      console.error('❌ Error uploading resume:', error);
      setMessage({
        type: 'error',
        text: 'An error occurred during upload. Please try again.'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!job) {
      setMessage({ type: 'error', text: 'No job selected' });
      return;
    }

    if (hasApplied) {
      setMessage({
        type: 'warning',
        text: 'You have already applied for this position.'
      });
      return;
    }

    if (!studentProfile?.fullName) {
      setMessage({
        type: 'error',
        text: 'Please complete your profile information before applying'
      });
      return;
    }

    if (!studentProfile?.resumeUrl) {
      setMessage({
        type: 'error',
        text: 'Please upload your resume before applying'
      });
      setShowUploadModal(true);
      return;
    }

    if (!coverLetter.trim()) {
      setMessage({
        type: 'error',
        text: 'Please write a cover letter explaining your interest in this position'
      });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const applicationData = {
        studentId: user.uid,
        studentName: studentProfile.fullName,
        studentEmail: studentProfile.email || user.email,
        jobId: job.id,
        jobTitle: job.title,
        companyName: job.companyName,
        companyId: job.companyId,
        coverLetter: coverLetter.trim(),
        resumeUrl: studentProfile.resumeUrl,
        appliedAt: new Date(),
        status: 'pending',
        // Additional synchronized fields
        jobType: job.type,
        jobLocation: job.location,
        jobSalary: job.salary,
        studentEducation: studentProfile.educationLevel,
        studentSkills: studentProfile.skills,
        studentInstitution: studentProfile.institution,
        phoneNumber: studentProfile.phoneNumber,
        address: studentProfile.address
      };

      console.log('📤 Submitting application:', applicationData);

      const result = await applyForJob(applicationData);

      if (result.success) {
        // Increment applicant count in the job document
        await jobService.incrementApplicantCount(job.id);

        setMessage({
          type: 'success',
          text: '🎉 Application submitted successfully! Redirecting to your applications...'
        });

        // Redirect to applications page after success
        setTimeout(() => {
          navigate('/dashboard/student/applications');
        }, 3000);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to submit application. Please try again.'
        });
      }
    } catch (error) {
      console.error('❌ Error submitting application:', error);
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getJobTypeVariant = (type) => {
    const variants = {
      'full-time': 'primary',
      'part-time': 'info',
      'contract': 'warning',
      'internship': 'success',
      'remote': 'dark'
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
    return salary;
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return 'Open until filled';
    try {
      const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
      return deadlineDate.toLocaleDateString();
    } catch {
      return 'Open until filled';
    }
  };

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Loading job application form...</p>
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
              <h1 className="h2 mb-2">Apply for Job</h1>
              <p className="text-muted mb-0">Submit your application for the selected position</p>
            </div>
            <Button
              variant="outline-secondary"
              onClick={() => navigate('/dashboard/student/jobs')}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Jobs
            </Button>
          </div>
        </Col>
      </Row>

      {/* Message Alert */}
      {message.text && (
        <Alert
          variant={
            message.type === 'success' ? 'success' :
              message.type === 'warning' ? 'warning' : 'danger'
          }
          className="mb-4"
          dismissible
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      {!job ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <i className="bi bi-briefcase display-1 text-muted"></i>
            <h3 className="mt-3 text-muted">Job Not Found</h3>
            <p className="text-muted mb-4">
              The job you're trying to apply for could not be found or may have been removed.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/dashboard/student/jobs')}
            >
              Browse Available Jobs
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {/* Job Details Column */}
          <Col lg={5}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-0">
                <h5 className="mb-0">
                  <i className="bi bi-briefcase me-2 text-primary"></i>
                  Job Details
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <h4 className="text-primary">{job.title}</h4>
                  <p className="text-muted mb-2">
                    <i className="bi bi-building me-2"></i>
                    {job.companyName}
                  </p>
                  <Badge bg={getJobTypeVariant(job.type)} className="mb-2">
                    {job.type}
                  </Badge>
                  {hasApplied && (
                    <Badge bg="warning" className="ms-2">
                      Already Applied
                    </Badge>
                  )}
                </div>

                <ListGroup variant="flush" className="mb-3">
                  <ListGroup.Item className="px-0 d-flex justify-content-between">
                    <span className="text-muted">
                      <i className="bi bi-geo-alt me-2"></i>
                      Location
                    </span>
                    <span>{job.location || 'Remote'}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0 d-flex justify-content-between">
                    <span className="text-muted">
                      <i className="bi bi-cash-coin me-2"></i>
                      Salary
                    </span>
                    <span>{formatSalary(job.salary)}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0 d-flex justify-content-between">
                    <span className="text-muted">
                      <i className="bi bi-calendar me-2"></i>
                      Deadline
                    </span>
                    <span>{formatDeadline(job.deadline)}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0 d-flex justify-content-between">
                    <span className="text-muted">
                      <i className="bi bi-people me-2"></i>
                      Applicants
                    </span>
                    <span>{job.applicantsCount || 0}</span>
                  </ListGroup.Item>
                </ListGroup>

                <div className="mb-3">
                  <h6 className="text-muted">Job Description</h6>
                  <p className="text-muted small">
                    {job.description || 'No description provided.'}
                  </p>
                </div>

                {job.requirements && (
                  <div>
                    <h6 className="text-muted">Requirements</h6>
                    <div className="text-muted small">
                      {Array.isArray(job.requirements) ? (
                        <ul className="mb-0 ps-3">
                          {job.requirements.map((req, index) => (
                            <li key={index}>{req}</li>
                          ))}
                        </ul>
                      ) : (
                        <span>{job.requirements}</span>
                      )}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Application Form Column */}
          <Col lg={7}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-0">
                <h5 className="mb-0">
                  <i className="bi bi-pencil-square me-2 text-primary"></i>
                  Application Form
                </h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  {/* Applicant Information */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">
                      <i className="bi bi-person me-2"></i>
                      Applicant Information
                    </h6>

                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Full Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={studentProfile?.fullName || 'Not provided'}
                            disabled
                            className="bg-light"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Email</Form.Label>
                          <Form.Control
                            type="email"
                            value={studentProfile?.email || user.email}
                            disabled
                            className="bg-light"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Education Level</Form.Label>
                          <Form.Control
                            type="text"
                            value={studentProfile?.educationLevel || 'Not specified'}
                            disabled
                            className="bg-light"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Resume Status</Form.Label>
                          <div className="d-flex align-items-center gap-2">
                            <Form.Control
                              type="text"
                              value={studentProfile?.resumeUrl ? 'Uploaded ✅' : 'Not uploaded ❌'}
                              disabled
                              className={`bg-light ${studentProfile?.resumeUrl ? 'text-success' : 'text-danger'}`}
                            />
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => setShowUploadModal(true)}
                            >
                              <i className="bi bi-upload me-1"></i>
                              Upload
                            </Button>
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>

                    {studentProfile?.skills && studentProfile.skills.length > 0 && (
                      <Form.Group className="mt-3">
                        <Form.Label className="fw-semibold">Skills</Form.Label>
                        <div className="d-flex flex-wrap gap-2">
                          {studentProfile.skills.map((skill, index) => (
                            <Badge key={index} bg="light" text="dark" className="px-2 py-1">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </Form.Group>
                    )}

                    {(!studentProfile?.fullName) && (
                      <Alert variant="warning" className="mt-3">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          <div className="flex-grow-1">
                            <strong>Profile Incomplete</strong>
                            <p className="mb-0 small">
                              Please complete your profile information before applying.
                            </p>
                          </div>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => navigate('/dashboard/student/profile')}
                          >
                            Complete Profile
                          </Button>
                        </div>
                      </Alert>
                    )}
                  </div>

                  {/* Cover Letter */}
                  <div className="mb-4">
                    <h6 className="text-primary mb-3">
                      <i className="bi bi-chat-text me-2"></i>
                      Cover Letter
                    </h6>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        Why are you a good fit for this position? *
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={6}
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="Explain your interest in this position, relevant experience, and why you would be a great fit for the role..."
                        required
                        style={{ resize: 'vertical' }}
                        disabled={hasApplied}
                      />
                      <Form.Text className="text-muted">
                        {coverLetter.length}/1000 characters {coverLetter.length > 1000 && ' - Too long!'}
                      </Form.Text>
                    </Form.Group>
                  </div>

                  {/* Form Actions */}
                  <div className="d-flex gap-3 justify-content-end border-top pt-4">
                    <Button
                      variant="outline-secondary"
                      onClick={() => navigate('/dashboard/student/jobs')}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={
                        isSubmitting ||
                        hasApplied ||
                        !studentProfile?.fullName ||
                        !studentProfile?.resumeUrl ||
                        !coverLetter.trim() ||
                        coverLetter.length > 1000
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2"></i>
                          {hasApplied ? 'Already Applied' : 'Submit Application'}
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Resume Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-upload me-2"></i>
            Upload Resume
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <i className="bi bi-file-earmark-pdf display-4 text-primary"></i>
            <p className="text-muted mt-2">
              Upload your resume in PDF or Word format (max 5MB)
            </p>
          </div>

          <Form.Group>
            <Form.Label className="fw-semibold">Select Resume File</Form.Label>
            <Form.Control
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={isUploading}
            />
            <Form.Text className="text-muted">
              Supported formats: PDF, DOC, DOCX (Max 5MB)
            </Form.Text>
          </Form.Group>

          {resumeFile && (
            <Alert variant="info" className="mt-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <i className="bi bi-file-earmark me-2"></i>
                  <strong>{resumeFile.name}</strong>
                  <div className="text-muted small">
                    {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => {
                    setResumeFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={isUploading}
                >
                  <i className="bi bi-x"></i>
                </Button>
              </div>
            </Alert>
          )}

          {isUploading && (
            <div className="mt-3">
              <div className="d-flex justify-content-between mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <ProgressBar now={uploadProgress} animated />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowUploadModal(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUploadResume}
            disabled={!resumeFile || isUploading}
          >
            {isUploading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Uploading...
              </>
            ) : (
              <>
                <i className="bi bi-cloud-upload me-2"></i>
                Upload Resume
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ApplyJob;
