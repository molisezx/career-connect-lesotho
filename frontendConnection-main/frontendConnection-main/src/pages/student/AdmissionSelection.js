import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentAdmissions, selectInstitution } from '../../services/studentServices';
import './Student.css';

const AdmissionSelection = () => {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedAdmission, setSelectedAdmission] = useState('');

  useEffect(() => {
    if (user?.uid) {
      loadAdmissions();
    }
  }, [user]);

  const loadAdmissions = async () => {
    try {
      setIsLoading(true);
      const result = await getStudentAdmissions(user.uid);

      if (result.success) {
        setAdmissions(result.data);
        const selected = result.data.find(admission => admission.selected);
        if (selected) {
          setSelectedAdmission(selected.applicationId);
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load admissions' });
      }
    } catch (error) {
      console.error('Error loading admissions:', error);
      setMessage({ type: 'error', text: 'Failed to load admissions' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelection = async (e) => {
    e.preventDefault();

    if (!selectedAdmission) {
      setMessage({ type: 'error', text: 'Please select an institution' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await selectInstitution(user.uid, selectedAdmission);

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Institution selected successfully!'
        });
        await loadAdmissions(); // Reload to show updated status
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to select institution'
        });
      }
    } catch (error) {
      console.error('Error selecting institution:', error);
      setMessage({
        type: 'error',
        text: 'An error occurred while selecting institution'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admission-selection loading">
        <div className="loading-spinner"></div>
        <p>Loading your admissions...</p>
      </div>
    );
  }

  const hasSelection = admissions.some(admission => admission.selected);

  return (
    <div className="admission-selection">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Select Your Institution</h1>
            <p>
              {hasSelection
                ? 'You have already made your selection'
                : 'Choose one institution from your approved applications'
              }
            </p>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {admissions.length === 0 ? (
        <div className="no-admissions">
          <div className="empty-state">
            <div className="empty-icon">🎓</div>
            <h3>No Admissions Yet</h3>
            <p>You haven't been admitted to any institutions yet. Check back later for updates.</p>
          </div>
        </div>
      ) : hasSelection ? (
        <div className="selection-made">
          <div className="success-card">
            <div className="success-icon">✅</div>
            <div className="success-content">
              <h3>Selection Confirmed!</h3>
              <p>You have successfully selected your institution.</p>

              {admissions.map(admission => (
                admission.selected && (
                  <div key={admission.applicationId} className="selected-institution">
                    <h4>{admission.institutionName}</h4>
                    <p><strong>Course:</strong> {admission.courseName}</p>
                    <p><strong>Selected on:</strong> {new Date().toLocaleDateString()}</p>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="selection-form-container">
          <div className="info-banner">
            <div className="banner-icon">ℹ️</div>
            <div className="banner-content">
              <h4>Important Information</h4>
              <p>
                You have been admitted to multiple institutions. Please select one institution to confirm your enrollment.
                This action cannot be undone.
              </p>
            </div>
          </div>

          <form onSubmit={handleSelection} className="selection-form">
            <div className="form-section">
              <h3>Your Admissions</h3>
              <p className="section-description">
                Select one institution where you would like to enroll:
              </p>

              <div className="admissions-list">
                {admissions.map((admission) => (
                  <div key={admission.applicationId} className="admission-option">
                    <label className="admission-card">
                      <input
                        type="radio"
                        name="institution"
                        value={admission.applicationId}
                        checked={selectedAdmission === admission.applicationId}
                        onChange={(e) => setSelectedAdmission(e.target.value)}
                        className="admission-radio"
                      />
                      <div className="admission-content">
                        <div className="admission-header">
                          <h4>{admission.institutionName}</h4>
                          <span className="admission-badge">Admitted</span>
                        </div>
                        <div className="admission-details">
                          <p><strong>Course:</strong> {admission.courseName}</p>
                          <p><strong>Applied:</strong> {admission.appliedAt?.toLocaleDateString() || 'N/A'}</p>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary large"
                disabled={isSubmitting || !selectedAdmission}
              >
                {isSubmitting ? 'Processing...' : 'Confirm Selection'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdmissionSelection;
