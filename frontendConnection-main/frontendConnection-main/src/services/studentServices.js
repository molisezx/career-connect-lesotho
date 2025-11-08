/* eslint-disable import/no-anonymous-default-export */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { db, storage } from "../config/firebase";
import { storageService } from './storageService';

const COLLECTIONS = {
  STUDENTS: "students",
  COURSES: "courses",
  INSTITUTIONS: "institutions",
  APPLICATIONS: "applications",
  JOBS: "jobs",
  JOB_APPLICATIONS: "job_applications",
  DOCUMENTS: "documents",
  NOTIFICATIONS: "notifications",
  COMPANIES: "companies",
};

const QUALIFICATION_REQUIREMENTS = {
  undergraduate: {
    minEducation: "high_school",
    requiredSubjects: [],
    minGrade: "C",
  },
  postgraduate: {
    minEducation: "bachelors",
    requiredSubjects: [],
    minGrade: "B",
  },
  diploma: {
    minEducation: "high_school",
    requiredSubjects: [],
    minGrade: "D",
  },
  certificate: {
    minEducation: "high_school",
    requiredSubjects: [],
    minGrade: "E",
  },
};

const EDUCATION_HIERARCHY = {
  high_school: 1,
  certificate: 2,
  diploma: 3,
  bachelors: 4,
  masters: 5,
  phd: 6,
};

const GRADE_HIERARCHY = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  F: 0,
};

class FirestoreIndexManager {
  static INDEXES = {
    NOTIFICATIONS: {
      userId_createdAt: {
        collection: "notifications",
        fields: [
          { fieldPath: "userId", order: "ASC" },
          { fieldPath: "createdAt", order: "DESC" },
        ],
        queryScope: "COLLECTION",
        url: "https://console.firebase.google.com/v1/r/project/career-connect-lesotho/firestore/indexes?create_composite=Clxwcm9qZWN0cy9jYXJlZXItY29ubmVjdC1sZXNvdGhvL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9ub3RpZmljYXRpb25zL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI",
      },
    },
    APPLICATIONS: {
      studentId_appliedAt: {
        collection: "applications",
        fields: [
          { fieldPath: "studentId", order: "ASC" },
          { fieldPath: "appliedAt", order: "DESC" },
        ],
        queryScope: "COLLECTION",
        url: "https://console.firebase.google.com/v1/r/project/career-connect-lesotho/firestore/indexes?create_composite=Clxwcm9qZWN0cy9jYXJlZXItY29ubmVjdC1sZXNvdGhvL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9hcHBsaWNhdGlvbnMvaW5kZXhlcy9fEAEaCgoGc3RhdHVzEAEaCgoGc3RhdHVzEAEaDQoJYXBwbGllZEF0EAIaDAoIX19uYW1lX18QAg",
      },
    },
  };

  static async createIndex(indexUrl, isBuilding = false) {
    if (isBuilding) {
      console.log("⏳ Index is currently building. This may take a few minutes...");
      return;
    }
    console.log("📋 Firestore index required. Please create it manually:");
    console.log("🔗", indexUrl);
  }

  static getIndexLinkByError(error) {
    if (!error.message) return null;
    const urlMatch = error.message.toString().match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
    return urlMatch ? urlMatch[0] : null;
  }

  static showAllIndexLinks() {
    console.log("📋 Required Firestore Indexes:");
    Object.entries(this.INDEXES).forEach(([collection, indexes]) => {
      console.log(`📁 ${collection.toUpperCase()}:`);
      Object.entries(indexes).forEach(([indexName, index]) => {
        console.log(`   🔗 ${indexName}: ${index.url}`);
      });
    });
  }
}

// ==================== HELPER FUNCTIONS ====================

const safeDateConvert = (firebaseDate) => {
  if (!firebaseDate) return null;
  if (firebaseDate.toDate && typeof firebaseDate.toDate === "function") {
    return firebaseDate.toDate();
  }
  if (firebaseDate instanceof Date) {
    return firebaseDate;
  }
  if (typeof firebaseDate === "string") {
    return new Date(firebaseDate);
  }
  return null;
};

const calculateProfileCompletion = (profile) => {
  if (!profile) return 0;
  let completion = 0;
  const fields = ["fullName", "email", "phone", "address", "dateOfBirth"];

  fields.forEach((field) => {
    if (profile[field]) completion += 10;
  });

  if (profile.qualifications) {
    const quals = profile.qualifications;
    if (quals.educationLevel && quals.educationLevel !== "Not specified") completion += 15;
    if (quals.overallGrade && quals.overallGrade !== "Not specified") completion += 15;
  }

  if (profile.jobPreferences) {
    const prefs = profile.jobPreferences;
    if (prefs.industries && prefs.industries.length > 0) completion += 10;
    if (prefs.jobTypes && prefs.jobTypes.length > 0) completion += 10;
  }

  if (profile.resumeUrl) completion += 10;

  return Math.min(100, completion);
};

const checkSpecificRequirements = (student, requirements) => {
  if (!student || !requirements) {
    return { eligible: false, reason: "Invalid student or requirements data" };
  }

  const studentQuals = student.qualifications || {};

  if (requirements.minEducation) {
    const studentLevel = EDUCATION_HIERARCHY[studentQuals.educationLevel] || 0;
    const requiredLevel = EDUCATION_HIERARCHY[requirements.minEducation] || 0;
    if (studentLevel < requiredLevel) {
      return {
        eligible: false,
        reason: `Minimum education requirement: ${requirements.minEducation.toUpperCase()}`,
      };
    }
  }

  if (requirements.minGrade && studentQuals.overallGrade) {
    const studentGrade = GRADE_HIERARCHY[studentQuals.overallGrade] || 0;
    const requiredGrade = GRADE_HIERARCHY[requirements.minGrade] || 0;
    if (studentGrade < requiredGrade) {
      return {
        eligible: false,
        reason: `Minimum grade requirement: ${requirements.minGrade.toUpperCase()}`,
      };
    }
  }

  return { eligible: true, reason: "Meets all requirements" };
};

const checkGeneralRequirements = (student, course) => {
  if (!student || !course) {
    return { eligible: false, reason: "Invalid student or course data" };
  }

  const studentQuals = student.qualifications || {};
  const courseLevel = course.level || "undergraduate";
  const requirements = QUALIFICATION_REQUIREMENTS[courseLevel] || QUALIFICATION_REQUIREMENTS.undergraduate;

  const studentLevel = EDUCATION_HIERARCHY[studentQuals.educationLevel] || 0;
  const requiredLevel = EDUCATION_HIERARCHY[requirements.minEducation] || 0;

  if (studentLevel < requiredLevel) {
    return {
      eligible: false,
      reason: `Minimum education requirement for ${courseLevel} programs: ${requirements.minEducation.toUpperCase()}`,
    };
  }

  if (studentQuals.overallGrade) {
    const studentGrade = GRADE_HIERARCHY[studentQuals.overallGrade] || 0;
    const requiredGrade = GRADE_HIERARCHY[requirements.minGrade] || 0;
    if (studentGrade < requiredGrade) {
      return {
        eligible: false,
        reason: `Minimum grade requirement: ${requirements.minGrade.toUpperCase()}`,
      };
    }
  }

  return { eligible: true, reason: "Meets all requirements" };
};

const checkJobQualification = async (student, job) => {
  if (!student || !job) return false;
  const studentQuals = student.qualifications || {};

  if (job.requirements?.minEducation) {
    const studentLevel = EDUCATION_HIERARCHY[studentQuals.educationLevel] || 0;
    const requiredLevel = EDUCATION_HIERARCHY[job.requirements.minEducation] || 0;
    if (studentLevel < requiredLevel) return false;
  }

  if (job.requirements?.minGrade && studentQuals.overallGrade) {
    const studentGrade = GRADE_HIERARCHY[studentQuals.overallGrade] || 0;
    const requiredGrade = GRADE_HIERARCHY[job.requirements.minGrade] || 0;
    if (studentGrade < requiredGrade) return false;
  }

  if (job.requirements?.skills && job.requirements.skills.length > 0) {
    const studentSkills = student.skills || [];
    const hasRequiredSkills = job.requirements.skills.every((skill) =>
      studentSkills.includes(skill)
    );
    if (!hasRequiredSkills) return false;
  }

  if (job.requirements?.minExperience && student.experience) {
    if (student.experience < job.requirements.minExperience) return false;
  }

  return true;
};

const checkJobPreferences = (student, job) => {
  if (!student || !job) return false;
  const preferences = student.jobPreferences || {};

  if (preferences.industries && preferences.industries.length > 0) {
    if (!preferences.industries.includes(job.industry)) return false;
  }

  if (preferences.jobTypes && preferences.jobTypes.length > 0) {
    if (!preferences.jobTypes.includes(job.jobType)) return false;
  }

  if (preferences.locations && preferences.locations.length > 0) {
    if (!preferences.locations.includes(job.location)) return false;
  }

  if (preferences.minSalary && job.salary) {
    if (job.salary < preferences.minSalary) return false;
  }

  return true;
};

const calculateMatchScore = (job) => {
  if (!job) return 0;
  let score = 0;
  if (job.requirements?.minEducation) score += 25;
  if (job.requirements?.minGrade) score += 25;
  if (job.requirements?.skills) score += 25;
  if (job.requirements?.minExperience) score += 25;
  return score;
};

const getActiveJobs = async () => {
  try {
    const jobsRef = collection(db, COLLECTIONS.JOBS);
    const jobsQuery = query(
      jobsRef,
      where("status", "==", "active"),
      where("deadline", ">=", new Date())
    );
    const jobsSnap = await getDocs(jobsQuery);
    const jobs = jobsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return { success: true, data: jobs };
  } catch (error) {
    console.error("Error getting active jobs:", error);
    return { success: false, error: error.message };
  }
};

const createJobMatchNotifications = async (studentId, matchedJobs) => {
  try {
    if (!studentId || !matchedJobs || !matchedJobs.length) return;

    const existingNotifications = await getDocs(
      query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where("userId", "==", studentId),
        where("type", "==", "job_match")
      )
    );

    const existingJobIds = new Set();
    existingNotifications.docs.forEach((doc) => {
      const data = doc.data();
      if (data.jobId) existingJobIds.add(data.jobId);
    });

    for (const job of matchedJobs) {
      if (!existingJobIds.has(job.id)) {
        await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
          userId: studentId,
          type: "job_match",
          title: "New Job Match!",
          message: `You're qualified for: ${job.title} at ${job.companyName}`,
          jobId: job.id,
          companyId: job.companyId,
          read: false,
          createdAt: serverTimestamp(),
          metadata: {
            jobTitle: job.title,
            companyName: job.companyName,
            matchScore: calculateMatchScore(job),
          },
        });
      }
    }
  } catch (error) {
    console.error("Error creating job match notifications:", error);
  }
};

const executeQueryWithFallback = async (primaryQuery, fallbackQuery = null, errorContext = "query") => {
  try {
    const snapshot = await getDocs(primaryQuery);
    return { success: true, data: snapshot };
  } catch (error) {
    console.warn(`⚠️ Primary ${errorContext} failed:`, error.message);

    if (error.code === "failed-precondition") {
      const indexUrl = FirestoreIndexManager.getIndexLinkByError(error);
      await FirestoreIndexManager.createIndex(indexUrl, false);
    }

    if (fallbackQuery) {
      try {
        console.log(`🔄 Trying fallback ${errorContext}...`);
        const fallbackSnapshot = await getDocs(fallbackQuery);
        return { success: true, data: fallbackSnapshot };
      } catch (fallbackError) {
        console.error(`❌ Fallback ${errorContext} also failed:`, fallbackError.message);
        return { success: false, error: fallbackError.message };
      }
    }

    return { success: false, error: error.message };
  }
};

// ==================== PROFILE OPERATIONS ====================

export const initializeStudentProfile = async (userId, userData = {}) => {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const studentRef = doc(db, COLLECTIONS.STUDENTS, userId);
    const studentSnap = await getDoc(studentRef);

    if (!studentSnap.exists()) {
      await setDoc(studentRef, {
        email: userData.email || "",
        fullName: userData.fullName || "",
        userType: "student",
        profileCompletion: 0,
        qualifications: {
          educationLevel: "",
          overallGrade: "",
          subjects: [],
          certificates: [],
        },
        jobPreferences: {
          industries: [],
          jobTypes: [],
          locations: [],
          minSalary: null,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("✅ Student profile initialized for:", userId);
    }
    return { success: true };
  } catch (error) {
    console.error("❌ Error initializing student profile:", error);
    return { success: false, error: error.message };
  }
};

export const getStudentProfile = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const studentRef = doc(db, COLLECTIONS.STUDENTS, userId);
    const studentSnap = await getDoc(studentRef);

    if (studentSnap.exists()) {
      const data = studentSnap.data();

      if (data.qualifications && typeof data.qualifications === "object") {
        const quals = data.qualifications;
        if (quals.educationLevel && typeof quals.educationLevel === "object") {
          quals.educationLevel = quals.educationLevel.description || "Not specified";
        } else if (!quals.educationLevel) {
          quals.educationLevel = "Not specified";
        }

        if (quals.overallGrade && typeof quals.overallGrade === "object") {
          quals.overallGrade = quals.overallGrade.grade || "Not specified";
        } else if (!quals.overallGrade) {
          quals.overallGrade = "Not specified";
        }

        if (!Array.isArray(quals.subjects)) quals.subjects = [];
        if (!Array.isArray(quals.certificates)) quals.certificates = [];
      } else {
        data.qualifications = {
          educationLevel: "Not specified",
          overallGrade: "Not specified",
          subjects: [],
          certificates: [],
        };
      }

      // Calculate profile completion
      data.profileCompletion = calculateProfileCompletion(data);

      return { success: true, data };
    } else {
      await initializeStudentProfile(userId, {
        email: "",
        fullName: "",
        userType: "student",
      });

      return {
        success: true,
        data: {
          qualifications: {
            educationLevel: "Not specified",
            overallGrade: "Not specified",
            subjects: [],
            certificates: [],
          },
          jobPreferences: {
            industries: [],
            jobTypes: [],
            locations: [],
            minSalary: null,
          },
          profileCompletion: 0,
        },
      };
    }
  } catch (error) {
    console.error("❌ Error getting student profile:", error);
    return { success: false, error: error.message };
  }
};

export const updateStudentProfile = async (userId, updates) => {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const studentRef = doc(db, COLLECTIONS.STUDENTS, userId);
    await updateDoc(studentRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    // Recalculate profile completion
    const updatedProfile = await getStudentProfile(userId);
    if (updatedProfile.success) {
      const completion = calculateProfileCompletion(updatedProfile.data);
      await updateDoc(studentRef, { profileCompletion: completion });
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Error updating student profile:", error);
    return { success: false, error: error.message };
  }
};

export const updateStudentQualifications = async (userId, qualifications) => {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const studentRef = doc(db, COLLECTIONS.STUDENTS, userId);
    await updateDoc(studentRef, {
      qualifications: qualifications,
      updatedAt: serverTimestamp(),
    });

    await checkJobMatches(userId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error updating qualifications:", error);
    return { success: false, error: error.message };
  }
};

export const updateJobPreferences = async (userId, preferences) => {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const studentRef = doc(db, COLLECTIONS.STUDENTS, userId);
    await updateDoc(studentRef, {
      jobPreferences: preferences,
      updatedAt: serverTimestamp(),
    });

    await checkJobMatches(userId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error updating job preferences:", error);
    return { success: false, error: error.message };
  }
};

// ==================== RESUME UPLOAD OPERATIONS ====================

export const uploadResume = async (file, userId) => {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Please upload a PDF or Word document' };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File size must be less than 10MB' };
    }

    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `resumes/${userId}/${timestamp}_${safeFileName}`;

    console.log('📤 Uploading resume...');

    const uploadResult = await storageService.uploadFile(file, filePath, {
      customMetadata: {
        studentId: userId,
        documentType: 'resume',
        originalName: file.name
      }
    });

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Resume upload failed');
    }

    console.log('✅ Resume uploaded successfully via:', uploadResult.storageType);

    return {
      success: true,
      url: uploadResult.url,
      storageType: uploadResult.storageType
    };
  } catch (error) {
    console.error('❌ Error uploading resume:', error);
    return { success: false, error: error.message };
  }
};

export const deleteResume = async (userId, resumeUrl, storageType) => {
  try {
    if (!userId || !resumeUrl) {
      return { success: false, error: "User ID and resume URL are required" };
    }

    // Delete from storage if it's a Firebase Storage URL
    if (storageType === 'firebase' && resumeUrl.includes('firebasestorage')) {
      try {
        // Extract the path from the URL
        const urlParts = resumeUrl.split('/o/');
        if (urlParts.length > 1) {
          const filePath = decodeURIComponent(urlParts[1].split('?')[0]);
          const fileRef = ref(storage, filePath);
          await deleteObject(fileRef);
        }
      } catch (storageError) {
        console.warn("⚠️ Could not delete resume from storage:", storageError);
      }
    }

    // Update student profile to remove resume
    const studentRef = doc(db, COLLECTIONS.STUDENTS, userId);
    await updateDoc(studentRef, {
      resumeUrl: null,
      resumeStorageType: null,
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: "Resume deleted successfully!" };
  } catch (error) {
    console.error("❌ Error deleting resume:", error);
    return { success: false, error: error.message };
  }
};

// ==================== DOCUMENT OPERATIONS ====================

export const uploadDocument = async (userId, file, documentType) => {
  try {
    if (!userId || !file) {
      return { success: false, error: "User ID and file are required" };
    }

    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      return { success: false, error: "Please upload PDF, Word, or image files only" };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: "File size must be less than 10MB" };
    }

    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `students/${userId}/documents/${documentType}_${timestamp}_${safeFileName}`;

    console.log('📤 Starting file upload process...');

    const uploadResult = await storageService.uploadFile(file, filePath, {
      customMetadata: {
        studentId: userId,
        documentType: documentType,
        originalName: file.name
      }
    });

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Upload failed');
    }

    console.log('✅ File uploaded successfully:', uploadResult.storageType);

    const documentData = {
      studentId: userId,
      documentType,
      fileName: file.name,
      fileUrl: uploadResult.url,
      storagePath: filePath,
      storageType: uploadResult.storageType,
      uploadedAt: serverTimestamp(),
      fileSize: file.size,
      mimeType: file.type,
      status: "active",
    };

    const documentsRef = collection(db, COLLECTIONS.DOCUMENTS);
    const docRef = await addDoc(documentsRef, documentData);

    if (documentType === "transcript") {
      const studentRef = doc(db, COLLECTIONS.STUDENTS, userId);
      await updateDoc(studentRef, {
        hasTranscript: true,
        transcriptUrl: uploadResult.url,
        updatedAt: serverTimestamp(),
      });
    }

    await checkJobMatches(userId);

    return {
      success: true,
      id: docRef.id,
      url: uploadResult.url,
      storageType: uploadResult.storageType,
      message: "Document uploaded successfully!"
    };
  } catch (error) {
    console.error("❌ Error uploading document:", error);
    return { success: false, error: error.message };
  }
};

export const getStudentDocuments = async (studentId) => {
  try {
    if (!studentId) {
      return { success: false, error: "Student ID is required" };
    }

    const documentsRef = collection(db, COLLECTIONS.DOCUMENTS);
    const primaryQuery = query(
      documentsRef,
      where("studentId", "==", studentId),
      orderBy("uploadedAt", "desc")
    );

    const fallbackQuery = query(
      documentsRef,
      where("studentId", "==", studentId)
    );

    const result = await executeQueryWithFallback(primaryQuery, fallbackQuery, "documents");

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const documents = result.data.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      uploadedAt: safeDateConvert(doc.data().uploadedAt),
    }));

    if (result.data.query !== primaryQuery) {
      documents.sort((a, b) => {
        const dateA = a.uploadedAt ? new Date(a.uploadedAt) : new Date(0);
        const dateB = b.uploadedAt ? new Date(b.uploadedAt) : new Date(0);
        return dateB - dateA;
      });
    }

    return { success: true, data: documents };
  } catch (error) {
    console.error("❌ Error getting student documents:", error);
    return { success: false, error: error.message };
  }
};

export const deleteDocument = async (documentId, storagePath) => {
  try {
    if (!documentId) {
      return { success: false, error: "Document ID is required" };
    }

    if (storagePath) {
      try {
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);
      } catch (storageError) {
        console.warn("⚠️ Could not delete file from storage:", storageError);
      }
    }

    const documentRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    await deleteDoc(documentRef);

    return { success: true, message: "Document deleted successfully!" };
  } catch (error) {
    console.error("❌ Error deleting document:", error);
    return { success: false, error: error.message };
  }
};

export const downloadDocument = async (fileUrl, fileName) => {
  try {
    if (!fileUrl || !fileName) {
      return { success: false, error: "File URL and name are required" };
    }

    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, message: "Download started!" };
  } catch (error) {
    console.error("❌ Error downloading document:", error);
    return { success: false, error: error.message };
  }
};

// ==================== NOTIFICATION OPERATIONS ====================

export const getStudentNotifications = async (studentId, limitCount = 10) => {
  try {
    if (!studentId) return { success: false, error: "Student ID is required" };

    const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    const primaryQuery = query(
      notificationsRef,
      where("userId", "==", studentId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const fallbackQuery = query(
      notificationsRef,
      where("userId", "==", studentId),
      limit(limitCount)
    );

    const result = await executeQueryWithFallback(primaryQuery, fallbackQuery, "notifications");

    if (!result.success) return { success: true, data: [] };

    let notifications = result.data.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: safeDateConvert(doc.data().createdAt),
      read: doc.data().read || false,
    }));

    if (result.data.query !== primaryQuery) {
      notifications.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });
    }

    return { success: true, data: notifications };
  } catch (error) {
    console.error("❌ Error getting notifications:", error);
    return { success: true, data: [] };
  }
};

export const getJobMatchNotifications = async (studentId) => {
  try {
    if (!studentId) {
      return { success: false, error: "Student ID is required" };
    }

    const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    const primaryQuery = query(
      notificationsRef,
      where("userId", "==", studentId),
      where("type", "==", "job_match"),
      orderBy("createdAt", "desc")
    );

    const fallbackQuery = query(
      notificationsRef,
      where("userId", "==", studentId),
      where("type", "==", "job_match")
    );

    const result = await executeQueryWithFallback(primaryQuery, fallbackQuery, "job match notifications");

    if (!result.success) {
      return { success: true, data: [] };
    }

    let notifications = result.data.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: safeDateConvert(doc.data().createdAt),
      read: doc.data().read || false,
    }));

    if (result.data.query !== primaryQuery) {
      notifications.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });
    }

    return { success: true, data: notifications };
  } catch (error) {
    console.error("❌ Error getting job match notifications:", error);
    return { success: true, data: [] };
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    return { success: false, error: error.message };
  }
};

export const getUnreadNotificationsCount = async (studentId) => {
  try {
    const result = await getStudentNotifications(studentId, 100);
    if (result.success) {
      const unreadCount = result.data.filter((notification) => !notification.read).length;
      return { success: true, count: unreadCount };
    }
    return { success: true, count: 0 };
  } catch (error) {
    console.error("❌ Error getting unread notifications count:", error);
    return { success: true, count: 0 };
  }
};

// ==================== COURSE & APPLICATION OPERATIONS ====================

export const getCourses = async () => {
  try {
    const coursesRef = collection(db, COLLECTIONS.COURSES);
    const coursesSnap = await getDocs(coursesRef);
    const courses = coursesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return { success: true, data: courses };
  } catch (error) {
    console.error("❌ Error getting courses:", error);
    return { success: false, error: error.message };
  }
};

export const getInstitutions = async () => {
  try {
    const institutionsRef = collection(db, COLLECTIONS.INSTITUTIONS);
    const institutionsSnap = await getDocs(institutionsRef);
    const institutions = institutionsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return { success: true, data: institutions };
  } catch (error) {
    console.error("❌ Error getting institutions:", error);
    return { success: false, error: error.message };
  }
};

export const checkCourseEligibility = async (studentId, courseId) => {
  try {
    if (!studentId || !courseId) {
      return { eligible: false, reason: "Student ID and Course ID are required" };
    }

    const studentProfile = await getStudentProfile(studentId);
    if (!studentProfile.success) {
      return { eligible: false, reason: "Student profile not found" };
    }

    const student = studentProfile.data;
    const coursesResult = await getCourses();

    if (!coursesResult.success) {
      return { eligible: false, reason: "Failed to load courses" };
    }

    const course = coursesResult.data.find((c) => c.id === courseId);
    if (!course) {
      return { eligible: false, reason: "Course not found" };
    }

    if (course.requirements) {
      return checkSpecificRequirements(student, course.requirements);
    }

    return checkGeneralRequirements(student, course);
  } catch (error) {
    console.error("❌ Error checking eligibility:", error);
    return { eligible: false, reason: "Error checking eligibility" };
  }
};

export const applyForCourse = async (applicationData) => {
  try {
    const { studentId, courseId, institutionId } = applicationData;

    if (!studentId || !courseId || !institutionId) {
      return { success: false, error: "Missing required application data" };
    }

    const eligibilityCheck = await checkCourseEligibility(studentId, courseId);
    if (!eligibilityCheck.eligible) {
      return {
        success: false,
        error: `Not eligible for this course: ${eligibilityCheck.reason}`,
      };
    }

    const existingAppsQuery = query(
      collection(db, COLLECTIONS.APPLICATIONS),
      where("studentId", "==", studentId),
      where("institutionId", "==", institutionId),
      where("status", "in", ["pending", "under_review", "approved"])
    );

    const existingAppsSnap = await getDocs(existingAppsQuery);
    if (existingAppsSnap.size >= 2) {
      return {
        success: false,
        error: "You can only apply to a maximum of 2 courses per institution",
      };
    }

    const existingCourseAppQuery = query(
      collection(db, COLLECTIONS.APPLICATIONS),
      where("studentId", "==", studentId),
      where("courseId", "==", courseId)
    );

    const existingCourseAppSnap = await getDocs(existingCourseAppQuery);
    if (!existingCourseAppSnap.empty) {
      return { success: false, error: "You have already applied to this course" };
    }

    const applicationsRef = collection(db, COLLECTIONS.APPLICATIONS);
    const docRef = await addDoc(applicationsRef, {
      ...applicationData,
      eligibilityStatus: "qualified",
      appliedAt: serverTimestamp(),
      status: "pending",
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("❌ Error applying for course:", error);
    return { success: false, error: error.message };
  }
};

export const getStudentApplications = async (studentId) => {
  try {
    if (!studentId) return { success: false, error: "Student ID is required" };

    const applicationsRef = collection(db, COLLECTIONS.APPLICATIONS);
    const primaryQuery = query(
      applicationsRef,
      where("studentId", "==", studentId),
      orderBy("appliedAt", "desc")
    );

    const fallbackQuery = query(applicationsRef, where("studentId", "==", studentId));
    const result = await executeQueryWithFallback(primaryQuery, fallbackQuery, "applications");

    if (!result.success) return { success: false, error: result.error };

    let applications = result.data.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      appliedAt: safeDateConvert(doc.data().appliedAt),
    }));

    if (result.data.query !== primaryQuery) {
      applications.sort((a, b) => {
        const dateA = a.appliedAt ? new Date(a.appliedAt) : new Date(0);
        const dateB = b.appliedAt ? new Date(b.appliedAt) : new Date(0);
        return dateB - dateA;
      });
    }

    return { success: true, data: applications };
  } catch (error) {
    console.error("❌ Error getting student applications:", error);
    return { success: false, error: error.message };
  }
};

// ==================== JOB OPERATIONS ====================

export const getJobs = async (studentId = null) => {
  try {
    const jobsRef = collection(db, COLLECTIONS.JOBS);
    const jobsQuery = query(
      jobsRef,
      where("status", "==", "active"),
      where("deadline", ">=", new Date())
    );
    const jobsSnap = await getDocs(jobsQuery);
    const jobs = jobsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (studentId) {
      const studentProfile = await getStudentProfile(studentId);
      if (studentProfile.success) {
        const qualifiedJobs = [];
        for (const job of jobs) {
          const isQualified = await checkJobQualification(studentProfile.data, job);
          if (isQualified) qualifiedJobs.push(job);
        }
        return { success: true, data: qualifiedJobs };
      }
    }

    return { success: true, data: jobs };
  } catch (error) {
    console.error("❌ Error getting jobs:", error);
    return { success: false, error: error.message };
  }
};

export const getRecommendedJobs = async (studentId) => {
  try {
    if (!studentId) return { success: false, error: "Student ID is required" };
    const result = await checkJobMatches(studentId);
    if (result.success) return { success: true, data: result.matches || [] };
    return { success: true, data: [] };
  } catch (error) {
    console.error("❌ Error getting recommended jobs:", error);
    return { success: false, error: error.message };
  }
};

export const checkJobMatches = async (studentId) => {
  try {
    if (!studentId) return { success: false, error: "Student ID required" };

    const studentProfile = await getStudentProfile(studentId);
    if (!studentProfile.success) return { success: false, error: "Student profile not found" };

    const student = studentProfile.data;
    const jobs = await getActiveJobs();

    if (!jobs.success) return { success: false, error: "Failed to load jobs" };

    const matches = [];
    for (const job of jobs.data) {
      const isQualified = await checkJobQualification(student, job);
      const isPreferred = checkJobPreferences(student, job);
      if (isQualified && isPreferred) matches.push(job);
    }

    await createJobMatchNotifications(studentId, matches);
    return { success: true, matches };
  } catch (error) {
    console.error("❌ Error checking job matches:", error);
    return { success: false, error: error.message };
  }
};

export const applyForJob = async (applicationData) => {
  try {
    console.log('📝 Submitting job application:', applicationData);

    const application = {
      ...applicationData,
      appliedAt: serverTimestamp(),
      status: 'pending',
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'applications'), application);

    console.log('✅ Application submitted successfully:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Error submitting application:', error);
    return { success: false, error: error.message };
  }
};

export const checkExistingApplication = async (studentId, jobId) => {
  try {
    const q = query(
      collection(db, 'applications'),
      where('studentId', '==', studentId),
      where('jobId', '==', jobId)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('❌ Error checking existing application:', error);
    return false;
  }
};

export const getStudentJobApplications = async (studentId) => {
  try {
    if (!studentId) return { success: false, error: "Student ID is required" };

    const applicationsRef = collection(db, COLLECTIONS.JOB_APPLICATIONS);
    const primaryQuery = query(
      applicationsRef,
      where("studentId", "==", studentId),
      orderBy("appliedAt", "desc")
    );

    const fallbackQuery = query(applicationsRef, where("studentId", "==", studentId));
    const result = await executeQueryWithFallback(primaryQuery, fallbackQuery, "job applications");

    if (!result.success) return { success: false, error: result.error };

    let applications = result.data.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      appliedAt: safeDateConvert(doc.data().appliedAt),
    }));

    if (result.data.query !== primaryQuery) {
      applications.sort((a, b) => {
        const dateA = a.appliedAt ? new Date(a.appliedAt) : new Date(0);
        const dateB = b.appliedAt ? new Date(b.appliedAt) : new Date(0);
        return dateB - dateA;
      });
    }

    return { success: true, data: applications };
  } catch (error) {
    console.error("❌ Error getting job applications:", error);
    return { success: false, error: error.message };
  }
};

// ==================== ADMISSION OPERATIONS ====================

export const getStudentAdmissions = async (studentId) => {
  try {
    if (!studentId) {
      return { success: false, error: "Student ID is required" };
    }

    const admissionsQuery = query(
      collection(db, COLLECTIONS.APPLICATIONS),
      where("studentId", "==", studentId),
      where("status", "==", "approved")
    );

    const admissionsSnap = await getDocs(admissionsQuery);

    if (admissionsSnap.empty) {
      return { success: true, data: [] };
    }

    const admissions = await Promise.all(
      admissionsSnap.docs.map(async (doc) => {
        const application = doc.data();

        let institutionName = "Unknown Institution";
        try {
          const institutionDoc = await getDoc(
            doc(db, COLLECTIONS.INSTITUTIONS, application.institutionId)
          );
          if (institutionDoc.exists()) {
            institutionName = institutionDoc.data().name;
          }
        } catch (error) {
          console.error("❌ Error getting institution:", error);
        }

        let courseName = "Unknown Course";
        try {
          const courseDoc = await getDoc(
            doc(db, COLLECTIONS.COURSES, application.courseId)
          );
          if (courseDoc.exists()) {
            courseName = courseDoc.data().name;
          }
        } catch (error) {
          console.error("❌ Error getting course:", error);
        }

        return {
          applicationId: doc.id,
          institutionId: application.institutionId,
          institutionName,
          courseId: application.courseId,
          courseName,
          appliedAt: safeDateConvert(application.appliedAt),
          approvedAt: safeDateConvert(application.reviewedAt),
          selected: application.selected || false,
        };
      })
    );

    return { success: true, data: admissions };
  } catch (error) {
    console.error("❌ Error getting student admissions:", error);
    return { success: false, error: error.message };
  }
};

export const selectInstitution = async (studentId, selectedApplicationId) => {
  try {
    if (!studentId || !selectedApplicationId) {
      return {
        success: false,
        error: "Student ID and Application ID are required",
      };
    }

    const applicationRef = doc(
      db,
      COLLECTIONS.APPLICATIONS,
      selectedApplicationId
    );
    await updateDoc(applicationRef, {
      selected: true,
      selectedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const otherApplicationsQuery = query(
      collection(db, COLLECTIONS.APPLICATIONS),
      where("studentId", "==", studentId),
      where("status", "==", "approved"),
      where("__name__", "!=", selectedApplicationId)
    );

    const otherApplicationsSnap = await getDocs(otherApplicationsQuery);

    const updatePromises = otherApplicationsSnap.docs.map((doc) =>
      updateDoc(doc.ref, {
        selected: false,
        updatedAt: serverTimestamp(),
      })
    );

    await Promise.all(updatePromises);

    return {
      success: true,
      message: "Institution selection recorded successfully",
    };
  } catch (error) {
    console.error("❌ Error selecting institution:", error);
    return { success: false, error: error.message };
  }
};

// ==================== DASHBOARD OPERATIONS ====================

export const getDashboardStats = async (studentId) => {
  try {
    if (!studentId) return { success: false, error: "Student ID is required" };

    const [
      applicationsRes,
      jobApplicationsRes,
      notificationsRes,
      profileRes,
      jobMatchesRes,
    ] = await Promise.all([
      getStudentApplications(studentId),
      getStudentJobApplications(studentId),
      getStudentNotifications(studentId),
      getStudentProfile(studentId),
      getRecommendedJobs(studentId),
    ]);

    const pendingApplications = applicationsRes.success
      ? applicationsRes.data.filter((app) => app.status === "pending").length
      : 0;

    const admissions = applicationsRes.success
      ? applicationsRes.data.filter((app) => app.status === "approved").length
      : 0;

    const pendingJobApplications = jobApplicationsRes.success
      ? jobApplicationsRes.data.filter((app) => app.status === "pending").length
      : 0;

    const jobMatches = jobMatchesRes.success ? (jobMatchesRes.data || []).length : 0;
    const unreadNotifications = notificationsRes.success
      ? notificationsRes.data.filter((notif) => !notif.read).length
      : 0;

    const profileCompletion = profileRes.success ? profileRes.data.profileCompletion || 0 : 0;

    return {
      success: true,
      data: {
        pendingApplications,
        admissions,
        pendingJobApplications,
        jobMatches,
        unreadNotifications,
        profileCompletion,
      },
    };
  } catch (error) {
    console.error("❌ Error getting dashboard stats:", error);
    return { success: false, error: error.message };
  }
};

// ==================== UTILITY FUNCTIONS ====================

export const initializeFirestoreIndexes = () => {
  if (process.env.NODE_ENV === "development") {
    FirestoreIndexManager.showAllIndexLinks();
  }
};

export { FirestoreIndexManager };

export default {
  // Profile Operations
  initializeStudentProfile,
  getStudentProfile,
  updateStudentProfile,
  updateStudentQualifications,
  updateJobPreferences,

  // Resume Operations
  uploadResume,
  deleteResume,

  // Document Operations
  uploadDocument,
  getStudentDocuments,
  deleteDocument,
  downloadDocument,

  // Notification Operations
  getStudentNotifications,
  getJobMatchNotifications,
  markNotificationAsRead,
  getUnreadNotificationsCount,

  // Course & Application Operations
  getCourses,
  getInstitutions,
  checkCourseEligibility,
  applyForCourse,
  getStudentApplications,

  // Job Operations
  getJobs,
  getRecommendedJobs,
  applyForJob,
  checkExistingApplication,
  getStudentJobApplications,
  checkJobMatches,

  // Admission Operations
  getStudentAdmissions,
  selectInstitution,

  // Dashboard Operations
  getDashboardStats,

  // Utility Functions
  initializeFirestoreIndexes,
  FirestoreIndexManager,
};
