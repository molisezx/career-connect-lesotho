// services/jobService.js
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Helper function to safely convert Firestore data
const convertFirestoreData = (data) => {
  const converted = { ...data };

  // Safely convert createdAt
  if (converted.createdAt && typeof converted.createdAt.toDate === 'function') {
    converted.createdAt = converted.createdAt.toDate();
  } else if (converted.createdAt) {
    // If it's already a Date or string, try to convert
    try {
      converted.createdAt = new Date(converted.createdAt);
    } catch {
      converted.createdAt = new Date();
    }
  } else {
    converted.createdAt = new Date();
  }

  // Safely convert deadline
  if (converted.deadline && typeof converted.deadline.toDate === 'function') {
    converted.deadline = converted.deadline.toDate();
  } else if (converted.deadline) {
    try {
      converted.deadline = new Date(converted.deadline);
    } catch {
      converted.deadline = null;
    }
  } else {
    converted.deadline = null;
  }

  // Safely convert updatedAt
  if (converted.updatedAt && typeof converted.updatedAt.toDate === 'function') {
    converted.updatedAt = converted.updatedAt.toDate();
  } else if (converted.updatedAt) {
    try {
      converted.updatedAt = new Date(converted.updatedAt);
    } catch {
      converted.updatedAt = new Date();
    }
  } else {
    converted.updatedAt = new Date();
  }

  return converted;
};



export const jobService = {
  // Create a new job (used by companies)
  async createJob(jobData, companyId, companyName) {
    try {
      console.log('🔄 Creating new job for company:', companyId);

      const job = {
        title: jobData.title,
        description: jobData.description,
        requirements: jobData.requirements,
        type: jobData.type,
        location: jobData.location,
        salary: jobData.salary,
        department: jobData.department,
        deadline: jobData.deadline ? Timestamp.fromDate(new Date(jobData.deadline)) : null,
        companyId: companyId,
        companyName: companyName,
        status: jobData.status || 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        applicantsCount: 0,
        views: 0
      };

      const docRef = await addDoc(collection(db, 'jobs'), job);
      console.log('✅ Job created successfully:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error creating job:', error);
      return { success: false, error: error.message };
    }
  },

  // Get jobs for students (all active jobs)
  async getActiveJobs(filters = {}) {
    try {
      console.log('🔄 Fetching active jobs with filters:', filters);

      let q = query(
        collection(db, 'jobs'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const jobs = [];

      querySnapshot.forEach((doc) => {
        try {
          const jobData = convertFirestoreData(doc.data());
          jobs.push({
            id: doc.id,
            ...jobData
          });
        } catch (docError) {
          console.warn('⚠️ Error processing job document:', doc.id, docError);
          // Skip problematic documents but continue processing others
        }
      });

      console.log(`📊 Found ${jobs.length} active jobs`);

      // Apply additional filters
      let filteredJobs = jobs;

      if (filters.type && filters.type !== '') {
        filteredJobs = filteredJobs.filter(job =>
          job.type?.toLowerCase() === filters.type.toLowerCase()
        );
      }

      if (filters.location && filters.location !== '') {
        filteredJobs = filteredJobs.filter(job =>
          job.location?.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      if (filters.search && filters.search !== '') {
        const searchLower = filters.search.toLowerCase();
        filteredJobs = filteredJobs.filter(job =>
          job.title?.toLowerCase().includes(searchLower) ||
          job.companyName?.toLowerCase().includes(searchLower) ||
          job.description?.toLowerCase().includes(searchLower) ||
          job.department?.toLowerCase().includes(searchLower)
        );
      }

      console.log(`🔍 Filtered to ${filteredJobs.length} jobs`);
      return { success: true, data: filteredJobs };
    } catch (error) {
      console.error('❌ Error getting active jobs:', error);
      return { success: false, error: error.message };
    }
  },

  // Get jobs for a specific company
  async getCompanyJobs(companyId) {
    try {
      console.log('🔄 Fetching jobs for company:', companyId);

      const q = query(
        collection(db, 'jobs'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const jobs = [];

      querySnapshot.forEach((doc) => {
        try {
          const jobData = convertFirestoreData(doc.data());
          jobs.push({
            id: doc.id,
            ...jobData
          });
        } catch (docError) {
          console.warn('⚠️ Error processing job document:', doc.id, docError);
        }
      });

      console.log(`📊 Found ${jobs.length} jobs for company`);
      return jobs;
    } catch (error) {
      console.error('❌ Error getting company jobs:', error);
      throw error;
    }
  },

  // Update job
  async updateJob(jobId, updates) {
    try {
      console.log('🔄 Updating job:', jobId);

      const jobRef = doc(db, 'jobs', jobId);

      // Convert deadline to Timestamp if it exists
      const processedUpdates = { ...updates };
      if (processedUpdates.deadline && !(processedUpdates.deadline instanceof Timestamp)) {
        processedUpdates.deadline = Timestamp.fromDate(new Date(processedUpdates.deadline));
      }

      await updateDoc(jobRef, {
        ...processedUpdates,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Job updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating job:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete job
  async deleteJob(jobId) {
    try {
      console.log('🔄 Deleting job:', jobId);
      await deleteDoc(doc(db, 'jobs', jobId));
      console.log('✅ Job deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting job:', error);
      return { success: false, error: error.message };
    }
  },

  // Get single job
  async getJob(jobId) {
    try {
      console.log('🔄 Fetching job:', jobId);
      const docRef = doc(db, 'jobs', jobId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const jobData = convertFirestoreData(docSnap.data());
        console.log('✅ Job found:', jobId);
        return {
          success: true,
          data: {
            id: docSnap.id,
            ...jobData
          }
        };
      } else {
        console.log('❌ Job not found:', jobId);
        return { success: false, error: 'Job not found' };
      }
    } catch (error) {
      console.error('❌ Error getting job:', error);
      return { success: false, error: error.message };
    }
  },

  // Increment applicant count
  async incrementApplicantCount(jobId) {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobRef);

      if (jobSnap.exists()) {
        const currentCount = jobSnap.data().applicantsCount || 0;
        await updateDoc(jobRef, {
          applicantsCount: currentCount + 1,
          updatedAt: serverTimestamp()
        });
        console.log('✅ Applicant count incremented for job:', jobId);
      }
    } catch (error) {
      console.error('❌ Error incrementing applicant count:', error);
    }
  },

  // Get job types for filtering
  async getJobTypes() {
    try {
      const q = query(
        collection(db, 'jobs'),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      const types = new Set();

      querySnapshot.forEach((doc) => {
        const type = doc.data().type;
        if (type) {
          types.add(type);
        }
      });

      return Array.from(types);
    } catch (error) {
      console.error('❌ Error getting job types:', error);
      return [];
    }
  },

  // Get locations for filtering
  async getLocations() {
    try {
      const q = query(
        collection(db, 'jobs'),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      const locations = new Set();

      querySnapshot.forEach((doc) => {
        const location = doc.data().location;
        if (location) {
          locations.add(location);
        }
      });

      return Array.from(locations);
    } catch (error) {
      console.error('❌ Error getting locations:', error);
      return [];
    }
  }
};
