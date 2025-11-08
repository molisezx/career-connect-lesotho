import {
  collection,
  getDocs,
  orderBy,
  query,
  where
} from 'firebase/firestore';
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
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const Courses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [studentApplications, setStudentApplications] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, selectedInstitution, selectedLevel]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Loading data from Firebase...");

      // Load institutions first
      const institutionsSnapshot = await getDocs(collection(db, 'institutions'));
      const institutionsData = institutionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        name: doc.data().name || doc.data().institutionName,
        status: doc.data().status || 'active'
      }));
      setInstitutions(institutionsData);
      console.log('🏫 Loaded institutions:', institutionsData.length);

      // Load courses from all institutions
      const allCourses = [];

      for (const institution of institutionsData) {
        if (institution.status !== 'active') continue;

        try {
          const coursesRef = collection(db, 'institutions', institution.id, 'courses');
          const coursesQuery = query(
            coursesRef,
            where('status', '==', 'active'),
            orderBy('name')
          );

          const coursesSnapshot = await getDocs(coursesQuery);
          const institutionCourses = coursesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            institutionId: institution.id,
            institutionName: institution.name,
            name: doc.data().name,
            code: doc.data().code,
            description: doc.data().description,
            level: doc.data().level || 'undergraduate',
            duration: doc.data().duration,
            durationUnit: doc.data().durationUnit || 'years',
            fees: doc.data().fees || { amount: 0, currency: 'M' },
            credits: doc.data().credits || 0,
            requirements: doc.data().requirements,
            intakePeriod: doc.data().intakePeriod,
            status: doc.data().status || 'active'
          }));

          allCourses.push(...institutionCourses);
          console.log(`📚 Loaded ${institutionCourses.length} courses from ${institution.name}`);
        } catch (error) {
          console.warn(`⚠️ No courses found for institution ${institution.name}:`, error.message);
        }
      }

      setCourses(allCourses);
      console.log('📚 Total courses loaded:', allCourses.length);

      // Load student applications if user is logged in
      if (user) {
        try {
          const applicationsRef = collection(db, 'applications');
          const applicationsQuery = query(
            applicationsRef,
            where('studentId', '==', user.uid),
            orderBy('appliedAt', 'desc')
          );

          const applicationsSnapshot = await getDocs(applicationsQuery);
          const applicationsData = applicationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          setStudentApplications(applicationsData);
          console.log('📋 Loaded applications:', applicationsData.length);
        } catch (error) {
          console.warn('⚠️ No applications found or error loading:', error.message);
        }
      }

    } catch (error) {
      console.error('❌ Error loading data:', error);
      setMessage('Error loading courses data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    // Only show active courses to students
    filtered = filtered.filter(course => course.status === 'active');

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(course =>
        course.name?.toLowerCase().includes(searchLower) ||
        course.code?.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower) ||
        (typeof course.requirements === 'string' && course.requirements.toLowerCase().includes(searchLower)) ||
        course.institutionName?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by institution
    if (selectedInstitution) {
      filtered = filtered.filter(course => course.institutionId === selectedInstitution);
    }

    // Filter by level
    if (selectedLevel) {
      filtered = filtered.filter(course => course.level === selectedLevel);
    }

    console.log(`🔍 Filtered to ${filtered.length} courses`);
    setFilteredCourses(filtered);
  };

  // Check if student has already applied for a course
  const hasAppliedForCourse = (courseId) => {
    if (!user) return false;

    return studentApplications.some(app =>
      app.courseId === courseId &&
      ['pending', 'under_review', 'approved'].includes(app.status)
    );
  };

  const handleApplyNow = (courseId) => {
    if (!user) {
      setMessage('Please log in to apply for courses');
      return;
    }
    navigate(`/dashboard/student/apply-course/${courseId}`);
  };

  const navigateToDashboard = () => navigate("/dashboard/student");
  const navigateToApplications = () => navigate("/dashboard/student/applications");

  // Get institution name
  const getInstitutionName = (institutionId) => {
    if (!institutionId) return 'Unknown Institution';

    const course = courses.find(c => c.institutionId === institutionId);
    if (course?.institutionName) return course.institutionName;

    const institution = institutions.find(inst => inst.id === institutionId);
    return institution?.name || 'Unknown Institution';
  };

  // Format fees display
  const formatFees = (fees) => {
    if (!fees) return 'Contact Institution';
    if (typeof fees === 'object' && fees.amount) {
      return `M${fees.amount}${fees.currency ? ` ${fees.currency}` : ''}`;
    }
    if (typeof fees === 'number') {
      return `M${fees}`;
    }
    return 'Contact Institution';
  };

  // Format duration display
  const formatDuration = (duration, durationUnit) => {
    if (!duration) return 'N/A';
    const unit = durationUnit || 'years';
    return `${duration} ${unit}`;
  };

  // Helper function to render requirements properly
  const renderRequirements = (requirements) => {
    if (!requirements) return 'Contact institution for requirements';

    if (typeof requirements === 'string') {
      return requirements.length > 100 ? `${requirements.substring(0, 100)}...` : requirements;
    }

    if (typeof requirements === 'object' && !Array.isArray(requirements)) {
      const parts = [];
      if (requirements.description) parts.push(requirements.description);
      if (requirements.minGrade) parts.push(`Min Grade: ${requirements.minGrade}`);
      if (requirements.subjects && Array.isArray(requirements.subjects)) {
        parts.push(`Subjects: ${requirements.subjects.join(', ')}`);
      }
      return parts.join(' • ');
    }

    if (Array.isArray(requirements)) {
      return requirements.join(', ');
    }

    return 'Contact institution for requirements';
  };

  // Get active institutions that have active courses
  const activeInstitutions = institutions.filter(inst => {
    return courses.some(course =>
      course.institutionId === inst.id && course.status === 'active'
    );
  });

  // Get unique levels from active courses
  const levels = [...new Set(
    courses
      .filter(course => course.status === 'active')
      .map(course => course.level)
      .filter(Boolean)
  )];

  const activeCoursesCount = courses.filter(c => c.status === 'active').length;

  if (isLoading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted">Loading courses...</p>
        </div>
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
                  <h1 className="h3 mb-1 fw-bold">Browse Courses</h1>
                  <p className="text-muted mb-0">Discover courses from top institutions in Lesotho</p>
                </div>
                <div className="d-flex gap-2">
                  {user && (
                    <Button variant="outline-primary" onClick={navigateToApplications}>
                      My Applications
                    </Button>
                  )}
                  <Button variant="outline-secondary" onClick={navigateToDashboard}>
                    ← Dashboard
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Message Alert */}
      {message && (
        <Row className="mb-4">
          <Col>
            <Alert
              variant={message.includes('Error') ? 'danger' : 'success'}
              className="d-flex justify-content-between align-items-center"
            >
              <span>{message}</span>
              <Button variant="outline-danger" size="sm" onClick={() => setMessage('')}>
                ×
              </Button>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Filters Section */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <Row className="g-3 align-items-end">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Search Courses</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Search by name, code, or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <InputGroup.Text>🔍</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Institution</Form.Label>
                    <Form.Select
                      value={selectedInstitution}
                      onChange={(e) => setSelectedInstitution(e.target.value)}
                    >
                      <option value="">All Institutions</option>
                      {activeInstitutions.map(inst => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Level</Form.Label>
                    <Form.Select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                    >
                      <option value="">All Levels</option>
                      {levels.map(level => (
                        <option key={level} value={level}>
                          {level?.charAt(0)?.toUpperCase() + level?.slice(1) || 'Unknown'}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <div className="text-muted text-end">
                    <small>
                      {filteredCourses.length} of {activeCoursesCount} courses
                    </small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Courses Grid */}
      <Row className="g-4">
        {filteredCourses.length > 0 ? (
          filteredCourses.map(course => {
            const applied = hasAppliedForCourse(course.id);
            const institutionName = getInstitutionName(course.institutionId);

            return (
              <Col key={course.id} lg={6} xl={4}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body className="d-flex flex-column">
                    {/* Course Header */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="flex-grow-1">
                        <h5 className="card-title fw-bold mb-1">{course.name}</h5>
                        {course.code && (
                          <Badge bg="light" text="dark" className="me-2">
                            {course.code}
                          </Badge>
                        )}
                        <Badge
                          bg={
                            course.level === 'undergraduate' ? 'primary' :
                              course.level === 'postgraduate' ? 'success' : 'secondary'
                          }
                        >
                          {course.level}
                        </Badge>
                      </div>
                      {applied && (
                        <Badge bg="success">Applied</Badge>
                      )}
                    </div>

                    {/* Institution */}
                    <div className="d-flex align-items-center mb-3">
                      <span className="me-2">🏫</span>
                      <span className="text-muted">{institutionName}</span>
                    </div>

                    {/* Description */}
                    <p className="card-text text-muted mb-3 flex-grow-1">
                      {course.description || 'No description available.'}
                    </p>

                    {/* Course Meta */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between small text-muted mb-2">
                        <span>Duration:</span>
                        <span>{formatDuration(course.duration, course.durationUnit)}</span>
                      </div>
                      <div className="d-flex justify-content-between small text-muted mb-2">
                        <span>Fees:</span>
                        <span>{formatFees(course.fees)}</span>
                      </div>
                      <div className="d-flex justify-content-between small text-muted mb-2">
                        <span>Credits:</span>
                        <span>{course.credits || 'N/A'}</span>
                      </div>
                      {course.intakePeriod && (
                        <div className="d-flex justify-content-between small text-muted">
                          <span>Next Intake:</span>
                          <span>{course.intakePeriod}</span>
                        </div>
                      )}
                    </div>

                    {/* Requirements */}
                    {course.requirements && (
                      <div className="mb-3">
                        <small className="fw-bold">Requirements:</small>
                        <div className="small text-muted mt-1">
                          {renderRequirements(course.requirements)}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="d-flex gap-2 mt-auto">
                      <Button
                        variant={applied ? "outline-success" : "primary"}
                        size="sm"
                        className="flex-grow-1"
                        onClick={() => handleApplyNow(course.id)}
                        disabled={applied || !user}
                      >
                        {!user ? 'Login to Apply' : applied ? 'Already Applied' : 'Apply Now'}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => navigate(`/dashboard/student/course-details/${course.id}`)}
                      >
                        Details
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })
        ) : (
          <Col>
            <Card className="text-center shadow-sm border-0">
              <Card.Body className="py-5">
                <div className="display-1 text-muted mb-3">📚</div>
                <h3>No courses found</h3>
                <p className="text-muted">
                  {searchTerm || selectedInstitution || selectedLevel
                    ? 'Try adjusting your search filters'
                    : 'No active courses available at the moment'
                  }
                </p>
                {(searchTerm || selectedInstitution || selectedLevel) && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedInstitution('');
                      setSelectedLevel('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default Courses;
