import { supabase } from './supabase';

export interface StorageFileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  updatedAt: string;
  publicUrl: string;
  fileExt?: string;
  resourceId?: string;
  resourceTitle?: string;
}

export interface StorageCapacityInfo {
  totalBytes: number;
  maxBytes: number; // Default: 1 GB (Supabase free tier)
  usedFormatted: string;
  maxFormatted: string;
  remainingFormatted: string;
  percentageUsed: number;
  fileCount: number;
  files: StorageFileItem[];
  bucketExists: boolean;
  error?: string;
}

const MAX_STORAGE_BYTES = 1024 * 1024 * 1024; // 1.0 GB

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Parses the storage file path from a Supabase public URL
 */
export const getStoragePathFromUrl = (url?: string, bucket = 'resources'): string | null => {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    const rawPath = url.substring(idx + marker.length);
    try {
      return decodeURIComponent(rawPath.split('?')[0]);
    } catch {
      return rawPath.split('?')[0];
    }
  }
  return null;
};

/**
 * Fetches storage usage and file inventory from Supabase 'resources' bucket
 */
export const getStorageUsage = async (bucket = 'resources'): Promise<StorageCapacityInfo> => {
  try {
    let totalBytes = 0;
    const files: StorageFileItem[] = [];

    // List top-level items (folders and files)
    const { data: rootItems, error: rootError } = await supabase.storage.from(bucket).list('', {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' }
    });

    if (rootError) {
      const isMissing = rootError.message?.toLowerCase().includes('not found') ||
                        rootError.message?.toLowerCase().includes('bucket');
      return {
        totalBytes: 0,
        maxBytes: MAX_STORAGE_BYTES,
        usedFormatted: '0 B',
        maxFormatted: '1.00 GB',
        remainingFormatted: '1.00 GB',
        percentageUsed: 0,
        fileCount: 0,
        files: [],
        bucketExists: !isMissing,
        error: isMissing
          ? `Bucket "${bucket}" is not created yet in Supabase.`
          : rootError.message
      };
    }

    // Process root items
    for (const item of rootItems || []) {
      // If item has metadata and size, it is a file in the root
      if (item.metadata && typeof item.metadata.size === 'number') {
        totalBytes += item.metadata.size;
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(item.name);
        files.push({
          id: item.id || item.name,
          name: item.name,
          path: item.name,
          size: item.metadata.size,
          updatedAt: item.updated_at || item.created_at || new Date().toISOString(),
          publicUrl: urlData.publicUrl,
          fileExt: (item.name.split('.').pop() || '').toUpperCase()
        });
      } else {
        // It is a subfolder (e.g. 'general', 'proj-123')
        const folderName = item.name;
        const { data: subItems } = await supabase.storage.from(bucket).list(folderName, {
          limit: 100,
          sortBy: { column: 'updated_at', order: 'desc' }
        });

        for (const sub of subItems || []) {
          if (sub.name === '.emptyFolderPlaceholder') continue;
          const subSize = (sub.metadata && typeof sub.metadata.size === 'number') ? sub.metadata.size : 0;
          totalBytes += subSize;
          const filePath = `${folderName}/${sub.name}`;
          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

          files.push({
            id: sub.id || filePath,
            name: sub.name,
            path: filePath,
            size: subSize,
            updatedAt: sub.updated_at || sub.created_at || new Date().toISOString(),
            publicUrl: urlData.publicUrl,
            fileExt: (sub.name.split('.').pop() || '').toUpperCase()
          });
        }
      }
    }

    const percentageUsed = Math.min(100, parseFloat(((totalBytes / MAX_STORAGE_BYTES) * 100).toFixed(2)));
    const remainingBytes = Math.max(0, MAX_STORAGE_BYTES - totalBytes);

    return {
      totalBytes,
      maxBytes: MAX_STORAGE_BYTES,
      usedFormatted: formatBytes(totalBytes),
      maxFormatted: formatBytes(MAX_STORAGE_BYTES),
      remainingFormatted: formatBytes(remainingBytes),
      percentageUsed,
      fileCount: files.length,
      files,
      bucketExists: true
    };
  } catch (err: any) {
    return {
      totalBytes: 0,
      maxBytes: MAX_STORAGE_BYTES,
      usedFormatted: '0 B',
      maxFormatted: '1.00 GB',
      remainingFormatted: '1.00 GB',
      percentageUsed: 0,
      fileCount: 0,
      files: [],
      bucketExists: false,
      error: err.message || 'Failed to inspect storage bucket.'
    };
  }
};

/**
 * Deletes a file directly from the Supabase Storage bucket
 */
export const deleteFileFromStorage = async (path: string, bucket = 'resources'): Promise<boolean> => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error(`Failed to delete file from storage (${path}):`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Error deleting file (${path}):`, err);
    return false;
  }
};
