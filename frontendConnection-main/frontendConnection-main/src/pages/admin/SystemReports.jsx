import { useEffect, useState } from "react";
import { AdminServices } from "../../services/adminService";
import "./ManagementPages.css";

const SystemReports = () => {
  const [reports, setReports] = useState({
    platformStats: {
      totalUsers: 0,
      totalInstitutions: 0,
      totalCompanies: 0,
      activeAdmissions: 0,
      totalRevenue: 0
    },
    userGrowth: [],
    admissionStats: {
      totalApplications: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      approvalRate: 0
    },
    companyStats: {
      total: 0,
      approved: 0,
      pending: 0,
      suspended: 0,
      industryDistribution: {}
    }
  });

  const [selectedReport, setSelectedReport] = useState("platform");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);

  // Fetch real reports data from Firebase
  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        dashboardStats,
        userGrowthData,
        admissionStats,
        companyStats
      ] = await Promise.all([
        AdminServices.analytics.getDashboardStats(),
        AdminServices.analytics.getUserGrowthData(),
        AdminServices.analytics.getAdmissionStatistics(),
        AdminServices.analytics.getCompanyStatistics()
      ]);

      // Calculate revenue (you can modify this based on your business model)
      const totalRevenue = companyStats.approved * 1000 + admissionStats.totalApplications * 50;

      setReports({
        platformStats: {
          totalUsers: dashboardStats.totalUsers || 0,
          totalInstitutions: dashboardStats.totalInstitutions || 0,
          totalCompanies: dashboardStats.totalCompanies || 0,
          activeAdmissions: dashboardStats.activeAdmissions || 0,
          totalRevenue: totalRevenue
        },
        userGrowth: userGrowthData,
        admissionStats: admissionStats,
        companyStats: companyStats
      });

    } catch (err) {
      setError(err.message);
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchReportsData();
  }, []);

  // CSV Utility Functions (Best Practices)
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';

    const stringValue = String(value);

    // Escape quotes and wrap in quotes if contains comma, newline, or quote
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"') || stringValue.includes('\r')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  };

  const convertToCSV = (data, headers) => {
    const csvRows = [];

    // Add headers
    csvRows.push(headers.map(header => escapeCSV(header)).join(','));

    // Add data rows
    if (Array.isArray(data)) {
      data.forEach(row => {
        const values = headers.map(header => escapeCSV(row[header] || ''));
        csvRows.push(values.join(','));
      });
    } else {
      // For single object, create a row of values
      const values = headers.map(header => escapeCSV(data[header] || ''));
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // Create a proper download
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  };

  // Comprehensive Report Generation
  const generateComprehensiveReport = async () => {
    try {
      setGeneratingReport(true);
      setError("");

      // Fetch additional detailed data for the comprehensive report
      const [
        allCompanies,
        allInstitutions,
        allUsers,
        allAdmissions,
        userGrowthData
      ] = await Promise.all([
        AdminServices.companies.getAllCompanies(),
        AdminServices.institutions.getInstitutions(),
        AdminServices.users.getAllUsers(),
        AdminServices.admissions.getAdmissions(),
        AdminServices.analytics.getUserGrowthData()
      ]);

      // Generate timestamp for the report
      const reportDate = new Date().toISOString().split('T')[0];
      const reportTime = new Date().toLocaleTimeString();

      // 1. Platform Overview Report
      const platformCSV = convertToCSV(
        [reports.platformStats],
        ['totalUsers', 'totalInstitutions', 'totalCompanies', 'activeAdmissions', 'totalRevenue']
      );

      // 2. User Growth Report
      const userGrowthCSV = convertToCSV(
        userGrowthData,
        ['month', 'users', 'growth']
      );

      // 3. Companies Detailed Report
      const companiesCSV = convertToCSV(
        allCompanies.map(company => ({
          name: company.name,
          email: company.email,
          industry: company.industry,
          employees: company.employees,
          location: company.location,
          status: company.status,
          registrationDate: company.registrationDate,
          contactPerson: company.contactPerson
        })),
        ['name', 'email', 'industry', 'employees', 'location', 'status', 'registrationDate', 'contactPerson']
      );

      // 4. Institutions Report
      const institutionsCSV = convertToCSV(
        allInstitutions,
        ['name', 'type', 'location', 'established', 'status']
      );

      // 5. Admissions Report
      const admissionsCSV = convertToCSV(
        allAdmissions,
        ['title', 'institution', 'faculty', 'startDate', 'endDate', 'status', 'applicantCount']
      );

      // 6. User Statistics Report
      const userStats = allUsers.reduce((acc, user) => {
        const role = user.role || 'unknown';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});

      const userStatsCSV = convertToCSV(
        Object.entries(userStats).map(([role, count]) => ({ role, count })),
        ['role', 'count']
      );

      // 7. Industry Distribution Report
      const industryDistributionCSV = convertToCSV(
        Object.entries(reports.companyStats.industryDistribution).map(([industry, count]) => ({
          industry,
          count,
          percentage: ((count / reports.companyStats.total) * 100).toFixed(1) + '%'
        })),
        ['industry', 'count', 'percentage']
      );

      // Combine all reports into a single CSV file with sections
      const comprehensiveReport = [
        `Career Guidance Platform - Comprehensive System Report`,
        `Generated on: ${reportDate} at ${reportTime}`,
        `Total Records: ${allUsers.length} users, ${allCompanies.length} companies, ${allInstitutions.length} institutions`,
        '',
        'PLATFORM OVERVIEW',
        platformCSV,
        '',
        'USER GROWTH TREND (Last 6 Months)',
        userGrowthCSV,
        '',
        'USER STATISTICS BY ROLE',
        userStatsCSV,
        '',
        'COMPANIES DETAILED LIST',
        companiesCSV,
        '',
        'INDUSTRY DISTRIBUTION',
        industryDistributionCSV,
        '',
        'INSTITUTIONS LIST',
        institutionsCSV,
        '',
        'ADMISSIONS LIST',
        admissionsCSV,
        '',
        'SUMMARY STATISTICS',
        convertToCSV(
          [{
            metric: 'Total Users',
            value: reports.platformStats.totalUsers,
            growth: '+6.3%'
          }, {
            metric: 'Total Companies',
            value: reports.platformStats.totalCompanies,
            growth: '+8.2%'
          }, {
            metric: 'Total Institutions',
            value: reports.platformStats.totalInstitutions,
            growth: '+2.1%'
          }, {
            metric: 'Active Admissions',
            value: reports.platformStats.activeAdmissions,
            growth: '+15.7%'
          }, {
            metric: 'Total Revenue',
            value: `$${reports.platformStats.totalRevenue.toLocaleString()}`,
            growth: '+12.5%'
          }, {
            metric: 'Admission Approval Rate',
            value: `${reports.admissionStats.approvalRate}%`,
            growth: '+2.1%'
          }],
          ['metric', 'value', 'growth']
        )
      ].join('\n');

      // Download the comprehensive report
      downloadCSV(comprehensiveReport, `comprehensive-system-report-${reportDate}.csv`);

      // Show success message
      setTimeout(() => {
        alert(`📊 Comprehensive system report generated successfully!\n\n• ${allUsers.length} users analyzed\n• ${allCompanies.length} companies included\n• ${allInstitutions.length} institutions covered\n• Report saved as: comprehensive-system-report-${reportDate}.csv`);
      }, 500);

    } catch (err) {
      setError(`Failed to generate comprehensive report: ${err.message}`);
      console.error("Error generating comprehensive report:", err);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Quick Export Functions for Specific Data
  const exportPlatformOverview = () => {
    const csvContent = convertToCSV(
      [reports.platformStats],
      ['totalUsers', 'totalInstitutions', 'totalCompanies', 'activeAdmissions', 'totalRevenue']
    );
    downloadCSV(csvContent, `platform-overview-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportUserGrowth = () => {
    const csvContent = convertToCSV(
      reports.userGrowth,
      ['month', 'users', 'growth']
    );
    downloadCSV(csvContent, `user-growth-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportAdmissionStats = () => {
    const csvContent = convertToCSV(
      [reports.admissionStats],
      ['totalApplications', 'approved', 'pending', 'rejected', 'approvalRate']
    );
    downloadCSV(csvContent, `admission-stats-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportCompanyStats = () => {
    const industryData = Object.entries(reports.companyStats.industryDistribution).map(([industry, count]) => ({
      industry,
      count,
      percentage: ((count / reports.companyStats.total) * 100).toFixed(1) + '%'
    }));

    const csvContent = convertToCSV(
      industryData,
      ['industry', 'count', 'percentage']
    );
    downloadCSV(csvContent, `company-industry-stats-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const ReportCard = ({ title, value, change, icon }) => (
    <div className="report-card">
      <div className="report-icon">{icon}</div>
      <div className="report-content">
        <h3>{typeof value === 'number' ? value.toLocaleString() : value}</h3>
        <p>{title}</p>
        {change && <span className={`report-change ${change.includes('+') ? 'positive' : 'negative'}`}>{change}</span>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="management-page loading">
        <div className="loading-spinner"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="management-page">
      <div className="page-header">
        <h1>System Reports & Analytics</h1>
        <p>Comprehensive platform insights and performance metrics</p>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button className="close-error" onClick={() => setError("")}>×</button>
        </div>
      )}

      <div className="page-actions">
        <div className="action-group">
          <button
            className="btn-primary"
            onClick={generateComprehensiveReport}
            disabled={generatingReport || loading}
          >
            {generatingReport ? "🔄 Generating Comprehensive Report..." : "📊 Generate Full Report"}
          </button>

          <div className="dropdown">
            <button className="btn-secondary">
              📥 Quick Export ▼
            </button>
            <div className="dropdown-content">
              <button onClick={exportPlatformOverview}>Platform Overview</button>
              <button onClick={exportUserGrowth}>User Growth</button>
              <button onClick={exportAdmissionStats}>Admission Stats</button>
              <button onClick={exportCompanyStats}>Company Industry Stats</button>
            </div>
          </div>

          <button className="btn-secondary" onClick={fetchReportsData}>
            🔄 Refresh Data
          </button>
        </div>

        <div className="filter-group">
          <label>Date Range:</label>
          <select>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>Last Year</option>
            <option>All Time</option>
          </select>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="stats-overview">
        <div className="stat-item">
          <span className="stat-number">{reports.platformStats.totalUsers}</span>
          <span className="stat-label">Total Users</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{reports.platformStats.totalCompanies}</span>
          <span className="stat-label">Companies</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{reports.platformStats.totalInstitutions}</span>
          <span className="stat-label">Institutions</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">${reports.platformStats.totalRevenue.toLocaleString()}</span>
          <span className="stat-label">Revenue</span>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="report-tabs">
        <button
          className={`tab-button ${selectedReport === "platform" ? "active" : ""}`}
          onClick={() => setSelectedReport("platform")}
        >
          📈 Platform Overview
        </button>
        <button
          className={`tab-button ${selectedReport === "users" ? "active" : ""}`}
          onClick={() => setSelectedReport("users")}
        >
          👥 User Analytics
        </button>
        <button
          className={`tab-button ${selectedReport === "admissions" ? "active" : ""}`}
          onClick={() => setSelectedReport("admissions")}
        >
          🎓 Admissions
        </button>
        <button
          className={`tab-button ${selectedReport === "companies" ? "active" : ""}`}
          onClick={() => setSelectedReport("companies")}
        >
          🏢 Companies
        </button>
      </div>

      {/* Platform Overview */}
      {selectedReport === "platform" && (
        <div className="report-content">
          <div className="stats-grid">
            <ReportCard
              title="Total Users"
              value={reports.platformStats.totalUsers}
              change="+6.3% this month"
              icon="👥"
            />
            <ReportCard
              title="Institutions"
              value={reports.platformStats.totalInstitutions}
              change="+2 this month"
              icon="🏫"
            />
            <ReportCard
              title="Companies"
              value={reports.platformStats.totalCompanies}
              change="+8 this month"
              icon="🏢"
            />
            <ReportCard
              title="Active Admissions"
              value={reports.platformStats.activeAdmissions}
              change="3 new this month"
              icon="📢"
            />
            <ReportCard
              title="Total Revenue"
              value={`$${reports.platformStats.totalRevenue.toLocaleString()}`}
              change="+12.5% growth"
              icon="💰"
            />
            <ReportCard
              title="Success Rate"
              value={`${reports.admissionStats.approvalRate}%`}
              change="+2.1% improvement"
              icon="📊"
            />
          </div>

          <div className="chart-placeholder">
            <div className="chart-header">
              <h3>User Growth Trend</h3>
              <span className="chart-subtitle">Last 6 months performance</span>
            </div>
            <div className="chart">
              {reports.userGrowth.map((data, index) => (
                <div key={data.month} className="chart-bar">
                  <div
                    className="bar-fill"
                    style={{
                      height: `${Math.max(20, (data.users / Math.max(...reports.userGrowth.map(d => d.users))) * 100)}px`
                    }}
                  ></div>
                  <span className="bar-label">{data.month}</span>
                  <span className="bar-value">{data.users.toLocaleString()}</span>
                  <span className="bar-growth">+{data.growth}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rest of your component remains the same... */}
      {/* User Analytics, Admissions Report, Companies Report sections */}
    </div>
  );
};

export default SystemReports;
