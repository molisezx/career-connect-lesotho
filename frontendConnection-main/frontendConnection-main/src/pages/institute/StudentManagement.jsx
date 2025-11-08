import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { getFaculties, initializeInstitutionCollections } from '../../services/institutionServices';
import { uploadDocument } from '../../services/studentServices';
import './InstitutionPages.css';

// CSV Parser utility
const parseCSV = (text) => {
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(header => header.trim());

  return lines.slice(1).map(line => {
    const values = line.split(',').map(value => value.trim());
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  }).filter(row => row[headers[0]]); // Remove empty rows
};

const StudentManagement = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showAcademicReviewModal, setShowAcademicReviewModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [academicStats, setAcademicStats] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    graduated: 0,
    suspended: 0,
    newThisMonth: 0
  });

  // Form states
  const [newStudent, setNewStudent] = useState({
    fullName: '',
    email: '',
    phone: '',
    studentId: '',
    course: '',
    faculty: '',
    facultyId: '',
    year: '1',
    semester: '1',
    status: 'active',
    enrollmentDate: new Date().toISOString().split('T')[0],
    address: '',
    emergencyContact: '',
    gpa: '',
    creditsCompleted: '0',
    attendance: '95'
  });

  const [editStudent, setEditStudent] = useState({});

  useEffect(() => {
    loadStudents();
    loadFaculties();
  }, [user]);

  useEffect(() => {
    calculateStats();
  }, [students]);

  const loadStudents = async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const studentsRef = collection(db, 'students');
      const q = query(
        studentsRef,
        where('institutionId', '==', user.uid),
        orderBy('enrollmentDate', 'desc')
      );
      const studentsSnap = await getDocs(q);

      const studentsData = studentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
      alert('Error loading students: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFaculties = async () => {
    if (!user?.uid) return;

    try {
      console.log('📚 Loading faculties for student management...');
      await initializeInstitutionCollections(user.uid);
      const facultiesData = await getFaculties(user.uid);
      console.log('✅ Loaded faculties for student management:', facultiesData);
      setFaculties(facultiesData || []);
    } catch (error) {
      console.error('❌ Error loading faculties:', error);
    }
  };

  const calculateStats = () => {
    const total = students.length;
    const active = students.filter(s => s.status === 'active').length;
    const graduated = students.filter(s => s.status === 'graduated').length;
    const suspended = students.filter(s => s.status === 'suspended').length;

    const newThisMonth = students.filter(student => {
      const enrollmentDate = student.enrollmentDate?.toDate?.();
      if (!enrollmentDate) return false;
      const now = new Date();
      return enrollmentDate.getMonth() === now.getMonth() &&
             enrollmentDate.getFullYear() === now.getFullYear();
    }).length;

    setStats({ total, active, graduated, suspended, newThisMonth });
  };

  // Academic Review Functions
  const generateAcademicReview = () => {
    if (students.length === 0) {
      setAcademicStats(null);
      return;
    }

    const studentsWithGPA = students.filter(s => s.gpa && s.gpa > 0);
    const averageGPA = studentsWithGPA.length > 0
      ? studentsWithGPA.reduce((sum, student) => sum + student.gpa, 0) / studentsWithGPA.length
      : 0;

    const gpaDistribution = {
      excellent: students.filter(s => s.gpa >= 3.5).length,
      good: students.filter(s => s.gpa >= 3.0 && s.gpa < 3.5).length,
      average: students.filter(s => s.gpa >= 2.0 && s.gpa < 3.0).length,
      needsImprovement: students.filter(s => s.gpa < 2.0 && s.gpa > 0).length,
      noGPA: students.filter(s => !s.gpa || s.gpa === 0).length
    };

    const atRiskStudents = students.filter(student =>
      (student.gpa && student.gpa < 2.0) ||
      (student.attendance && student.attendance < 75)
    );

    const facultyPerformance = faculties.map(faculty => {
      const facultyStudents = students.filter(s => s.faculty === faculty.name);
      const facultyStudentsWithGPA = facultyStudents.filter(s => s.gpa && s.gpa > 0);
      const facultyAvgGPA = facultyStudentsWithGPA.length > 0
        ? facultyStudentsWithGPA.reduce((sum, student) => sum + student.gpa, 0) / facultyStudentsWithGPA.length
        : 0;

      return {
        facultyName: faculty.name,
        studentCount: facultyStudents.length,
        averageGPA: facultyAvgGPA,
        atRiskCount: facultyStudents.filter(s => (s.gpa && s.gpa < 2.0) || (s.attendance && s.attendance < 75)).length
      };
    });

    setAcademicStats({
      totalStudents: students.length,
      averageGPA: parseFloat(averageGPA.toFixed(2)),
      gpaDistribution,
      atRiskStudents: atRiskStudents.length,
      atRiskStudentsList: atRiskStudents.slice(0, 10), // Show top 10 at-risk
      facultyPerformance: facultyPerformance.filter(f => f.studentCount > 0),
      totalWithGPA: studentsWithGPA.length,
      completionRate: students.length > 0 ? parseFloat(((studentsWithGPA.length / students.length) * 100).toFixed(1)) : 0
    });
  };

  const openAcademicReview = () => {
    generateAcademicReview();
    setShowAcademicReviewModal(true);
  };

  // Bulk Import Functions
  const handleBulkImport = async (file) => {
    if (!file) return;

    setUploadingFile(file.name);
    setImportProgress({ current: 0, total: 0 });

    try {
      const text = await readFileAsText(file);
      const studentsData = parseCSV(text);

      if (studentsData.length === 0) {
        throw new Error('No valid student data found in CSV file');
      }

      setImportProgress({ current: 0, total: studentsData.length });

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < studentsData.length; i++) {
        const student = studentsData[i];

        try {
          // Validate required fields
          if (!student.fullName || !student.email || !student.course) {
            console.warn(`Skipping student ${i + 1}: Missing required fields`);
            errorCount++;
            continue;
          }

          const studentId = student.studentId || `STU${Date.now()}${i}`;
          const facultyName = student.facultyId
            ? getFacultyName(student.facultyId)
            : student.faculty;

          const studentData = {
            fullName: student.fullName,
            email: student.email,
            phone: student.phone || '',
            studentId: studentId,
            course: student.course,
            faculty: facultyName || '',
            year: student.year || '1',
            semester: student.semester || '1',
            status: student.status || 'active',
            enrollmentDate: serverTimestamp(),
            address: student.address || '',
            emergencyContact: student.emergencyContact || '',
            gpa: student.gpa ? parseFloat(student.gpa) : null,
            creditsCompleted: parseInt(student.creditsCompleted) || 0,
            attendance: parseInt(student.attendance) || 95,
            institutionId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          const studentsRef = collection(db, 'students');
          await addDoc(studentsRef, studentData);
          successCount++;

        } catch (error) {
          console.error(`Error importing student ${i + 1}:`, error);
          errorCount++;
        }

        setImportProgress({ current: i + 1, total: studentsData.length });

        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setShowBulkImportModal(false);
      alert(`Bulk import completed!\nSuccess: ${successCount}\nErrors: ${errorCount}`);

      // Reload students
      await loadStudents();

    } catch (error) {
      console.error('Error during bulk import:', error);
      alert('Error during bulk import: ' + error.message);
    } finally {
      setUploadingFile(null);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const downloadCSVTemplate = () => {
    const template = [
      ['fullName', 'email', 'phone', 'studentId', 'course', 'faculty', 'year', 'semester', 'status', 'gpa', 'creditsCompleted', 'attendance', 'address', 'emergencyContact'],
      ['John Doe', 'john.doe@student.edu', '+2661234567', 'STU001', 'Computer Science', 'Faculty of Science', '2', '1', 'active', '3.5', '60', '95', '123 Main St', 'Jane Doe +2667654321'],
      ['Jane Smith', 'jane.smith@student.edu', '+2661234568', 'STU002', 'Business Administration', 'Faculty of Business', '1', '2', 'active', '3.2', '30', '88', '456 Oak Ave', 'John Smith +2667654322']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Rest of the existing functions (getStatusColor, getGPAStatus, getFacultyName, viewStudentDetails, etc.)
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#EF4444';
      case 'graduated': return '#3B82F6';
      case 'suspended': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getGPAStatus = (gpa) => {
    if (!gpa) return { label: 'No GPA', color: '#6B7280' };
    if (gpa >= 3.5) return { label: 'Excellent', color: '#10B981' };
    if (gpa >= 3.0) return { label: 'Good', color: '#3B82F6' };
    if (gpa >= 2.0) return { label: 'Average', color: '#F59E0B' };
    return { label: 'Needs Improvement', color: '#EF4444' };
  };

  const getFacultyName = (facultyId) => {
    if (!facultyId) return 'Not assigned';
    const faculty = faculties.find(f => f.id === facultyId);
    return faculty ? faculty.name : 'Unknown Faculty';
  };

  const viewStudentDetails = (student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const openAddStudentModal = () => {
    setNewStudent({
      fullName: '',
      email: '',
      phone: '',
      studentId: '',
      course: '',
      faculty: '',
      facultyId: '',
      year: '1',
      semester: '1',
      status: 'active',
      enrollmentDate: new Date().toISOString().split('T')[0],
      address: '',
      emergencyContact: '',
      gpa: '',
      creditsCompleted: '0',
      attendance: '95'
    });
    setShowAddStudentModal(true);
  };

  const openEditStudentModal = (student) => {
    setEditStudent({
      ...student,
      enrollmentDate: student.enrollmentDate?.toDate?.().toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      facultyId: student.facultyId || ''
    });
    setShowEditStudentModal(true);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      const studentId = newStudent.studentId || `STU${Date.now()}`;
      const facultyName = newStudent.facultyId
        ? getFacultyName(newStudent.facultyId)
        : newStudent.faculty;

      const studentData = {
        ...newStudent,
        studentId,
        faculty: facultyName,
        institutionId: user.uid,
        enrollmentDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        gpa: newStudent.gpa ? parseFloat(newStudent.gpa) : null,
        creditsCompleted: parseInt(newStudent.creditsCompleted) || 0,
        attendance: parseInt(newStudent.attendance) || 95
      };

      delete studentData.facultyId;

      const studentsRef = collection(db, 'students');
      await addDoc(studentsRef, studentData);

      alert('Student added successfully!');
      setShowAddStudentModal(false);
      loadStudents();
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Error adding student: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    if (!editStudent.id) return;

    setIsLoading(true);
    try {
      const facultyName = editStudent.facultyId
        ? getFacultyName(editStudent.facultyId)
        : editStudent.faculty;

      const studentRef = doc(db, 'students', editStudent.id);
      await updateDoc(studentRef, {
        fullName: editStudent.fullName,
        email: editStudent.email,
        phone: editStudent.phone,
        course: editStudent.course,
        faculty: facultyName,
        year: editStudent.year,
        semester: editStudent.semester,
        status: editStudent.status,
        address: editStudent.address,
        emergencyContact: editStudent.emergencyContact,
        gpa: editStudent.gpa ? parseFloat(editStudent.gpa) : null,
        creditsCompleted: parseInt(editStudent.creditsCompleted) || 0,
        attendance: parseInt(editStudent.attendance) || 95,
        updatedAt: serverTimestamp()
      });

      alert('Student updated successfully!');
      setShowEditStudentModal(false);
      loadStudents();
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Error updating student: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    try {
      const studentRef = doc(db, 'students', studentId);
      await deleteDoc(studentRef);

      alert('Student deleted successfully!');
      loadStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Error deleting student: ' + error.message);
    }
  };

  const handleFileUpload = async (file, studentId) => {
    if (!file || !studentId) return;

    setUploadingFile(file.name);
    try {
      const result = await uploadDocument(studentId, file, 'student_document');
      if (result.success) {
        alert('File uploaded successfully!');
      } else {
        alert('Error uploading file: ' + result.error);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file: ' + error.message);
    } finally {
      setUploadingFile(null);
    }
  };

  const exportStudentData = () => {
    try {
      const csvContent = [
        ['Name', 'Student ID', 'Email', 'Course', 'Faculty', 'Status', 'GPA', 'Enrollment Date'],
        ...filteredStudents.map(student => [
          student.fullName,
          student.studentId,
          student.email,
          student.course,
          student.faculty || 'N/A',
          student.status,
          student.gpa || 'N/A',
          student.enrollmentDate?.toDate?.().toLocaleDateString() || 'N/A'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      alert('Student data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data: ' + error.message);
    }
  };

  const generateReport = () => {
    try {
      const reportData = {
        generatedAt: new Date().toISOString(),
        totalStudents: stats.total,
        activeStudents: stats.active,
        graduatedStudents: stats.graduated,
        suspendedStudents: stats.suspended,
        newStudentsThisMonth: stats.newThisMonth,
        students: filteredStudents.map(student => ({
          name: student.fullName,
          id: student.studentId,
          email: student.email,
          course: student.course,
          faculty: student.faculty,
          status: student.status,
          gpa: student.gpa,
          enrollmentDate: student.enrollmentDate?.toDate?.().toISOString()
        }))
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student_report_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      alert('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report: ' + error.message);
    }
  };

  const sendMessageToStudent = async (studentEmail, message) => {
    try {
      alert(`Message would be sent to ${studentEmail}: ${message}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message: ' + error.message);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.faculty?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filter === 'all' || student.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="institution-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Student Management</h1>
          <p className="page-subtitle">
            Manage student records, track academic progress, and monitor enrollment statistics
          </p>
        </div>
      </div>

      <div className="page-content">
        {/* Statistics Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">👨‍🎓</div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Students</p>
              <span className="stat-change">+{stats.newThisMonth} this month</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.active}</h3>
              <p>Active Students</p>
              <span className="stat-change">{Math.round((stats.active / stats.total) * 100) || 0}% of total</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎓</div>
            <div className="stat-content">
              <h3>{stats.graduated}</h3>
              <p>Graduated</p>
              <span className="stat-change">Alumni network</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>
                {students.length > 0
                  ? (students.reduce((sum, student) => sum + (student.gpa || 0), 0) / students.filter(s => s.gpa).length).toFixed(1)
                  : '0.0'
                }
              </h3>
              <p>Average GPA</p>
              <span className="stat-change">Academic performance</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="card">
          <div className="card-header">
            <div className="header-actions">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search students by name, ID, email, course, or faculty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ width: '400px' }}
                />
              </div>
              <div className="filter-controls">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="form-select"
                  style={{ width: '180px' }}
                >
                  <option value="all">All Students</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                  <option value="suspended">Suspended</option>
                </select>
                <button className="btn-outline" onClick={generateReport}>
                  <span>📋</span> Generate Report
                </button>
                <button className="btn-primary" onClick={exportStudentData}>
                  <span>📥</span> Export Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid-3">
          <div className="card quick-action-card" onClick={openAddStudentModal} style={{ cursor: 'pointer' }}>
            <div className="action-icon">➕</div>
            <div className="action-content">
              <h4>Add New Student</h4>
              <p>Manually register a new student</p>
            </div>
          </div>
          <div className="card quick-action-card" onClick={() => setShowBulkImportModal(true)} style={{ cursor: 'pointer' }}>
            <div className="action-icon">📝</div>
            <div className="action-content">
              <h4>Bulk Import</h4>
              <p>Upload multiple students via CSV</p>
            </div>
          </div>
          <div className="card quick-action-card" onClick={openAcademicReview} style={{ cursor: 'pointer' }}>
            <div className="action-icon">🎯</div>
            <div className="action-content">
              <h4>Academic Review</h4>
              <p>Review student performance</p>
            </div>
          </div>
        </div>

        {/* Students Table - Keep existing table code */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Student Directory</h2>
            <span className="text-muted">{filteredStudents.length} students found</span>
          </div>

          {isLoading ? (
            <div className="loading-spinner"></div>
          ) : filteredStudents.length > 0 ? (
            <div className="table-container">
              <table className="table students-table-enhanced">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Student ID</th>
                    <th>Program & Faculty</th>
                    <th>Enrollment Date</th>
                    <th>GPA</th>
                    <th>Status</th>
                    <th>Contact</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const gpaStatus = getGPAStatus(student.gpa);
                    return (
                      <tr key={student.id} className="student-row">
                        <td>
                          <div className="student-info-enhanced">
                            <div
                              className="student-avatar"
                              style={{ backgroundColor: getStatusColor(student.status) }}
                            >
                              {student.fullName?.charAt(0) || 'S'}
                            </div>
                            <div className="student-details">
                              <strong>{student.fullName || 'Unknown Student'}</strong>
                              <span>{student.email || 'No email'}</span>
                              <div className="student-meta">
                                <span className="meta-tag">{student.year || 'Year 1'}</span>
                                <span className="meta-tag">{student.semester || 'Semester 1'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <code className="student-id">{student.studentId || 'N/A'}</code>
                        </td>
                        <td>
                          <div className="program-info">
                            <strong>{student.course || 'Not Assigned'}</strong>
                            {student.faculty && <span className="faculty-badge">{student.faculty}</span>}
                          </div>
                        </td>
                        <td>
                          {student.enrollmentDate?.toDate?.().toLocaleDateString() || 'N/A'}
                        </td>
                        <td>
                          {student.gpa ? (
                            <div className="gpa-display">
                              <span className="gpa-value">{student.gpa}</span>
                              <span
                                className="gpa-badge"
                                style={{ backgroundColor: gpaStatus.color }}
                              >
                                {gpaStatus.label}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                        <td>
                          <span
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(student.status) }}
                          >
                            {student.status?.toUpperCase() || 'ACTIVE'}
                          </span>
                        </td>
                        <td>
                          <div className="contact-info-enhanced">
                            <div className="contact-item">
                              <span className="contact-icon">📧</span>
                              <span>{student.email || 'N/A'}</span>
                            </div>
                            <div className="contact-item">
                              <span className="contact-icon">📱</span>
                              <span>{student.phone || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons-enhanced">
                            <button
                              className="btn-action view"
                              onClick={() => viewStudentDetails(student)}
                            >
                              View
                            </button>
                            <button
                              className="btn-action edit"
                              onClick={() => openEditStudentModal(student)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-action delete"
                              onClick={() => handleDeleteStudent(student.id)}
                              style={{ backgroundColor: '#EF4444' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">👨‍🎓</div>
              <h3>No Students Found</h3>
              <p>No students match your search criteria. Try adjusting your filters.</p>
              <button
                className="btn-primary"
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Add Student Modal - Keep existing modal code */}
        {showAddStudentModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              {/* ... existing add student modal content ... */}
            </div>
          </div>
        )}

        {/* Edit Student Modal - Keep existing modal code */}
        {showEditStudentModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              {/* ... existing edit student modal content ... */}
            </div>
          </div>
        )}

        {/* Bulk Import Modal - UPDATED */}
        {showBulkImportModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Bulk Import Students</h2>
                <button
                  className="close-btn"
                  onClick={() => setShowBulkImportModal(false)}
                  disabled={uploadingFile}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="upload-area">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) handleBulkImport(file);
                    }}
                    style={{ display: 'none' }}
                    id="bulk-upload"
                    disabled={uploadingFile}
                  />
                  <label htmlFor="bulk-upload" className="upload-label">
                    <div className="upload-icon">📁</div>
                    <h3>Upload CSV File</h3>
                    <p>Select a CSV file with student data to import</p>
                    <button className="btn-outline" disabled={uploadingFile}>
                      {uploadingFile ? 'Uploading...' : 'Choose File'}
                    </button>
                  </label>
                </div>

                {uploadingFile && (
                  <div className="upload-progress">
                    <p>Importing {uploadingFile}...</p>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    <p>{importProgress.current} of {importProgress.total} students processed</p>
                  </div>
                )}

                <div className="import-instructions">
                  <h4>CSV Format Requirements:</h4>
                  <ul>
                    <li>Required fields: <strong>fullName, email, course</strong></li>
                    <li>Optional fields: phone, studentId, faculty, year, semester, status, gpa, creditsCompleted, attendance, address, emergencyContact</li>
                    <li>First row must be headers</li>
                    <li>File must be UTF-8 encoded</li>
                  </ul>
                </div>

                <div className="modal-actions">
                  <button
                    className="btn-outline"
                    onClick={() => setShowBulkImportModal(false)}
                    disabled={uploadingFile}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={downloadCSVTemplate}
                    disabled={uploadingFile}
                  >
                    Download Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Academic Review Modal - NEW */}
        {showAcademicReviewModal && (
          <div className="modal-overlay">
            <div className="modal-content large">
              <div className="modal-header">
                <h2>Academic Performance Review</h2>
                <button
                  className="close-btn"
                  onClick={() => setShowAcademicReviewModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                {!academicStats ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <h3>No Data Available</h3>
                    <p>No student data found for academic review.</p>
                  </div>
                ) : (
                  <div className="academic-review">
                    {/* Overall Statistics */}
                    <div className="review-section">
                      <h3>Overall Statistics</h3>
                      <div className="stats-grid">
                        <div className="stat-item">
                          <span className="stat-value">{academicStats.totalStudents}</span>
                          <span className="stat-label">Total Students</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-value">{academicStats.averageGPA}</span>
                          <span className="stat-label">Average GPA</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-value">{academicStats.atRiskStudents}</span>
                          <span className="stat-label">At-Risk Students</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-value">{academicStats.completionRate}%</span>
                          <span className="stat-label">GPA Completion</span>
                        </div>
                      </div>
                    </div>

                    {/* GPA Distribution */}
                    <div className="review-section">
                      <h3>GPA Distribution</h3>
                      <div className="distribution-grid">
                        <div className="distribution-item excellent">
                          <span className="distribution-count">{academicStats.gpaDistribution.excellent}</span>
                          <span className="distribution-label">Excellent (3.5+)</span>
                        </div>
                        <div className="distribution-item good">
                          <span className="distribution-count">{academicStats.gpaDistribution.good}</span>
                          <span className="distribution-label">Good (3.0-3.49)</span>
                        </div>
                        <div className="distribution-item average">
                          <span className="distribution-count">{academicStats.gpaDistribution.average}</span>
                          <span className="distribution-label">Average (2.0-2.99)</span>
                        </div>
                        <div className="distribution-item needs-improvement">
                          <span className="distribution-count">{academicStats.gpaDistribution.needsImprovement}</span>
                          <span className="distribution-label">Needs Improvement</span>
                        </div>
                        <div className="distribution-item no-gpa">
                          <span className="distribution-count">{academicStats.gpaDistribution.noGPA}</span>
                          <span className="distribution-label">No GPA Recorded</span>
                        </div>
                      </div>
                    </div>

                    {/* Faculty Performance */}
                    {academicStats.facultyPerformance.length > 0 && (
                      <div className="review-section">
                        <h3>Faculty Performance</h3>
                        <div className="faculty-performance">
                          {academicStats.facultyPerformance.map((faculty, index) => (
                            <div key={index} className="faculty-performance-item">
                              <div className="faculty-info">
                                <strong>{faculty.facultyName}</strong>
                                <span>{faculty.studentCount} students</span>
                              </div>
                              <div className="faculty-stats">
                                <span>Avg GPA: {faculty.averageGPA.toFixed(2)}</span>
                                <span>At Risk: {faculty.atRiskCount}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* At-Risk Students */}
                    {academicStats.atRiskStudents > 0 && (
                      <div className="review-section">
                        <h3>At-Risk Students (Top 10)</h3>
                        <div className="at-risk-students">
                          {academicStats.atRiskStudentsList.map((student, index) => (
                            <div key={index} className="at-risk-student">
                              <div className="student-info">
                                <strong>{student.fullName}</strong>
                                <span>{student.studentId} - {student.course}</span>
                              </div>
                              <div className="risk-factors">
                                {student.gpa && student.gpa < 2.0 && (
                                  <span className="risk-factor">Low GPA: {student.gpa}</span>
                                )}
                                {student.attendance && student.attendance < 75 && (
                                  <span className="risk-factor">Low Attendance: {student.attendance}%</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Student Detail Modal - Keep existing modal code */}
        {showStudentModal && selectedStudent && (
          <div className="modal-overlay">
            <div className="modal-content large">
              {/* ... existing student detail modal content ... */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentManagement;
