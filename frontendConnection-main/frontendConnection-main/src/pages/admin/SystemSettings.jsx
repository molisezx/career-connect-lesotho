import { useEffect, useState } from "react";
import { AdminServices } from "../../services/adminService";
import "./ManagementPages.css";

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    // General Settings
    siteName: "CareerConnect Platform",
    siteDescription: "Connecting students with opportunities",
    adminEmail: "admin@careerconnect.com",
    supportEmail: "support@careerconnect.com",

    // Admission Settings
    autoApproveCompanies: false,
    requireCompanyVerification: true,
    maxAdmissionDuration: 180,

    // Notification Settings
    emailNotifications: true,
    systemAlerts: true,
    weeklyReports: true,

    // Security Settings
    requireStrongPasswords: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5
  });

  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load settings from Firebase on component mount
  useEffect(() => {
    loadSettings();

    // Set up real-time listener for settings changes
    const unsubscribe = AdminServices.settings.subscribeToSettings((updatedSettings) => {
      console.log("📡 Real-time settings update received:", updatedSettings);
      setSettings(prev => ({ ...prev, ...updatedSettings }));
    });

    return () => unsubscribe();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      console.log("🔄 Loading settings from Firebase...");

      const savedSettings = await AdminServices.settings.getSettings();
      console.log("✅ Settings loaded:", savedSettings);

      setSettings(prev => ({ ...prev, ...savedSettings }));
    } catch (error) {
      console.error("❌ Error loading settings:", error);
      setMessage({
        type: 'error',
        text: `Failed to load settings: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    try {
      setSaveLoading(true);
      setMessage({ type: '', text: '' });
      console.log("💾 Saving settings to Firebase:", settings);

      const result = await AdminServices.settings.updateSettings(settings, "admin");
      console.log("✅ Settings saved successfully:", result);

      setMessage({
        type: 'success',
        text: 'Settings saved successfully!'
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error("❌ Error saving settings:", error);
      setMessage({
        type: 'error',
        text: `Failed to save settings: ${error.message}`
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const resetSettings = async () => {
    if (window.confirm("Are you sure you want to reset all settings to default? This cannot be undone.")) {
      try {
        setSaveLoading(true);
        setMessage({ type: '', text: '' });
        console.log("🔄 Resetting settings to defaults...");

        const result = await AdminServices.settings.resetSettings("admin");
        console.log("✅ Settings reset successfully:", result);

        // Update local state with reset settings
        setSettings(prev => ({ ...prev, ...result.data }));

        setMessage({
          type: 'success',
          text: 'Settings reset to default values!'
        });

        // Clear success message after 3 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } catch (error) {
        console.error("❌ Error resetting settings:", error);
        setMessage({
          type: 'error',
          text: `Failed to reset settings: ${error.message}`
        });
      } finally {
        setSaveLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="management-page loading">
        <div className="loading-spinner"></div>
        <p>Loading system settings...</p>
      </div>
    );
  }

  return (
    <div className="management-page">
      <div className="page-header">
        <h1>System Settings</h1>
        <p>Configure platform settings and preferences</p>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`message-banner ${message.type}`}>
          <span>{message.text}</span>
          <button
            className="close-message"
            onClick={() => setMessage({ type: '', text: '' })}
          >
            ×
          </button>
        </div>
      )}

      <div className="settings-container">
        <div className="settings-sidebar">
          <button
            className={`sidebar-tab ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            ⚙️ General
          </button>
          <button
            className={`sidebar-tab ${activeTab === "admissions" ? "active" : ""}`}
            onClick={() => setActiveTab("admissions")}
          >
            📢 Admissions
          </button>
          <button
            className={`sidebar-tab ${activeTab === "companies" ? "active" : ""}`}
            onClick={() => setActiveTab("companies")}
          >
            🏢 Companies
          </button>
          <button
            className={`sidebar-tab ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            🔔 Notifications
          </button>
          <button
            className={`sidebar-tab ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            🔒 Security
          </button>
        </div>

        <div className="settings-content">
          {/* General Settings */}
          {activeTab === "general" && (
            <div className="settings-section">
              <h3>General Settings</h3>
              <div className="setting-group">
                <label>Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleSettingChange("siteName", e.target.value)}
                />
              </div>
              <div className="setting-group">
                <label>Site Description</label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => handleSettingChange("siteDescription", e.target.value)}
                  rows="3"
                />
              </div>
              <div className="setting-group">
                <label>Admin Email</label>
                <input
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => handleSettingChange("adminEmail", e.target.value)}
                />
              </div>
              <div className="setting-group">
                <label>Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => handleSettingChange("supportEmail", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Admission Settings */}
          {activeTab === "admissions" && (
            <div className="settings-section">
              <h3>Admission Settings</h3>
              <div className="setting-group">
                <label>Maximum Admission Duration (days)</label>
                <input
                  type="number"
                  value={settings.maxAdmissionDuration}
                  onChange={(e) => handleSettingChange("maxAdmissionDuration", parseInt(e.target.value))}
                  min="1"
                  max="365"
                />
              </div>
              <div className="setting-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.requireCompanyVerification}
                    onChange={(e) => handleSettingChange("requireCompanyVerification", e.target.checked)}
                  />
                  Require company verification
                </label>
              </div>
            </div>
          )}

          {/* Company Settings */}
          {activeTab === "companies" && (
            <div className="settings-section">
              <h3>Company Settings</h3>
              <div className="setting-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.autoApproveCompanies}
                    onChange={(e) => handleSettingChange("autoApproveCompanies", e.target.checked)}
                  />
                  Auto-approve company registrations
                </label>
              </div>
              <div className="setting-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.requireCompanyVerification}
                    onChange={(e) => handleSettingChange("requireCompanyVerification", e.target.checked)}
                  />
                  Require company document verification
                </label>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <div className="settings-section">
              <h3>Notification Settings</h3>
              <div className="setting-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange("emailNotifications", e.target.checked)}
                  />
                  Enable email notifications
                </label>
              </div>
              <div className="setting-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.systemAlerts}
                    onChange={(e) => handleSettingChange("systemAlerts", e.target.checked)}
                  />
                  Enable system alerts
                </label>
              </div>
              <div className="setting-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.weeklyReports}
                    onChange={(e) => handleSettingChange("weeklyReports", e.target.checked)}
                  />
                  Send weekly reports
                </label>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className="settings-section">
              <h3>Security Settings</h3>
              <div className="setting-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.requireStrongPasswords}
                    onChange={(e) => handleSettingChange("requireStrongPasswords", e.target.checked)}
                  />
                  Require strong passwords
                </label>
              </div>
              <div className="setting-group">
                <label>Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange("sessionTimeout", parseInt(e.target.value))}
                  min="5"
                  max="480"
                />
              </div>
              <div className="setting-group">
                <label>Maximum Login Attempts</label>
                <input
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => handleSettingChange("maxLoginAttempts", parseInt(e.target.value))}
                  min="1"
                  max="10"
                />
              </div>
            </div>
          )}

          {/* Save Buttons */}
          <div className="settings-actions">
            <button
              className="btn-secondary"
              onClick={resetSettings}
              disabled={saveLoading}
            >
              {saveLoading ? "Processing..." : "Reset to Default"}
            </button>
            <button
              className="btn-primary"
              onClick={saveSettings}
              disabled={saveLoading}
            >
              {saveLoading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
