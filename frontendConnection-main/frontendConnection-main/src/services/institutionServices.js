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
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Collection names
const COLLECTIONS = {
  INSTITUTIONS: "institutions",
  FACULTIES: "faculties",
  COURSES: "courses",
  APPLICATIONS: "applications",
  ADMISSIONS: "admissions",
  STUDENTS: "students",
  WAITLISTS: "waitlists",
  USERS: "users",
};

// Safe date conversion function
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

// Validation helper
const validateInstitutionId = (institutionId) => {
  if (!institutionId) {
    throw new Error("Institution ID is required");
  }
};

// Initialize institution collections - creates document if it doesn't exist
export const initializeInstitutionCollections = async (institutionId) => {
  try {
    console.log("🔄 Initializing collections for institution:", institutionId);
    validateInstitutionId(institutionId);

    const institutionRef = doc(db, COLLECTIONS.INSTITUTIONS, institutionId);
    const institutionSnap = await getDoc(institutionRef);

    if (!institutionSnap.exists()) {
      console.log("🏫 Creating new institution document...");

      await setDoc(institutionRef, {
        id: institutionId,
        name: "Your Institution",
        type: "University",
        location: "Lesotho",
        accreditationStatus: "accredited",
        status: "active",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        facultyCount: 0,
        courseCount: 0,
        studentCount: 0,
        totalStudents: 0,
        activeCourses: 0,
        totalFaculties: 0,
      });
      console.log("✅ Institution document created successfully");
    } else {
      console.log("✅ Institution document already exists");

      await updateDoc(institutionRef, {
        updatedAt: Timestamp.now(),
      });
    }

    return true;
  } catch (error) {
    console.error("❌ Error initializing collections:", error);

    if (error.code === "permission-denied") {
      throw new Error(
        "Permission denied. Please check your Firebase security rules."
      );
    } else {
      throw new Error(
        `Failed to initialize institution collections: ${error.message}`
      );
    }
  }
};

// Enhanced getRecentApplications with proper error handling
export const getRecentApplications = async (institutionId, limitCount = 5) => {
  try {
    validateInstitutionId(institutionId);

    await initializeInstitutionCollections(institutionId);

    const applicationsRef = collection(db, COLLECTIONS.APPLICATIONS);
    const q = query(
      applicationsRef,
      where("institutionId", "==", institutionId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const applicationsSnap = await getDocs(q);

    const applications = applicationsSnap.docs.map((doc) => {
      const data = doc.data();
      if (data.createdAt) data.createdAt = safeDateConvert(data.createdAt);
      if (data.updatedAt) data.updatedAt = safeDateConvert(data.updatedAt);
      if (data.reviewedAt) data.reviewedAt = safeDateConvert(data.reviewedAt);
      return { id: doc.id, ...data };
    });

    return applications;
  } catch (error) {
    console.error("❌ Error getting applications:", error);

    // Handle index-related errors gracefully
    if (error.code === "failed-precondition") {
      console.warn(
        "Firestore index required for this query. Please ensure the following composite index exists:"
      );
      console.warn("Collection: applications");
      console.warn("Fields: institutionId (Asc), createdAt (Desc)");
      throw new Error(
        "Database index is required. Please contact support if this error persists."
      );
    }

    throw new Error("Failed to load applications");
  }
};

// Enhanced getAllApplications with proper error handling
export const getAllApplications = async (institutionId, status = null) => {
  try {
    validateInstitutionId(institutionId);

    await initializeInstitutionCollections(institutionId);

    const applicationsRef = collection(db, COLLECTIONS.APPLICATIONS);
    let q;

    if (status) {
      q = query(
        applicationsRef,
        where("institutionId", "==", institutionId),
        where("status", "==", status),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        applicationsRef,
        where("institutionId", "==", institutionId),
        orderBy("createdAt", "desc")
      );
    }

    const applicationsSnap = await getDocs(q);

    const applications = applicationsSnap.docs.map((doc) => {
      const data = doc.data();
      if (data.createdAt) data.createdAt = safeDateConvert(data.createdAt);
      if (data.updatedAt) data.updatedAt = safeDateConvert(data.updatedAt);
      if (data.reviewedAt) data.reviewedAt = safeDateConvert(data.reviewedAt);
      return { id: doc.id, ...data };
    });

    return applications;
  } catch (error) {
    console.error("❌ Error getting all applications:", error);

    // Handle index-related errors gracefully
    if (error.code === "failed-precondition") {
      console.warn(
        "Firestore index required for this query. Please ensure the following composite index exists:"
      );
      console.warn("Collection: applications");
      if (status) {
        console.warn(
          "Fields: institutionId (Asc), status (Asc), createdAt (Desc)"
        );
      } else {
        console.warn("Fields: institutionId (Asc), createdAt (Desc)");
      }
      throw new Error(
        "Database index is required. Please contact support if this error persists."
      );
    }

    throw new Error("Failed to load applications");
  }
};

// Institution Operations
export const getInstitutionData = async (institutionId) => {
  try {
    validateInstitutionId(institutionId);

    await initializeInstitutionCollections(institutionId);

    const institutionRef = doc(db, COLLECTIONS.INSTITUTIONS, institutionId);
    const institutionSnap = await getDoc(institutionRef);

    if (institutionSnap.exists()) {
      const data = institutionSnap.data();
      if (data.createdAt) data.createdAt = safeDateConvert(data.createdAt);
      if (data.updatedAt) data.updatedAt = safeDateConvert(data.updatedAt);
      return { id: institutionSnap.id, ...data };
    }
    return null;
  } catch (error) {
    console.error("❌ Error getting institution data:", error);
    throw new Error("Failed to load institution data");
  }
};

export const updateInstitutionProfile = async (institutionId, data) => {
  try {
    validateInstitutionId(institutionId);

    await initializeInstitutionCollections(institutionId);

    const institutionRef = doc(db, COLLECTIONS.INSTITUTIONS, institutionId);
    await updateDoc(institutionRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("❌ Error updating institution profile:", error);
    throw new Error("Failed to update institution profile");
  }
};

// Faculty Operations
export const getFaculties = async (institutionId) => {
  try {
    validateInstitutionId(institutionId);

    await initializeInstitutionCollections(institutionId);

    const facultiesRef = collection(
      db,
      COLLECTIONS.INSTITUTIONS,
      institutionId,
      COLLECTIONS.FACULTIES
    );
    const q = query(facultiesRef, orderBy("createdAt", "desc"));
    const facultiesSnap = await getDocs(q);

    const faculties = facultiesSnap.docs.map((doc) => {
      const data = doc.data();
      if (data.createdAt) data.createdAt = safeDateConvert(data.createdAt);
      if (data.updatedAt) data.updatedAt = safeDateConvert(data.updatedAt);
      return { id: doc.id, ...data };
    });

    return faculties;
  } catch (error) {
    console.error("❌ Error getting faculties:", error);
    throw new Error("Failed to load faculties");
  }
};

export const addFaculty = async (institutionId, facultyData) => {
  try {
    validateInstitutionId(institutionId);

    await initializeInstitutionCollections(institutionId);

    const facultiesRef = collection(
      db,
      COLLECTIONS.INSTITUTIONS,
      institutionId,
      COLLECTIONS.FACULTIES
    );

    const facultyWithTimestamps = {
      ...facultyData,
      institutionId: institutionId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(facultiesRef, facultyWithTimestamps);

    await updateInstitutionFacultyCount(institutionId);

    return docRef.id;
  } catch (error) {
    console.error("❌ Error adding faculty:", error);
    throw new Error("Failed to add faculty");
  }
};

export const updateFaculty = async (institutionId, facultyId, facultyData) => {
  try {
    validateInstitutionId(institutionId);
    if (!facultyId) {
      throw new Error("Faculty ID is required");
    }

    const facultyRef = doc(
      db,
      COLLECTIONS.INSTITUTIONS,
      institutionId,
      COLLECTIONS.FACULTIES,
      facultyId
    );

    const facultyWithTimestamps = {
      ...facultyData,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(facultyRef, facultyWithTimestamps);
  } catch (error) {
    console.error("❌ Error updating faculty:", error);
    throw new Error("Failed to update faculty");
  }
};

export const deleteFaculty = async (institutionId, facultyId) => {
  try {
    validateInstitutionId(institutionId);
    if (!facultyId) {
      throw new Error("Faculty ID is required");
    }

    const facultyCourses = await getCourses(institutionId, facultyId);
    if (facultyCourses.length > 0) {
      throw new Error(
        "Cannot delete faculty with existing courses. Please delete or transfer courses first."
      );
    }

    const facultyRef = doc(
      db,
      COLLECTIONS.INSTITUTIONS,
      institutionId,
      COLLECTIONS.FACULTIES,
      facultyId
    );

    await deleteDoc(facultyRef);

    await updateInstitutionFacultyCount(institutionId);
  } catch (error) {
    console.error("❌ Error deleting faculty:", error);
    throw error;
  }
};

// Helper function to update institution faculty count
const updateInstitutionFacultyCount = async (institutionId) => {
  try {
    const faculties = await getFaculties(institutionId);
    const institutionRef = doc(db, COLLECTIONS.INSTITUTIONS, institutionId);

    await updateDoc(institutionRef, {
      facultyCount: faculties.length,
      totalFaculties: faculties.length,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("❌ Error updating institution faculty count:", error);
  }
};

// Course Operations
export const getCourses = async (institutionId, facultyId = null) => {
  try {
    validateInstitutionId(institutionId);

    await initializeInstitutionCollections(institutionId);

    let coursesRef;
    let q;

    if (facultyId) {
      coursesRef = collection(
        db,
        COLLECTIONS.INSTITUTIONS,
        institutionId,
        COLLECTIONS.FACULTIES,
        facultyId,
        COLLECTIONS.COURSES
      );
    } else {
      coursesRef = collection(
        db,
        COLLECTIONS.INSTITUTIONS,
        institutionId,
        COLLECTIONS.COURSES
      );
    }

    q = query(coursesRef, orderBy("createdAt", "desc"));
    const coursesSnap = await getDocs(q);

    const courses = coursesSnap.docs.map((doc) => {
      const data = doc.data();
      if (data.createdAt) data.createdAt = safeDateConvert(data.createdAt);
      if (data.updatedAt) data.updatedAt = safeDateConvert(data.updatedAt);
      return { id: doc.id, ...data };
    });

    return courses;
  } catch (error) {
    console.error("❌ Error getting courses:", error);
    throw new Error("Failed to load courses");
  }
};

export const addCourse = async (institutionId, courseData) => {
  try {
    validateInstitutionId(institutionId);

    await initializeInstitutionCollections(institutionId);

    if (!courseData.facultyId) {
      throw new Error("Faculty ID is required for creating a course");
    }

    const coursesRef = collection(
      db,
      COLLECTIONS.INSTITUTIONS,
      institutionId,
      COLLECTIONS.COURSES
    );

    const courseWithTimestamps = {
      ...courseData,
      institutionId: institutionId,
      enrolledStudents: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(coursesRef, courseWithTimestamps);

    await updateFacultyCourseCount(institutionId, courseData.facultyId);

    return docRef.id;
  } catch (error) {
    console.error("❌ Error adding course:", error);
    throw new Error("Failed to add course");
  }
};

export const updateCourse = async (institutionId, courseId, courseData) => {
  try {
    validateInstitutionId(institutionId);
    if (!courseId) {
      throw new Error("Course ID is required");
    }

    const courseRef = doc(
      db,
      COLLECTIONS.INSTITUTIONS,
      institutionId,
      COLLECTIONS.COURSES,
      courseId
    );

    const courseWithTimestamps = {
      ...courseData,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(courseRef, courseWithTimestamps);

    if (courseData.facultyId) {
      await updateFacultyCourseCount(institutionId, courseData.facultyId);
    }
  } catch (error) {
    console.error("❌ Error updating course:", error);
    throw new Error("Failed to update course");
  }
};

export const deleteCourse = async (institutionId, courseId) => {
  try {
    validateInstitutionId(institutionId);
    if (!courseId) {
      throw new Error("Course ID is required");
    }

    const courseRef = doc(
      db,
      COLLECTIONS.INSTITUTIONS,
      institutionId,
      COLLECTIONS.COURSES,
      courseId
    );

    const courseDoc = await getDoc(courseRef);
    if (!courseDoc.exists()) {
      throw new Error("Course not found");
    }

    const courseData = courseDoc.data();
    const facultyId = courseData.facultyId;

    await deleteDoc(courseRef);

    if (facultyId) {
      await updateFacultyCourseCount(institutionId, facultyId);
    }
  } catch (error) {
    console.error("❌ Error deleting course:", error);
    throw new Error("Failed to delete course");
  }
};

// Helper function to update faculty course count
const updateFacultyCourseCount = async (institutionId, facultyId) => {
  try {
    const courses = await getCourses(institutionId, facultyId);
    const facultyRef = doc(
      db,
      COLLECTIONS.INSTITUTIONS,
      institutionId,
      COLLECTIONS.FACULTIES,
      facultyId
    );

    await updateDoc(facultyRef, {
      courseCount: courses.length,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("❌ Error updating faculty course count:", error);
  }
};

// Application Status Operations
export const updateApplicationStatus = async (
  applicationId,
  status,
  institutionId,
  notes = ""
) => {
  try {
    if (!applicationId || !institutionId) {
      throw new Error("Application ID and Institution ID are required");
    }

    await initializeInstitutionCollections(institutionId);

    const applicationRef = doc(db, COLLECTIONS.APPLICATIONS, applicationId);
    const applicationDoc = await getDoc(applicationRef);

    if (!applicationDoc.exists()) {
      throw new Error("Application not found");
    }

    const application = applicationDoc.data();
    const studentId = application.studentId;

    if (status === "approved") {
      const existingAdmissions = await getDocs(
        query(
          collection(db, COLLECTIONS.APPLICATIONS),
          where("institutionId", "==", institutionId),
          where("studentId", "==", studentId),
          where("status", "==", "approved")
        )
      );

      if (!existingAdmissions.empty) {
        const existingAdmission = existingAdmissions.docs[0].data();
        const existingCourse = await getDoc(
          doc(
            db,
            COLLECTIONS.INSTITUTIONS,
            institutionId,
            COLLECTIONS.COURSES,
            existingAdmission.courseId
          )
        );
        const existingCourseName = existingCourse.exists()
          ? existingCourse.data().name
          : "another program";

        throw new Error(
          `Student is already admitted to ${existingCourseName} in this institution. Cannot admit to multiple programs.`
        );
      }

      const pendingApplications = await getDocs(
        query(
          collection(db, COLLECTIONS.APPLICATIONS),
          where("institutionId", "==", institutionId),
          where("studentId", "==", studentId),
          where("status", "==", "pending")
        )
      );

      const batch = writeBatch(db);

      batch.update(applicationRef, {
        status: status,
        reviewedAt: Timestamp.now(),
        reviewedBy: institutionId,
        updatedAt: Timestamp.now(),
        reviewNotes:
          notes || `Application approved on ${new Date().toLocaleDateString()}`,
      });

      pendingApplications.docs.forEach((doc) => {
        if (doc.id !== applicationId) {
          batch.update(doc.ref, {
            status: "rejected",
            reviewedAt: Timestamp.now(),
            reviewedBy: institutionId,
            updatedAt: Timestamp.now(),
            reviewNotes: `Automatically rejected because student was admitted to another program in this institution`,
          });
        }
      });

      await batch.commit();

      return {
        success: true,
        message:
          "Application approved successfully. Other pending applications from this student have been automatically rejected.",
        autoRejectedCount: pendingApplications.docs.length - 1,
      };
    } else {
      const updateData = {
        status,
        reviewedAt: Timestamp.now(),
        reviewedBy: institutionId,
        updatedAt: Timestamp.now(),
      };

      if (notes) {
        updateData.reviewNotes = notes;
      }

      await updateDoc(applicationRef, updateData);

      return {
        success: true,
        message: `Application ${status} successfully`,
      };
    }
  } catch (error) {
    console.error("❌ Error updating application status:", error);
    throw error;
  }
};

// Statistics Operations
export const getInstitutionStats = async (institutionId) => {
  try {
    validateInstitutionId(institutionId);

    await initializeInstitutionCollections(institutionId);

    const studentsQuery = query(
      collection(db, COLLECTIONS.APPLICATIONS),
      where("institutionId", "==", institutionId),
      where("status", "==", "approved")
    );
    const studentsSnap = await getDocs(studentsQuery);
    const totalStudents = studentsSnap.size;

    const coursesRef = collection(
      db,
      COLLECTIONS.INSTITUTIONS,
      institutionId,
      COLLECTIONS.COURSES
    );
    const coursesQuery = query(coursesRef, where("status", "==", "active"));
    const coursesSnap = await getDocs(coursesQuery);
    const activeCourses = coursesSnap.size;

    const applicationsRef = collection(db, COLLECTIONS.APPLICATIONS);
    const applicationsQuery = query(
      applicationsRef,
      where("institutionId", "==", institutionId),
      where("status", "==", "pending")
    );
    const applicationsSnap = await getDocs(applicationsQuery);
    const pendingApplications = applicationsSnap.size;

    const admissionsRef = collection(
      db,
      COLLECTIONS.INSTITUTIONS,
      institutionId,
      COLLECTIONS.ADMISSIONS
    );
    const admissionsQuery = query(
      admissionsRef,
      where("status", "==", "published")
    );
    const admissionsSnap = await getDocs(admissionsQuery);
    const publishedAdmissions = admissionsSnap.size;

    const facultiesRef = collection(
      db,
      COLLECTIONS.INSTITUTIONS,
      institutionId,
      COLLECTIONS.FACULTIES
    );
    const facultiesSnap = await getDocs(facultiesRef);
    const totalFaculties = facultiesSnap.size;

    return {
      totalStudents,
      activeCourses,
      pendingApplications,
      publishedAdmissions,
      totalFaculties,
    };
  } catch (error) {
    console.error("❌ Error getting institution stats:", error);
    return {
      totalStudents: 0,
      activeCourses: 0,
      pendingApplications: 0,
      publishedAdmissions: 0,
      totalFaculties: 0,
    };
  }
};

// Admission Operations
export const getAdmissions = async (institutionId) => {
  try {
    validateInstitutionId(institutionId);

    await initializeInstitutionCollections(institutionId);

    const admissionsRef = collection(
      db,
      COLLECTIONS.INSTITUTIONS,
      institutionId,
      COLLECTIONS.ADMISSIONS
    );
    const q = query(admissionsRef, orderBy("createdAt", "desc"));
    const admissionsSnap = await getDocs(q);

    const admissions = admissionsSnap.docs.map((doc) => {
      const data = doc.data();
      if (data.createdAt) data.createdAt = safeDateConvert(data.createdAt);
      if (data.updatedAt) data.updatedAt = safeDateConvert(data.updatedAt);
      if (data.deadline) data.deadline = safeDateConvert(data.deadline);
      return { id: doc.id, ...data };
    });

    return admissions;
  } catch (error) {
    console.error("❌ Error getting admissions:", error);
    throw new Error("Failed to load admissions");
  }
};

export const publishAdmission = async (institutionId, admissionData) => {
  try {
    validateInstitutionId(institutionId);

    await initializeInstitutionCollections(institutionId);

    const admissionsRef = collection(
      db,
      COLLECTIONS.INSTITUTIONS,
      institutionId,
      COLLECTIONS.ADMISSIONS
    );

    const admissionWithTimestamps = {
      ...admissionData,
      institutionId: institutionId,
      status: admissionData.status || "published",
      applicationCount: admissionData.applicationCount || 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(admissionsRef, admissionWithTimestamps);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error publishing admission:", error);
    throw new Error("Failed to publish admission");
  }
};

export const updateAdmission = async (
  institutionId,
  admissionId,
  admissionData
) => {
  try {
    validateInstitutionId(institutionId);
    if (!admissionId) {
      throw new Error("Admission ID is required");
    }

    const admissionRef = doc(
      db,
      COLLECTIONS.INSTITUTIONS,
      institutionId,
      COLLECTIONS.ADMISSIONS,
      admissionId
    );

    const admissionWithTimestamps = {
      ...admissionData,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(admissionRef, admissionWithTimestamps);
  } catch (error) {
    console.error("❌ Error updating admission:", error);
    throw new Error("Failed to update admission");
  }
};

export const deleteAdmission = async (institutionId, admissionId) => {
  try {
    validateInstitutionId(institutionId);
    if (!admissionId) {
      throw new Error("Admission ID is required");
    }

    const admissionRef = doc(
      db,
      COLLECTIONS.INSTITUTIONS,
      institutionId,
      COLLECTIONS.ADMISSIONS,
      admissionId
    );

    await deleteDoc(admissionRef);
  } catch (error) {
    console.error("❌ Error deleting admission:", error);
    throw new Error("Failed to delete admission");
  }
};

// Student Management
export const getStudents = async (institutionId, status = "approved") => {
  try {
    validateInstitutionId(institutionId);

    await initializeInstitutionCollections(institutionId);

    const applicationsRef = collection(db, COLLECTIONS.APPLICATIONS);
    const q = query(
      applicationsRef,
      where("institutionId", "==", institutionId),
      where("status", "==", status),
      orderBy("createdAt", "desc")
    );

    const applicationsSnap = await getDocs(q);

    const students = await Promise.all(
      applicationsSnap.docs.map(async (doc) => {
        const application = doc.data();

        let studentDetails = {};
        try {
          const studentDoc = await getDoc(
            doc(db, COLLECTIONS.USERS, application.studentId)
          );
          if (studentDoc.exists()) {
            studentDetails = studentDoc.data();
          }
        } catch (error) {
          console.error("❌ Error fetching student details:", error);
        }

        let courseDetails = {};
        try {
          const courseDoc = await getDoc(
            doc(
              db,
              COLLECTIONS.INSTITUTIONS,
              institutionId,
              COLLECTIONS.COURSES,
              application.courseId
            )
          );
          if (courseDoc.exists()) {
            courseDetails = courseDoc.data();
          }
        } catch (error) {
          console.error("❌ Error fetching course details:", error);
        }

        return {
          id: doc.id,
          applicationId: doc.id,
          studentId: application.studentId,
          fullName:
            studentDetails.fullName ||
            application.studentName ||
            "Unknown Student",
          email:
            studentDetails.email || application.studentEmail || "Unknown Email",
          phone: studentDetails.phoneNumber || "Not provided",
          courseName: courseDetails.name || "Unknown Course",
          courseId: application.courseId,
          appliedAt: safeDateConvert(application.createdAt),
          status: application.status,
          reviewNotes: application.reviewNotes || "",
        };
      })
    );

    return students;
  } catch (error) {
    console.error("❌ Error getting students:", error);
    throw new Error("Failed to load students");
  }
};

// Removed initializeFirestoreIndexes function since we don't need it anymore
