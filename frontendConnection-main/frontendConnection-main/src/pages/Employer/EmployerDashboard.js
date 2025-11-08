import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./EmployerDashboard.css";

const EmployerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCandidates: 0,
    interviews: 0,
    hired: 0,
    activePositions: 0,
  });
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [candidatePool, setCandidatePool] = useState([]);
  const [recruitmentMetrics, setRecruitmentMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Simulate loading data
      setTimeout(() => {
        setStats({
          totalCandidates: 156,
          interviews: 12,
          hired: 8,
          activePositions: 5,
        });

        setUpcomingInterviews([
          {
            id: 1,
            candidateName: "Thato Molise",
            position: "Senior Developer",
            time: "Today, 2:00 PM",
            type: "Technical",
          },
          {
            id: 2,
            candidateName: "Lerato Mokoena",
            position: "Product Manager",
            time: "Tomorrow, 10:00 AM",
            type: "Cultural",
          },
          {
            id: 3,
            candidateName: "Mpho Sebata",
            position: "Data Analyst",
            time: "Tomorrow, 3:30 PM",
            type: "Technical",
          },
          {
            id: 4,
            candidateName: "Kabelo Nkosi",
            position: "UX Designer",
            time: "Friday, 11:00 AM",
            type: "Portfolio",
          },
        ]);

        setCandidatePool([
          {
            id: 1,
            name: "Thato Molise",
            role: "Senior Developer",
            experience: "5 years",
            skills: ["React", "Node.js", "TypeScript"],
            status: "shortlisted",
            match: 95,
          },
          {
            id: 2,
            name: "Lerato Mokoena",
            role: "Product Manager",
            experience: "4 years",
            skills: ["Agile", "Scrum", "JIRA"],
            status: "interview",
            match: 88,
          },
          {
            id: 3,
            name: "Mpho Sebata",
            role: "Data Analyst",
            experience: "3 years",
            skills: ["Python", "SQL", "Tableau"],
            status: "new",
            match: 82,
          },
          {
            id: 4,
            name: "Kabelo Nkosi",
            role: "UX Designer",
            experience: "4 years",
            skills: ["Figma", "UI/UX", "Prototyping"],
            status: "hired",
            match: 90,
          },
        ]);

        setRecruitmentMetrics({
          timeToHire: "18 days",
          offerAcceptance: "85%",
          candidateSatisfaction: "4.7/5",
          retentionRate: "92%",
        });

        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon, color }) => (
    <div className="stat-card" style={{ "--stat-color": color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3>{value.toLocaleString()}</h3>
        <p>{title}</p>
        {change && <span className="stat-change">{change}</span>}
      </div>
    </div>
  );

  const QuickAction = ({ icon, title, description, onClick, color }) => (
    <div
      className="quick-action-card"
      style={{ "--accent-color": color }}
      onClick={onClick}
    >
      <div className="action-icon">{icon}</div>
      <div className="action-content">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      <div className="action-arrow">→</div>
    </div>
  );

  const CandidateCard = ({ candidate }) => (
    <div className="candidate-card">
      <div className="candidate-header">
        <div className="candidate-avatar">
          {candidate.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div className="candidate-info">
          <h4>{candidate.name}</h4>
          <p>{candidate.role}</p>
          <span className="candidate-experience">{candidate.experience}</span>
        </div>
        <div className="candidate-match">
          <span className="match-score">{candidate.match}%</span>
        </div>
      </div>
      <div className="candidate-skills">
        {candidate.skills.map((skill, index) => (
          <span key={index} className="skill-tag">
            {skill}
          </span>
        ))}
      </div>
      <div className="candidate-footer">
        <span className={`status-badge ${candidate.status}`}>
          {candidate.status}
        </span>
        <div className="candidate-actions">
          <button
            className="btn-action view"
            onClick={() =>
              navigate(`/dashboard/employer/candidates/${candidate.id}`)
            }
          >
            View
          </button>
          <button className="btn-action contact">Contact</button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="employer-dashboard loading">
        <div className="loading-spinner large"></div>
        <p>Loading your employer dashboard...</p>
      </div>
    );
  }

  return (
    <div className="employer-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1 className="welcome-title">
              Welcome to your{" "}
              <span className="gradient-text">Employer Dashboard</span>
            </h1>
            <p className="welcome-subtitle">
              Manage your recruitment process, candidate pipeline, and hiring
              activities.
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-notification">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              <span className="notification-badge">{stats.interviews}</span>
            </button>
            <div className="user-avatar">
              {user?.fullName?.charAt(0) || "E"}
            </div>
          </div>
        </div>

        {/* Recruiter Info Bar */}
        <div className="recruiter-info-bar">
          <div className="recruiter-badge">
            <div className="recruiter-avatar">
              {user?.fullName?.charAt(0) || "E"}
            </div>
            <div className="recruiter-details">
              <h3>{user?.fullName || "Employer"}</h3>
              <p>Senior Recruiter • Talent Acquisition</p>
            </div>
          </div>
          <div className="recruiter-meta">
            <span>👑 Top Performer</span>
            <span className="success-rate">92% Success Rate</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <StatCard
          title="Total Candidates"
          value={stats.totalCandidates}
          change="+24 this week"
          icon="👥"
          color="#3B82F6"
        />
        <StatCard
          title="Upcoming Interviews"
          value={stats.interviews}
          change="4 this week"
          icon="📅"
          color="#10B981"
        />
        <StatCard
          title="Successful Hires"
          value={stats.hired}
          change="+2 this month"
          icon="✅"
          color="#F59E0B"
        />
        <StatCard
          title="Active Positions"
          value={stats.activePositions}
          change="1 new opening"
          icon="💼"
          color="#8B5CF6"
        />
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Quick Actions */}
        <section className="section">
          <div className="section-header">
            <h2>Quick Actions</h2>
            <p>Streamline your recruitment workflow</p>
          </div>
          <div className="quick-actions-grid">
            <QuickAction
              icon="🔍"
              title="Search Candidates"
              description="Find qualified candidates in our database"
              color="#3B82F6"
              onClick={() => navigate("/dashboard/employer/candidates")}
            />
            <QuickAction
              icon="📋"
              title="Schedule Interviews"
              description="Arrange meetings with candidates"
              color="#10B981"
              onClick={() => navigate("/dashboard/employer/interviews")}
            />
            <QuickAction
              icon="📊"
              title="View Analytics"
              description="Recruitment metrics and insights"
              color="#F59E0B"
              onClick={() => navigate("/dashboard/employer/analytics")}
            />
            <QuickAction
              icon="💬"
              title="Candidate Messages"
              description="Communicate with applicants"
              color="#8B5CF6"
              onClick={() => navigate("/dashboard/employer/messages")}
            />
          </div>
        </section>

        <div className="content-columns">
          {/* Left Column */}
          <div className="left-column">
            {/* Upcoming Interviews */}
            <section className="section">
              <div className="section-header">
                <h2>Upcoming Interviews</h2>
                <Link
                  to="/dashboard/employer/interviews"
                  className="view-all-link"
                >
                  View All
                </Link>
              </div>
              <div className="interviews-list">
                {upcomingInterviews.map((interview, index) => (
                  <div
                    key={interview.id}
                    className="interview-item"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="interview-time">
                      <span className="time-icon">🕒</span>
                      <div className="time-details">
                        <span className="time-main">{interview.time}</span>
                        <span className="time-type">{interview.type}</span>
                      </div>
                    </div>
                    <div className="interview-details">
                      <h4>{interview.candidateName}</h4>
                      <p>{interview.position}</p>
                    </div>
                    <div className="interview-actions">
                      <button className="btn-action join">Join</button>
                      <button className="btn-action reschedule">
                        Reschedule
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Candidate Pipeline */}
            <section className="section">
              <div className="section-header">
                <h2>Candidate Pipeline</h2>
                <button className="btn-add">+ Add Candidate</button>
              </div>
              <div className="pipeline-stats">
                <div className="pipeline-stage">
                  <div className="stage-header">
                    <span className="stage-name">New Applicants</span>
                    <span className="stage-count">24</span>
                  </div>
                  <div className="stage-bar">
                    <div
                      className="stage-progress"
                      style={{ width: "30%" }}
                    ></div>
                  </div>
                </div>
                <div className="pipeline-stage">
                  <div className="stage-header">
                    <span className="stage-name">Screening</span>
                    <span className="stage-count">18</span>
                  </div>
                  <div className="stage-bar">
                    <div
                      className="stage-progress"
                      style={{ width: "22%" }}
                    ></div>
                  </div>
                </div>
                <div className="pipeline-stage">
                  <div className="stage-header">
                    <span className="stage-name">Interview</span>
                    <span className="stage-count">12</span>
                  </div>
                  <div className="stage-bar">
                    <div
                      className="stage-progress"
                      style={{ width: "15%" }}
                    ></div>
                  </div>
                </div>
                <div className="pipeline-stage">
                  <div className="stage-header">
                    <span className="stage-name">Offer</span>
                    <span className="stage-count">6</span>
                  </div>
                  <div className="stage-bar">
                    <div
                      className="stage-progress"
                      style={{ width: "8%" }}
                    ></div>
                  </div>
                </div>
                <div className="pipeline-stage">
                  <div className="stage-header">
                    <span className="stage-name">Hired</span>
                    <span className="stage-count">8</span>
                  </div>
                  <div className="stage-bar">
                    <div
                      className="stage-progress"
                      style={{ width: "10%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="right-column">
            {/* Top Candidates */}
            <section className="section">
              <div className="section-header">
                <h2>Top Candidates</h2>
                <Link
                  to="/dashboard/employer/candidates"
                  className="view-all-link"
                >
                  View All
                </Link>
              </div>
              <div className="candidates-grid">
                {candidatePool.slice(0, 3).map((candidate) => (
                  <CandidateCard key={candidate.id} candidate={candidate} />
                ))}
              </div>
            </section>

            {/* Recruitment Metrics */}
            <section className="section">
              <div className="section-header">
                <h2>Recruitment Metrics</h2>
              </div>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-icon">⏱️</div>
                  <div className="metric-content">
                    <span className="metric-value">
                      {recruitmentMetrics.timeToHire}
                    </span>
                    <span className="metric-label">Avg. Time to Hire</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon">✅</div>
                  <div className="metric-content">
                    <span className="metric-value">
                      {recruitmentMetrics.offerAcceptance}
                    </span>
                    <span className="metric-label">Offer Acceptance</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon">⭐</div>
                  <div className="metric-content">
                    <span className="metric-value">
                      {recruitmentMetrics.candidateSatisfaction}
                    </span>
                    <span className="metric-label">Candidate Satisfaction</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon">📈</div>
                  <div className="metric-content">
                    <span className="metric-value">
                      {recruitmentMetrics.retentionRate}
                    </span>
                    <span className="metric-label">Retention Rate</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Tools */}
            <section className="section">
              <div className="section-header">
                <h2>Quick Tools</h2>
              </div>
              <div className="tools-grid">
                <div className="tool-card">
                  <div className="tool-icon">📝</div>
                  <div className="tool-content">
                    <h4>Job Description</h4>
                    <p>Create compelling job posts</p>
                  </div>
                </div>
                <div className="tool-card">
                  <div className="tool-icon">📋</div>
                  <div className="tool-content">
                    <h4>Interview Kit</h4>
                    <p>Prepare interview questions</p>
                  </div>
                </div>
                <div className="tool-card">
                  <div className="tool-icon">📊</div>
                  <div className="tool-content">
                    <h4>Reports</h4>
                    <p>Generate hiring reports</p>
                  </div>
                </div>
                <div className="tool-card">
                  <div className="tool-icon">🔔</div>
                  <div className="tool-content">
                    <h4>Alerts</h4>
                    <p>Set up notifications</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Recent Activity */}
        <section className="section">
          <div className="section-header">
            <h2>Recent Activity</h2>
            <Link to="/dashboard/employer/activity" className="view-all-link">
              View All
            </Link>
          </div>
          <div className="activity-timeline">
            <div className="timeline-item">
              <div className="timeline-icon">👥</div>
              <div className="timeline-content">
                <p>
                  You shortlisted <strong>Thato Molise</strong> for{" "}
                  <strong>Senior Developer</strong>
                </p>
                <span className="timeline-time">2 hours ago</span>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-icon">📅</div>
              <div className="timeline-content">
                <p>
                  Interview scheduled with <strong>Lerato Mokoena</strong> for
                  tomorrow
                </p>
                <span className="timeline-time">Yesterday</span>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-icon">✅</div>
              <div className="timeline-content">
                <p>
                  <strong>Kabelo Nkosi</strong> accepted your offer for{" "}
                  <strong>UX Designer</strong>
                </p>
                <span className="timeline-time">2 days ago</span>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-icon">📊</div>
              <div className="timeline-content">
                <p>Monthly recruitment report generated successfully</p>
                <span className="timeline-time">3 days ago</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EmployerDashboard;
