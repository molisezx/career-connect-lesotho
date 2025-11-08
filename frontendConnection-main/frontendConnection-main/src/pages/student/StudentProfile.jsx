import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentProfile, updateStudentProfile, updateStudentQualifications } from '../../services/studentServices';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Badge,
  Spinner,
  Alert,
  Nav,
  Tab,
  InputGroup
} from 'react-bootstrap';

const StudentProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('personal');

  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: ''
  });

  const [qualifications, setQualifications] = useState({
    educationLevel: '',
    overallGrade: '',
    subjects: [],
    certificates: []
  });

  const [skills, setSkills] = useState({
    interests: [],
    skills: []
  });

  useEffect(() => {
    if (user?.uid) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const result = await getStudentProfile(user.uid);

      if (result.success) {
        const profileData = result.data;
        setProfile(profileData);

        // Initialize form data
        setPersonalInfo({
          fullName: profileData.fullName || '',
          email: profileData.email || user.email || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          dateOfBirth: profileData.dateOfBirth || ''
        });

        setQualifications({
          educationLevel: profileData.qualifications?.educationLevel || '',
          overallGrade: profileData.qualifications?.overallGrade || '',
          subjects: profileData.qualifications?.subjects || [],
          certificates: profileData.qualifications?.certificates || []
        });

        setSkills({
          interests: profileData.interests || [],
          skills: profileData.skills || []
        });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    await saveProfile({ ...personalInfo });
  };

  const handleQualificationsSubmit = async (e) => {
    e.preventDefault();
    await saveQualifications(qualifications);
  };

  const handleSkillsSubmit = async (e) => {
    e.preventDefault();
    await saveProfile({ ...skills });
  };

  const saveProfile = async (updates) => {
    if (!user?.uid) return;

    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await updateStudentProfile(user.uid, updates);

      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        loadProfile(); // Reload to get updated completion percentage
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const saveQualifications = async (qualificationsData) => {
    if (!user?.uid) return;

    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await updateStudentQualifications(user.uid, qualificationsData);

      if (result.success) {
        setMessage({ type: 'success', text: 'Qualifications updated successfully!' });
        loadProfile();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error saving qualifications:', error);
      setMessage({ type: 'error', text: 'Failed to update qualifications' });
    } finally {
      setIsSaving(false);
    }
  };

  const addSubject = () => {
    setQualifications(prev => ({
      ...prev,
      subjects: [...prev.subjects, '']
    }));
  };

  const updateSubject = (index, value) => {
    setQualifications(prev => ({
      ...prev,
      subjects: prev.subjects.map((subject, i) => i === index ? value : subject)
    }));
  };

  const removeSubject = (index) => {
    setQualifications(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }));
  };

  const addSkill = () => {
    const newSkill = prompt('Enter a skill:');
    if (newSkill && !skills.skills.includes(newSkill)) {
      setSkills(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill]
      }));
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addInterest = () => {
    const newInterest = prompt('Enter an interest:');
    if (newInterest && !skills.interests.includes(newInterest)) {
      setSkills(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest]
      }));
    }
  };

  const removeInterest = (interestToRemove) => {
    setSkills(prev => ({
      ...prev,
      interests: prev.interests.filter(interest => interest !== interestToRemove)
    }));
  };

  if (isLoading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted">Loading your profile...</p>
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
                  <h1 className="h3 mb-1 fw-bold">Student Profile</h1>
                  <p className="text-muted mb-0">Manage your personal information and qualifications</p>
                </div>
                {profile && (
                  <Badge bg="primary" className="fs-6 p-2">
                    Profile Completion: {profile.profileCompletion}%
                  </Badge>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Message Alert */}
      {message.text && (
        <Row className="mb-4">
          <Col>
            <Alert variant={message.type === 'success' ? 'success' : 'danger'}>
              {message.text}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Tabs */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white">
              <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab}>
                <Nav.Item>
                  <Nav.Link eventKey="personal">Personal Information</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="qualifications">Qualifications</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="skills">Skills & Interests</Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>
            <Card.Body>
              <Tab.Content>
                {/* Personal Information Tab */}
                <Tab.Pane active={activeTab === 'personal'}>
                  <Form onSubmit={handlePersonalInfoSubmit}>
                    <Row className="mb-4">
                      <Col>
                        <h4 className="mb-3">Personal Details</h4>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Full Name *</Form.Label>
                          <Form.Control
                            type="text"
                            value={personalInfo.fullName}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            value={personalInfo.email}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                            disabled
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone Number</Form.Label>
                          <Form.Control
                            type="tel"
                            value={personalInfo.phone}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Date of Birth</Form.Label>
                          <Form.Control
                            type="date"
                            value={personalInfo.dateOfBirth}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, dateOfBirth: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-4">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={personalInfo.address}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                      />
                    </Form.Group>

                    <div className="d-flex justify-content-end">
                      <Button type="submit" variant="primary" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Personal Information'}
                      </Button>
                    </div>
                  </Form>
                </Tab.Pane>

                {/* Qualifications Tab */}
                <Tab.Pane active={activeTab === 'qualifications'}>
                  <Form onSubmit={handleQualificationsSubmit}>
                    <Row className="mb-4">
                      <Col>
                        <h4 className="mb-3">Educational Qualifications</h4>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Highest Education Level *</Form.Label>
                          <Form.Select
                            value={qualifications.educationLevel}
                            onChange={(e) => setQualifications({ ...qualifications, educationLevel: e.target.value })}
                            required
                          >
                            <option value="">Select education level</option>
                            <option value="high_school">High School</option>
                            <option value="certificate">Certificate</option>
                            <option value="diploma">Diploma</option>
                            <option value="bachelors">Bachelor's Degree</option>
                            <option value="masters">Master's Degree</option>
                            <option value="phd">PhD</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Overall Grade</Form.Label>
                          <Form.Select
                            value={qualifications.overallGrade}
                            onChange={(e) => setQualifications({ ...qualifications, overallGrade: e.target.value })}
                          >
                            <option value="">Select grade</option>
                            <option value="A">A (Excellent)</option>
                            <option value="B">B (Very Good)</option>
                            <option value="C">C (Good)</option>
                            <option value="D">D (Satisfactory)</option>
                            <option value="E">E (Pass)</option>
                            <option value="F">F (Fail)</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-4">
                      <Form.Label>Subjects</Form.Label>
                      {qualifications.subjects.map((subject, index) => (
                        <InputGroup key={index} className="mb-2">
                          <Form.Control
                            type="text"
                            value={subject}
                            onChange={(e) => updateSubject(index, e.target.value)}
                            placeholder="Subject name"
                          />
                          <Button
                            variant="outline-danger"
                            onClick={() => removeSubject(index)}
                          >
                            Remove
                          </Button>
                        </InputGroup>
                      ))}
                      <Button
                        variant="outline-primary"
                        onClick={addSubject}
                        className="mt-2"
                      >
                        + Add Subject
                      </Button>
                    </Form.Group>

                    <div className="d-flex justify-content-end">
                      <Button type="submit" variant="primary" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Qualifications'}
                      </Button>
                    </div>
                  </Form>
                </Tab.Pane>

                {/* Skills & Interests Tab */}
                <Tab.Pane active={activeTab === 'skills'}>
                  <Form onSubmit={handleSkillsSubmit}>
                    <Row className="mb-4">
                      <Col>
                        <h4 className="mb-3">Skills & Interests</h4>
                      </Col>
                    </Row>

                    <Form.Group className="mb-4">
                      <Form.Label>Skills</Form.Label>
                      <div className="mb-3">
                        {skills.skills.map((skill, index) => (
                          <Badge
                            key={index}
                            bg="primary"
                            className="me-2 mb-2 p-2 fs-6"
                          >
                            {skill}
                            <Button
                              variant="outline-light"
                              size="sm"
                              className="ms-2 border-0"
                              onClick={() => removeSkill(skill)}
                            >
                              ×
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <Button
                        variant="outline-primary"
                        onClick={addSkill}
                      >
                        + Add Skill
                      </Button>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Interests</Form.Label>
                      <div className="mb-3">
                        {skills.interests.map((interest, index) => (
                          <Badge
                            key={index}
                            bg="success"
                            className="me-2 mb-2 p-2 fs-6"
                          >
                            {interest}
                            <Button
                              variant="outline-light"
                              size="sm"
                              className="ms-2 border-0"
                              onClick={() => removeInterest(interest)}
                            >
                              ×
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <Button
                        variant="outline-success"
                        onClick={addInterest}
                      >
                        + Add Interest
                      </Button>
                    </Form.Group>

                    <div className="d-flex justify-content-end">
                      <Button type="submit" variant="primary" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Skills & Interests'}
                      </Button>
                    </div>
                  </Form>
                </Tab.Pane>
              </Tab.Content>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default StudentProfile;
