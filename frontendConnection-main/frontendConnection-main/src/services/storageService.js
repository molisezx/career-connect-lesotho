import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes
} from 'firebase/storage';
import { storage } from '../config/firebase';

class StorageService {
  constructor() {
    this.fallbackStorage = new FallbackStorage();
  }

  /**
   * Upload file with Firebase Storage primary and SQLite fallback
   */
  async uploadFile(file, path, metadata = {}) {
    try {
      // Try Firebase Storage first
      console.log('📤 Attempting Firebase Storage upload...');
      const firebaseResult = await this.uploadToFirebase(file, path, metadata);

      if (firebaseResult.success) {
        return firebaseResult;
      }

      // Fallback to SQLite
      console.log('🔄 Falling back to SQLite storage...');
      return await this.fallbackStorage.uploadFile(file, path, metadata);

    } catch (error) {
      console.error('❌ Both storage methods failed:', error);
      return await this.fallbackStorage.uploadFile(file, path, metadata);
    }
  }

  /**
   * Upload to Firebase Storage
   */
  async uploadToFirebase(file, path, metadata = {}) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        success: true,
        url: downloadURL,
        path: snapshot.ref.fullPath,
        storageType: 'firebase',
        metadata: {
          size: file.size,
          type: file.type,
          name: file.name,
          lastModified: file.lastModified
        }
      };
    } catch (error) {
      console.error('❌ Firebase upload failed:', error);
      throw error;
    }
  }

  /**
   * Get file URL
   */
  async getFileUrl(path, storageType = 'auto') {
    try {
      if (storageType === 'firebase' || storageType === 'auto') {
        try {
          const storageRef = ref(storage, path);
          const url = await getDownloadURL(storageRef);
          return { success: true, url, storageType: 'firebase' };
        } catch (firebaseError) {
          if (storageType === 'firebase') throw firebaseError;
        }
      }

      // Fallback to SQLite
      return await this.fallbackStorage.getFileUrl(path);
    } catch (error) {
      console.error('❌ Error getting file URL:', error);
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(path, storageType = 'auto') {
    try {
      if (storageType === 'firebase' || storageType === 'auto') {
        try {
          const storageRef = ref(storage, path);
          await deleteObject(storageRef);
          return { success: true, storageType: 'firebase' };
        } catch (firebaseError) {
          if (storageType === 'firebase') throw firebaseError;
        }
      }

      // Fallback to SQLite
      return await this.fallbackStorage.deleteFile(path);
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      throw error;
    }
  }
}

/**
 * SQLite Fallback Storage Implementation
 */
class FallbackStorage {
  constructor() {
    this.db = null;
    this.initDatabase();
  }

  /**
   * Initialize SQLite database
   */
  async initDatabase() {
    if (typeof window !== 'undefined' && window.SQL) {
      try {
        this.db = new window.SQL.Database();
        this.createTables();
      } catch (error) {
        console.warn('⚠️ SQL.js not available, using localStorage fallback');
      }
    }
  }

  /**
   * Create necessary tables
   */
  createTables() {
    if (!this.db) return;

    this.db.run(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT UNIQUE,
        filename TEXT,
        data BLOB,
        mime_type TEXT,
        size INTEGER,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      )
    `);
  }

  /**
   * Upload file to SQLite
   */
  async uploadFile(file, path, metadata = {}) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();

        reader.onload = () => {
          try {
            if (this.db) {
              // Store in SQLite
              this.storeInSQLite(path, file, reader.result, metadata, resolve, reject);
            } else {
              // Store in localStorage as fallback
              this.storeInLocalStorage(path, file, reader.result, metadata, resolve, reject);
            }
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => reject(new Error('File reading failed'));
        reader.readAsArrayBuffer(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Store file in SQLite
   */
  storeInSQLite(path, file, arrayBuffer, metadata, resolve, reject) {
    try {
      const uint8Array = new Uint8Array(arrayBuffer);

      this.db.run(
        `INSERT OR REPLACE INTO files (path, filename, data, mime_type, size, metadata)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          path,
          file.name,
          uint8Array,
          file.type,
          file.size,
          JSON.stringify(metadata)
        ]
      );

      const url = this.createBlobURL(arrayBuffer, file.type);

      resolve({
        success: true,
        url: url,
        path: path,
        storageType: 'sqlite',
        metadata: {
          size: file.size,
          type: file.type,
          name: file.name,
          lastModified: file.lastModified
        }
      });
    } catch (error) {
      reject(error);
    }
  }

  /**
   * Store file in localStorage (ultimate fallback)
   */
  storeInLocalStorage(path, file, arrayBuffer, metadata, resolve, reject) {
    try {
      const base64Data = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      const fileData = {
        filename: file.name,
        data: base64Data,
        mime_type: file.type,
        size: file.size,
        metadata: metadata,
        uploaded_at: new Date().toISOString()
      };

      localStorage.setItem(`file_${path}`, JSON.stringify(fileData));

      const url = this.createBlobURL(arrayBuffer, file.type);

      resolve({
        success: true,
        url: url,
        path: path,
        storageType: 'localStorage',
        metadata: {
          size: file.size,
          type: file.type,
          name: file.name,
          lastModified: file.lastModified
        }
      });
    } catch (error) {
      reject(new Error('All storage methods failed'));
    }
  }

  /**
   * Create blob URL for downloaded files
   */
  createBlobURL(arrayBuffer, mimeType) {
    const blob = new Blob([arrayBuffer], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  /**
   * Get file URL from SQLite
   */
  async getFileUrl(path) {
    return new Promise((resolve, reject) => {
      try {
        if (this.db) {
          const stmt = this.db.prepare('SELECT data, mime_type FROM files WHERE path = ?');
          stmt.bind([path]);

          if (stmt.step()) {
            const row = stmt.getAsObject();
            const arrayBuffer = row.data.buffer;
            const url = this.createBlobURL(arrayBuffer, row.mime_type);

            resolve({
              success: true,
              url: url,
              storageType: 'sqlite'
            });
          } else {
            reject(new Error('File not found'));
          }

          stmt.free();
        } else {
          // Try localStorage
          const fileData = localStorage.getItem(`file_${path}`);
          if (fileData) {
            const parsedData = JSON.parse(fileData);
            const binaryString = atob(parsedData.data);
            const bytes = new Uint8Array(binaryString.length);

            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            const url = this.createBlobURL(bytes.buffer, parsedData.mime_type);

            resolve({
              success: true,
              url: url,
              storageType: 'localStorage'
            });
          } else {
            reject(new Error('File not found'));
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Delete file from SQLite
   */
  async deleteFile(path) {
    return new Promise((resolve, reject) => {
      try {
        if (this.db) {
          this.db.run('DELETE FROM files WHERE path = ?', [path]);
        }

        // Also remove from localStorage if exists
        localStorage.removeItem(`file_${path}`);

        resolve({ success: true, storageType: 'sqlite' });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get all stored files (for management)
   */
  async getAllFiles() {
    return new Promise((resolve, reject) => {
      try {
        const files = [];

        if (this.db) {
          const stmt = this.db.prepare('SELECT path, filename, mime_type, size, uploaded_at FROM files');
          while (stmt.step()) {
            files.push(stmt.getAsObject());
          }
          stmt.free();
        }

        // Also get from localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('file_')) {
            const fileData = JSON.parse(localStorage.getItem(key));
            files.push({
              path: key.replace('file_', ''),
              filename: fileData.filename,
              mime_type: fileData.mime_type,
              size: fileData.size,
              uploaded_at: fileData.uploaded_at,
              storage: 'localStorage'
            });
          }
        }

        resolve(files);
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;
