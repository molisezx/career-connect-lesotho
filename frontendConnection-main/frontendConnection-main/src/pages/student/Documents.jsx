import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentDocuments, uploadDocument } from '../../services/studentServices';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Spinner,
  ListGroup,
  Badge
} from 'react-bootstrap';

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.uid) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    try {
      const result = await getStudentDocuments(user.uid);
      if (result.success) {
        setDocuments(result.data);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setMessage('Error loading documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e, documentType) => {
    const file = e.target.files[0];
    if (!file || !user?.uid) return;

    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      setMessage('Please upload PDF, Word, or image files only');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const result = await uploadDocument(user.uid, file, documentType);
      if (result.success) {
        setMessage(`${documentType.charAt(0).toUpperCase() + documentType.slice(1)} uploaded successfully!`);
        await loadDocuments(); // Reload documents list
      } else {
        setMessage(result.error || 'Error uploading document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setMessage('Error uploading document');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleDateString();
  };

  const documentTypes = {
    transcript: { name: 'Academic Transcript', icon: '📊' },
    resume: { name: 'Resume/CV', icon: '📄' },
    certificate: { name: 'Certificate', icon: '🏆' },
    id: { name: 'ID Document', icon: '🆔' },
    other: { name: 'Other Document', icon: '📎' }
  };

  if (isLoading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted">Loading your documents...</p>
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
              <h1 className="h3 mb-1 fw-bold">My Documents</h1>
              <p className="text-muted mb-0">Manage your academic transcripts and certificates</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Message Alert */}
      {message && (
        <Row className="mb-4">
          <Col>
            <Alert variant={message.includes('Error') ? 'danger' : 'success'}>
              {message}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Upload Section */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white">
              <h5 className="mb-0 fw-bold">Upload New Document</h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                {Object.entries(documentTypes).map(([type, info]) => (
                  <Col key={type} md={6} lg={4}>
                    <Card className="h-100 border">
                      <Card.Body className="text-center">
                        <div className="display-6 mb-3">{info.icon}</div>
                        <h6 className="fw-bold">{info.name}</h6>
                        <p className="text-muted small mb-3">
                          Upload your {info.name.toLowerCase()}
                        </p>
                        <Form.Group>
                          <Form.Label
                            className={`btn btn-outline-primary w-100 ${uploading ? 'disabled' : ''}`}
                            style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
                          >
                            {uploading ? 'Uploading...' : 'Choose File'}
                            <Form.Control
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileUpload(e, type)}
                              disabled={uploading}
                              className="d-none"
                            />
                          </Form.Label>
                        </Form.Group>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Documents List */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Your Documents ({documents.length})</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {documents.length > 0 ? (
                <ListGroup variant="flush">
                  {documents.map(doc => (
                    <ListGroup.Item key={doc.id} className="px-4 py-3">
                      <Row className="align-items-center">
                        <Col xs="auto">
                          <div className="display-6">
                            {documentTypes[doc.documentType]?.icon || '📎'}
                          </div>
                        </Col>
                        <Col>
                          <h6 className="mb-1 fw-bold">{doc.fileName}</h6>
                          <div className="d-flex flex-wrap gap-2 text-muted small">
                            <span>
                              {documentTypes[doc.documentType]?.name || doc.documentType}
                            </span>
                            <span>•</span>
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>•</span>
                            <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                          </div>
                        </Col>
                        <Col xs="auto">
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View
                            </Button>
                            <Button variant="outline-success" size="sm">
                              Download
                            </Button>
                            <Button variant="outline-danger" size="sm">
                              Delete
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-5">
                  <div className="display-1 text-muted mb-3">📁</div>
                  <h4>No documents uploaded yet</h4>
                  <p className="text-muted">
                    Upload your academic transcripts, resume, and other important documents.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Important Notes */}
      <Row>
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white">
              <h5 className="mb-0 fw-bold">📝 Important Notes</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <i className="bi bi-check-circle text-success me-2"></i>
                  Upload your academic transcripts for course applications
                </ListGroup.Item>
                <ListGroup.Item>
                  <i className="bi bi-check-circle text-success me-2"></i>
                  Keep your resume updated for job applications
                </ListGroup.Item>
                <ListGroup.Item>
                  <i className="bi bi-check-circle text-success me-2"></i>
                  Supported formats: PDF, Word, JPEG, PNG
                </ListGroup.Item>
                <ListGroup.Item>
                  <i className="bi bi-check-circle text-success me-2"></i>
                  Maximum file size: 5MB per document
                </ListGroup.Item>
                <ListGroup.Item>
                  <i className="bi bi-check-circle text-success me-2"></i>
                  Documents are securely stored and only shared with your permission
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Documents;
