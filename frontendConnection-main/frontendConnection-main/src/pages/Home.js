import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to Career Connect Lesotho</h1>
          <p className="hero-subtitle">
            Your gateway to education and career opportunities in Lesotho.
            Connect with institutions, discover courses, and launch your career.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎓</div>
              <h3>For Students</h3>
              <p>
                Discover higher learning institutions, apply for courses online,
                and access career opportunities after graduation.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏫</div>
              <h3>For Institutions</h3>
              <p>
                Manage student applications, publish admissions, and connect
                with qualified students across Lesotho.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👨‍💼</div>
              <h3>For Employees</h3>
              <p>
                Explore career growth opportunities, access professional
                development resources, and advance your career path.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💼</div>
              <h3>For Companies</h3>
              <p>
                Find talented graduates, post job opportunities, and connect
                with qualified candidates for your organization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Start Your Journey?</h2>
          <p>
            Join thousands of students and institutions already using Career
            Connect Lesotho.
          </p>
          <Link to="/register" className="btn btn-large">
            Create Your Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
