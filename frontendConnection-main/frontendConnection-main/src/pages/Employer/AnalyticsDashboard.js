import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./employer-dashboard.css";

const AnalyticsDashboard = () => {
  useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState("30d");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockAnalytics = {
          overview: {
            totalCandidates: 156,
            interviewsConducted: 45,
            hiredCandidates: 8,
            openPositions: 5,
            conversionRate: "5.1%",
            avgTimeToHire: "18 days",
          },
          pipeline: {
            new: 24,
            screening: 18,
            interview: 12,
            offer: 6,
            hired: 8,
          },
          trends: {
            applications: [65, 59, 80, 81, 56, 55, 40],
            interviews: [28, 48, 40, 19, 86, 27, 90],
            hires: [2, 1, 3, 2, 1, 4, 2],
          },
          sources: [
            { name: "Career Portal", value: 45 },
            { name: "LinkedIn", value: 25 },
            { name: "Referrals", value: 15 },
            { name: "Job Boards", value: 10 },
            { name: "Other", value: 5 },
          ],
          performance: {
            timeToFill: "24 days",
            costPerHire: "M8,500",
            qualityOfHire: "4.2/5",
            retentionRate: "92%",
          },
        };
        setAnalytics(mockAnalytics);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error loading analytics:", error);
      setIsLoading(false);
    }
  };

  const MetricCard = ({ title, value, change, icon, color }) => (
    <div className="metric-card" style={{ "--metric-color": color }}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <h3>{value}</h3>
        <p>{title}</p>
        {change && <span className="metric-change">{change}</span>}
      </div>
    </div>
  );

  const PipelineStage = ({ stage, count, percentage, color }) => (
    <div className="pipeline-stage">
      <div className="stage-header">
        <span className="stage-name">{stage}</span>
        <span className="stage-count">{count}</span>
      </div>
      <div className="stage-bar">
        <div
          className="stage-progress"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        ></div>
      </div>
      <span className="stage-percentage">{percentage}%</span>
    </div>
  );

  if (isLoading) {
    return (
      <div className="analytics-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="page-header">
        <div className="header-content">
          <h1>Recruitment Analytics</h1>
          <p>Track and analyze your hiring performance</p>
        </div>
        <div className="header-actions">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-selector"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="btn-secondary">Export Report</button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="metrics-overview">
        <MetricCard
          title="Total Candidates"
          value={analytics.overview.totalCandidates.toLocaleString()}
          change="+12%"
          icon="👥"
          color="#3B82F6"
        />
        <MetricCard
          title="Interviews Conducted"
          value={analytics.overview.interviewsConducted}
          change="+8%"
          icon="📅"
          color="#10B981"
        />
        <MetricCard
          title="Successful Hires"
          value={analytics.overview.hiredCandidates}
          change="+15%"
          icon="✅"
          color="#F59E0B"
        />
        <MetricCard
          title="Conversion Rate"
          value={analytics.overview.conversionRate}
          change="+2.1%"
          icon="📊"
          color="#8B5CF6"
        />
      </div>

      <div className="analytics-content">
        {/* Left Column */}
        <div className="left-column">
          {/* Candidate Pipeline */}
          <section className="analytics-section">
            <h2>Candidate Pipeline</h2>
            <div className="pipeline-analytics">
              <PipelineStage
                stage="New Applicants"
                count={analytics.pipeline.new}
                percentage={35}
                color="#3B82F6"
              />
              <PipelineStage
                stage="Screening"
                count={analytics.pipeline.screening}
                percentage={26}
                color="#10B981"
              />
              <PipelineStage
                stage="Interview"
                count={analytics.pipeline.interview}
                percentage={18}
                color="#F59E0B"
              />
              <PipelineStage
                stage="Offer"
                count={analytics.pipeline.offer}
                percentage={9}
                color="#8B5CF6"
              />
              <PipelineStage
                stage="Hired"
                count={analytics.pipeline.hired}
                percentage={12}
                color="#EF4444"
              />
            </div>
          </section>

          {/* Recruitment Sources */}
          <section className="analytics-section">
            <h2>Candidate Sources</h2>
            <div className="sources-chart">
              {analytics.sources.map((source, index) => (
                <div key={source.name} className="source-item">
                  <div className="source-header">
                    <span className="source-name">{source.name}</span>
                    <span className="source-value">{source.value}%</span>
                  </div>
                  <div className="source-bar">
                    <div
                      className="source-progress"
                      style={{
                        width: `${source.value}%`,
                        backgroundColor: [
                          "#3B82F6",
                          "#10B981",
                          "#F59E0B",
                          "#8B5CF6",
                          "#6B7280",
                        ][index],
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="right-column">
          {/* Performance Metrics */}
          <section className="analytics-section">
            <h2>Performance Metrics</h2>
            <div className="performance-grid">
              <div className="performance-card">
                <div className="performance-icon">⏱️</div>
                <div className="performance-content">
                  <span className="performance-value">
                    {analytics.performance.timeToFill}
                  </span>
                  <span className="performance-label">Avg. Time to Fill</span>
                </div>
              </div>
              <div className="performance-card">
                <div className="performance-icon">💰</div>
                <div className="performance-content">
                  <span className="performance-value">
                    {analytics.performance.costPerHire}
                  </span>
                  <span className="performance-label">Cost per Hire</span>
                </div>
              </div>
              <div className="performance-card">
                <div className="performance-icon">⭐</div>
                <div className="performance-content">
                  <span className="performance-value">
                    {analytics.performance.qualityOfHire}
                  </span>
                  <span className="performance-label">Quality of Hire</span>
                </div>
              </div>
              <div className="performance-card">
                <div className="performance-icon">📈</div>
                <div className="performance-content">
                  <span className="performance-value">
                    {analytics.performance.retentionRate}
                  </span>
                  <span className="performance-label">Retention Rate</span>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="analytics-section">
            <h2>Recent Hiring Activity</h2>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">✅</div>
                <div className="activity-content">
                  <p>Thato Molise hired as Senior Developer</p>
                  <span className="activity-time">2 days ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📅</div>
                <div className="activity-content">
                  <p>3 new interviews scheduled for this week</p>
                  <span className="activity-time">3 days ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">👥</div>
                <div className="activity-content">
                  <p>24 new applications received</p>
                  <span className="activity-time">1 week ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📊</div>
                <div className="activity-content">
                  <p>Monthly recruitment report generated</p>
                  <span className="activity-time">2 weeks ago</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Trends Chart Placeholder */}
      <section className="analytics-section full-width">
        <h2>Hiring Trends</h2>
        <div className="trends-chart-placeholder">
          <div className="chart-container">
            <p>📈 Applications, Interviews, and Hires Over Time</p>
            <div className="chart-legend">
              <span className="legend-item applications">Applications</span>
              <span className="legend-item interviews">Interviews</span>
              <span className="legend-item hires">Hires</span>
            </div>
            <div className="chart-bars">
              {analytics.trends.applications.map((value, index) => (
                <div key={index} className="chart-bar-group">
                  <div
                    className="chart-bar applications"
                    style={{ height: `${value}%` }}
                  ></div>
                  <div
                    className="chart-bar interviews"
                    style={{ height: `${analytics.trends.interviews[index]}%` }}
                  ></div>
                  <div
                    className="chart-bar hires"
                    style={{ height: `${analytics.trends.hires[index] * 10}%` }}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsDashboard;
