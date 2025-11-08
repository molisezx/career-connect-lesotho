import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./employer-dashboard.css";

const InterviewsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [filteredInterviews, setFilteredInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadInterviews();
  }, []);

  useEffect(() => {
    filterInterviews();
  }, [filter, interviews]);

  const loadInterviews = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        const mockInterviews = [
          {
            id: 1,
            candidateName: "Thato Molise",
            candidateRole: "Senior Developer",
            candidateId: 1,
            position: "Senior Developer",
            date: "2024-01-15",
            time: "14:00",
            type: "Technical",
            status: "scheduled",
            duration: "60 mins",
            interviewers: ["John Doe", "Jane Smith"],
            meetingLink: "https://meet.google.com/abc-def-ghi",
            notes: "Focus on React and Node.js experience",
          },
          {
            id: 2,
            candidateName: "Lerato Mokoena",
            candidateRole: "Product Manager",
            candidateId: 2,
            position: "Product Manager",
            date: "2024-01-16",
            time: "10:00",
            type: "Cultural",
            status: "scheduled",
            duration: "45 mins",
            interviewers: ["John Doe"],
            meetingLink: "https://meet.google.com/jkl-mno-pqr",
            notes: "Discuss product strategy and team management",
          },
          {
            id: 3,
            candidateName: "Mpho Sebata",
            candidateRole: "Data Analyst",
            candidateId: 3,
            position: "Data Analyst",
            date: "2024-01-12",
            time: "15:30",
            type: "Technical",
            status: "completed",
            duration: "60 mins",
            interviewers: ["Jane Smith", "Mike Johnson"],
            meetingLink: "",
            notes: "Strong SQL skills, good analytical thinking",
            feedback: "Positive - proceed to next round",
            rating: 4,
          },
          {
            id: 4,
            candidateName: "Anna Motaung",
            candidateRole: "Frontend Developer",
            candidateId: 5,
            position: "Frontend Developer",
            date: "2024-01-10",
            time: "11:00",
            type: "Technical",
            status: "cancelled",
            duration: "45 mins",
            interviewers: ["John Doe"],
            meetingLink: "",
            notes: "Candidate requested reschedule",
            cancellationReason: "Candidate unavailable",
          },
        ];
        setInterviews(mockInterviews);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error loading interviews:", error);
      setIsLoading(false);
    }
  };

  const filterInterviews = () => {
    if (filter === "all") {
      setFilteredInterviews(interviews);
    } else {
      setFilteredInterviews(interviews.filter((i) => i.status === filter));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { label: "Scheduled", class: "scheduled" },
      completed: { label: "Completed", class: "completed" },
      cancelled: { label: "Cancelled", class: "cancelled" },
      rescheduled: { label: "Rescheduled", class: "rescheduled" },
    };

    const config = statusConfig[status] || { label: status, class: status };
    return (
      <span className={`status-badge ${config.class}`}>{config.label}</span>
    );
  };

  const getTypeIcon = (type) => {
    const icons = {
      technical: "💻",
      cultural: "👥",
      portfolio: "📁",
      behavioral: "💬",
      final: "✅",
    };
    return icons[type.toLowerCase()] || "📅";
  };

  const handleJoinMeeting = (interview) => {
    if (interview.meetingLink) {
      window.open(interview.meetingLink, "_blank");
    }
  };

  const handleReschedule = (interview) => {
    navigate("/dashboard/employer/interviews/schedule", {
      state: {
        candidateId: interview.candidateId,
        candidateName: interview.candidateName,
        editMode: true,
        interviewId: interview.id,
      },
    });
  };

  const scheduleNewInterview = () => {
    navigate("/dashboard/employer/interviews/schedule");
  };

  if (isLoading) {
    return (
      <div className="interviews-list loading">
        <div className="loading-spinner"></div>
        <p>Loading interviews...</p>
      </div>
    );
  }

  return (
    <div className="interviews-list">
      <div className="page-header">
        <div className="header-content">
          <h1>Interview Management</h1>
          <p>Schedule and manage candidate interviews</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={scheduleNewInterview}>
            + Schedule Interview
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Interviews
          </button>
          <button
            className={`filter-tab ${filter === "scheduled" ? "active" : ""}`}
            onClick={() => setFilter("scheduled")}
          >
            Scheduled
          </button>
          <button
            className={`filter-tab ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            Completed
          </button>
          <button
            className={`filter-tab ${filter === "cancelled" ? "active" : ""}`}
            onClick={() => setFilter("cancelled")}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Interviews List */}
      <div className="interviews-container">
        {filteredInterviews.length > 0 ? (
          filteredInterviews.map((interview) => (
            <div key={interview.id} className="interview-card">
              <div className="interview-header">
                <div className="candidate-info">
                  <div className="candidate-avatar">
                    {interview.candidateName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="candidate-details">
                    <h4>{interview.candidateName}</h4>
                    <p>{interview.candidateRole}</p>
                    <span className="position">For: {interview.position}</span>
                  </div>
                </div>
                <div className="interview-meta">
                  {getStatusBadge(interview.status)}
                  <span className="interview-type">
                    {getTypeIcon(interview.type)} {interview.type}
                  </span>
                </div>
              </div>

              <div className="interview-details">
                <div className="detail-row">
                  <span className="detail-label">Date & Time:</span>
                  <span className="detail-value">
                    {new Date(interview.date).toLocaleDateString()} at{" "}
                    {interview.time}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Duration:</span>
                  <span className="detail-value">{interview.duration}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Interviewers:</span>
                  <span className="detail-value">
                    {interview.interviewers.join(", ")}
                  </span>
                </div>
                {interview.notes && (
                  <div className="detail-row">
                    <span className="detail-label">Notes:</span>
                    <span className="detail-value">{interview.notes}</span>
                  </div>
                )}
                {interview.feedback && (
                  <div className="detail-row">
                    <span className="detail-label">Feedback:</span>
                    <span className="detail-value feedback">
                      {interview.feedback}
                    </span>
                  </div>
                )}
                {interview.rating && (
                  <div className="detail-row">
                    <span className="detail-label">Rating:</span>
                    <span className="detail-value rating">
                      {"⭐".repeat(interview.rating)}
                    </span>
                  </div>
                )}
              </div>

              <div className="interview-actions">
                {interview.status === "scheduled" && (
                  <>
                    <button
                      className="btn-action primary"
                      onClick={() => handleJoinMeeting(interview)}
                    >
                      Join Meeting
                    </button>
                    <button
                      className="btn-action secondary"
                      onClick={() => handleReschedule(interview)}
                    >
                      Reschedule
                    </button>
                    <button className="btn-action outline">Cancel</button>
                  </>
                )}
                {interview.status === "completed" && (
                  <>
                    <button className="btn-action primary">
                      View Feedback
                    </button>
                    <button className="btn-action secondary">
                      Schedule Next
                    </button>
                  </>
                )}
                {interview.status === "cancelled" && (
                  <button
                    className="btn-action primary"
                    onClick={() => handleReschedule(interview)}
                  >
                    Reschedule
                  </button>
                )}
                <button
                  className="btn-action outline"
                  onClick={() =>
                    navigate(
                      `/dashboard/employer/candidates/${interview.candidateId}`
                    )
                  }
                >
                  View Candidate
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-interviews">
            <div className="no-interviews-icon">📅</div>
            <h3>No interviews found</h3>
            <p>
              {filter === "all"
                ? "You haven't scheduled any interviews yet."
                : `No ${filter} interviews found.`}
            </p>
            <button className="btn-primary" onClick={scheduleNewInterview}>
              Schedule Your First Interview
            </button>
          </div>
        )}
      </div>

      {/* Upcoming Interviews Stats */}
      <div className="stats-section">
        <div className="stat-card">
          <h3>Today's Interviews</h3>
          <span className="stat-number">
            {
              interviews.filter(
                (i) =>
                  i.date === new Date().toISOString().split("T")[0] &&
                  i.status === "scheduled"
              ).length
            }
          </span>
        </div>
        <div className="stat-card">
          <h3>This Week</h3>
          <span className="stat-number">
            {
              interviews.filter((i) => {
                const interviewDate = new Date(i.date);
                const today = new Date();
                const weekEnd = new Date(today);
                weekEnd.setDate(today.getDate() + 7);
                return (
                  interviewDate >= today &&
                  interviewDate <= weekEnd &&
                  i.status === "scheduled"
                );
              }).length
            }
          </span>
        </div>
        <div className="stat-card">
          <h3>Completion Rate</h3>
          <span className="stat-number">
            {Math.round(
              (interviews.filter((i) => i.status === "completed").length /
                interviews.filter((i) => i.status !== "cancelled").length) *
                100
            )}
            %
          </span>
        </div>
      </div>
    </div>
  );
};

export default InterviewsList;
