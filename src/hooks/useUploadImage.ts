import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';

export const useUploadImage = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(pct);
          },
          (err) => {
            setError(err.message);
            setUploading(false);
            reject(null);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setUploading(false);
            resolve(url);
          }
        );
      });
    } catch (err: any) {
      setError(err.message);
      setUploading(false);
      return null;
    }
  };

  return { uploadImage, uploading, progress, error };
};

export const useUploadClinicImages = () => {
  const { uploadImage, uploading, progress, error } = useUploadImage();

  const uploadClinicImage = async (file: File, clinicId: string): Promise<string | null> => {
    return uploadImage(file, `clinics/${clinicId}`);
  };

  return { uploadClinicImage, uploading, progress, error };
};
