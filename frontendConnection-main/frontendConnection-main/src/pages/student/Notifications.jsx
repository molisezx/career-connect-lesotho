import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentNotifications, markNotificationAsRead } from '../../services/studentServices';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Spinner,
  ListGroup,
  ButtonGroup
} from 'react-bootstrap';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (user?.uid) {
      loadNotifications();
    }
  }, [user]);

  useEffect(() => {
    filterNotifications();
  }, [notifications, activeFilter]);

  const loadNotifications = async () => {
    try {
      const result = await getStudentNotifications(user.uid);
      if (result.success) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = notifications;

    if (activeFilter === 'unread') {
      filtered = filtered.filter(notif => !notif.read);
    } else if (activeFilter === 'read') {
      filtered = filtered.filter(notif => notif.read);
    }

    setFilteredNotifications(filtered);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const result = await markNotificationAsRead(notificationId);
      if (result.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notif => !notif.read);
      await Promise.all(
        unreadNotifications.map(notif => markNotificationAsRead(notif.id))
      );

      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      application: '📝',
      admission: '🎓',
      job_application: '💼',
      profile: '👤',
      system: '🔔',
      deadline: '⏰'
    };
    return icons[type] || '🔔';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  if (isLoading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted">Loading notifications...</p>
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
                  <h1 className="h3 mb-1 fw-bold">Notifications</h1>
                  <p className="text-muted mb-0">Stay updated with your applications and opportunities</p>
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="outline-primary"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-center">
                <ButtonGroup>
                  <Button
                    variant={activeFilter === 'all' ? 'primary' : 'outline-primary'}
                    onClick={() => setActiveFilter('all')}
                  >
                    All <Badge bg="light" text="dark" className="ms-1">{notifications.length}</Badge>
                  </Button>
                  <Button
                    variant={activeFilter === 'unread' ? 'primary' : 'outline-primary'}
                    onClick={() => setActiveFilter('unread')}
                  >
                    Unread <Badge bg="light" text="dark" className="ms-1">{unreadCount}</Badge>
                  </Button>
                  <Button
                    variant={activeFilter === 'read' ? 'primary' : 'outline-primary'}
                    onClick={() => setActiveFilter('read')}
                  >
                    Read <Badge bg="light" text="dark" className="ms-1">{notifications.length - unreadCount}</Badge>
                  </Button>
                </ButtonGroup>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Notifications List */}
      <Row>
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              {filteredNotifications.length > 0 ? (
                <ListGroup variant="flush">
                  {filteredNotifications.map(notification => (
                    <ListGroup.Item
                      key={notification.id}
                      className={`px-4 py-3 ${notification.read ? '' : 'bg-light'}`}
                    >
                      <Row className="align-items-center">
                        <Col xs="auto">
                          <div className="display-6">
                            {getNotificationIcon(notification.type)}
                          </div>
                        </Col>
                        <Col>
                          <div className="d-flex align-items-center mb-1">
                            <h5 className="mb-0 me-2">{notification.title}</h5>
                            {!notification.read && (
                              <Badge bg="primary" className="small">New</Badge>
                            )}
                          </div>
                          <p className="text-muted mb-1">{notification.message}</p>
                          <small className="text-muted">
                            {formatDate(notification.createdAt)}
                          </small>
                        </Col>
                        <Col xs="auto">
                          {!notification.read && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              title="Mark as read"
                            >
                              ✓ Mark Read
                            </Button>
                          )}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-5">
                  <div className="display-1 text-muted mb-3">🔔</div>
                  <h4>No notifications</h4>
                  <p className="text-muted">
                    {activeFilter === 'all'
                      ? "You don't have any notifications yet."
                      : `No ${activeFilter} notifications.`
                    }
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Notifications;
