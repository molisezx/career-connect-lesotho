import { useEffect, useState } from "react";
import {
  Badge,
  Navbar as BootstrapNavbar,
  Button,
  Container,
  Nav,
  NavDropdown,
  Spinner
} from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentDashboard, setCurrentDashboard] = useState("/");
  const [expanded, setExpanded] = useState(false);

  // Function to determine dashboard path based on user role
  const getDashboardPath = (userData) => {
    if (!userData) return "/";

    let dashboardPath = "/dashboard";

    if (userData.role) {
      switch (userData.role.toLowerCase()) {
        case "student":
          dashboardPath = "/dashboard/student";
          break;
        case "company":
          dashboardPath = "/dashboard/company";
          break;
        case "institution":
          dashboardPath = "/dashboard/institution";
          break;
        case "superadmin":
        case "super_admin":
          dashboardPath = "/dashboard/admin";
          break;
        default:
          dashboardPath = "/dashboard";
      }
    }
    else if (userData.userType) {
      switch (userData.userType.toLowerCase()) {
        case "student":
          dashboardPath = "/dashboard/student";
          break;
        case "company":
          dashboardPath = "/dashboard/company";
          break;
        case "institution":
          dashboardPath = "/dashboard/institution";
          break;
        case "superadmin":
          dashboardPath = "/dashboard/admin";
          break;
        default:
          dashboardPath = "/dashboard";
      }
    }
    else if (userData.institutionId) {
      dashboardPath = "/dashboard/institution";
    }

    return dashboardPath;
  };

  // Update dashboard path when user changes
  useEffect(() => {
    const dashboardPath = getDashboardPath(user);
    setCurrentDashboard(dashboardPath);
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      setExpanded(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleBrandClick = (e) => {
    if (user) {
      e.preventDefault();
      setExpanded(false);

      const userDashboard = getDashboardPath(user);
      console.log(`🎯 Navigating to user dashboard: ${userDashboard}`);

      if (location.pathname === userDashboard) {
        console.log("🔄 Already on correct dashboard, reloading...");
        window.location.reload();
      } else {
        navigate(userDashboard);
      }
    }
  };

  const handleNavigation = (path) => {
    setExpanded(false);

    // If navigating to current location, reload the page
    if (location.pathname === path) {
      window.location.reload();
    } else {
      navigate(path);
    }
  };

  const handleHomeClick = (e) => {
    setExpanded(false);
    if (location.pathname === "/") {
      e.preventDefault();
      window.location.reload();
    }
  };

  const handleDashboardClick = (e) => {
    if (!user) return;

    setExpanded(false);
    const userDashboard = getDashboardPath(user);

    if (location.pathname === userDashboard) {
      e.preventDefault();
      console.log("🔄 Reloading dashboard from nav link...");
      window.location.reload();
    }
  };

  // Get user role display name
  const getUserRoleDisplay = () => {
    if (!user) return "";

    if (user.role) {
      switch (user.role.toLowerCase()) {
        case "student":
          return "Student";
        case "company":
        case "employer":
        case "business":
          return "Company";
        case "institution":
        case "admin":
        case "administrator":
          return "Institution";
        case "superadmin":
        case "super_admin":
          return "Administrator";
        default:
          return user.role;
      }
    }
    return user.userType || "User";
  };

  // Get role badge variant
  const getRoleBadgeVariant = () => {
    if (!user) return "secondary";

    const role = user.role?.toLowerCase() || user.userType?.toLowerCase();

    switch (role) {
      case "student":
        return "primary";
      case "company":
      case "employer":
      case "business":
        return "success";
      case "institution":
      case "admin":
      case "administrator":
        return "warning";
      case "superadmin":
      case "super_admin":
        return "danger";
      default:
        return "secondary";
    }
  };

  // Debug: Log current dashboard info
  useEffect(() => {
    if (user) {
      console.log("👤 Current User:", {
        email: user.email,
        role: user.role,
        userType: user.userType,
        institutionId: user.institutionId,
        calculatedDashboard: getDashboardPath(user),
        currentPath: location.pathname
      });
    }
  }, [user, location.pathname]);

  if (loading) {
    return (
      <BootstrapNavbar bg="light" expand="lg" className="border-bottom">
        <Container>
          <BootstrapNavbar.Brand>
            <strong>Career Connect Lesotho</strong>
          </BootstrapNavbar.Brand>
          <div className="ms-auto">
            <Spinner animation="border" size="sm" className="me-2" />
            <span className="text-muted">Loading...</span>
          </div>
        </Container>
      </BootstrapNavbar>
    );
  }

  return (
    <BootstrapNavbar
      bg="white"
      expand="lg"
      className="border-bottom shadow-sm"
      expanded={expanded}
      onToggle={(expanded) => setExpanded(expanded)}
    >
      <Container>
        {/* Brand/Logo */}
        <BootstrapNavbar.Brand
          as={Link}
          to={user ? currentDashboard : "/"}
          onClick={handleBrandClick}
          className="fw-bold text-primary"
          style={{ textDecoration: 'none' }}
        >
          🎯 Career Connect Lesotho
        </BootstrapNavbar.Brand>

        {/* Mobile Toggle */}
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />

        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          {/* Navigation Links - Left Side */}
          <Nav className="me-auto">
            <Nav.Link
              as={Link}
              to="/"
              onClick={handleHomeClick}
              active={location.pathname === "/"}
            >
              Home
            </Nav.Link>

            {user && (
              <Nav.Link
                as={Link}
                to={currentDashboard}
                onClick={handleDashboardClick}
                active={location.pathname.startsWith(currentDashboard)}
              >
                Dashboard
              </Nav.Link>
            )}
          </Nav>

          {/* User Menu - Right Side */}
          <Nav className="ms-auto">
            {user ? (
              <>
                {/* User Info - Visible on desktop */}
                <Nav.Item className="d-none d-lg-flex align-items-center me-3">
                  <div className="text-end">
                    <div className="small text-muted">
                      Welcome, <strong>{user.displayName || user.fullName || user.email?.split('@')[0] || "User"}</strong>
                    </div>
                    <Badge bg={getRoleBadgeVariant()} className="mt-1">
                      {getUserRoleDisplay()}
                    </Badge>
                  </div>
                </Nav.Item>

                {/* User Dropdown */}
                <NavDropdown
                  title={
                    <div className="d-inline-flex align-items-center">
                      <div
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                        style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}
                      >
                        {user.displayName?.charAt(0) || user.fullName?.charAt(0) || user.email?.charAt(0) || "U"}
                      </div>
                      <span className="d-none d-md-inline">
                        {user.displayName || user.fullName || user.email?.split('@')[0] || "User"}
                      </span>
                    </div>
                  }
                  id="user-dropdown"
                  align="end"
                >
                  {/* User Info in Dropdown - Visible on mobile */}
                  <div className="px-3 py-2 d-lg-none border-bottom">
                    <div className="small text-muted">Signed in as</div>
                    <div className="fw-bold">
                      {user.displayName || user.fullName || user.email}
                    </div>
                    <Badge bg={getRoleBadgeVariant()} className="mt-1">
                      {getUserRoleDisplay()}
                    </Badge>
                  </div>

                  <NavDropdown.Item
                    as={Link}
                    to={currentDashboard}
                    onClick={() => handleNavigation(currentDashboard)}
                  >
                    <i className="bi bi-speedometer2 me-2"></i>
                    Dashboard
                  </NavDropdown.Item>

                  <NavDropdown.Item
                    as={Link}
                    to="/profile"
                    onClick={() => handleNavigation("/profile")}
                  >
                    <i className="bi bi-person me-2"></i>
                    My Profile
                  </NavDropdown.Item>

                  <NavDropdown.Divider />

                  <NavDropdown.Item
                    as={Link}
                    to="/settings"
                    onClick={() => handleNavigation("/settings")}
                  >
                    <i className="bi bi-gear me-2"></i>
                    Settings
                  </NavDropdown.Item>

                  <NavDropdown.Divider />

                  <NavDropdown.Item onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2 text-danger"></i>
                    <span className="text-danger">Logout</span>
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              /* Auth Links for non-logged in users */
              <div className="d-flex flex-column flex-lg-row gap-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  as={Link}
                  to="/login"
                  onClick={() => setExpanded(false)}
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  as={Link}
                  to="/register"
                  onClick={() => setExpanded(false)}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
