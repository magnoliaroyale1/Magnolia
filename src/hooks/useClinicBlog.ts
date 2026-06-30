import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { BlogPost } from '../types';

export const useClinicBlogPosts = (clinicId: string) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'blogPosts'),
        where('clinicId', '==', clinicId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const snapshot = await getDocs(q);
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost)));
    } catch (error) {
      console.error('Error fetching clinic blog posts:', error);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, loading, refetch: fetchPosts };
};

export const useCreateBlogPost = () => {
  const [creating, setCreating] = useState(false);

  const createPost = useCallback(async (data: Omit<BlogPost, 'id'>) => {
    setCreating(true);
    try {
      await addDoc(collection(db, 'blogPosts'), {
        ...data,
        createdAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error creating blog post:', error);
      return false;
    } finally {
      setCreating(false);
    }
  }, []);

  return { createPost, creating };
};

export const useUpdateBlogPost = () => {
  const [updating, setUpdating] = useState(false);

  const updatePost = useCallback(async (postId: string, data: Partial<BlogPost>) => {
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'blogPosts', postId), data);
      return true;
    } catch (error) {
      console.error('Error updating blog post:', error);
      return false;
    } finally {
      setUpdating(false);
    }
  }, []);

  return { updatePost, updating };
};

export const useDeleteBlogPost = () => {
  const [deleting, setDeleting] = useState(false);

  const deletePost = useCallback(async (postId: string) => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'blogPosts', postId));
      return true;
    } catch (error) {
      console.error('Error deleting blog post:', error);
      return false;
    } finally {
      setDeleting(false);
    }
  }, []);

  return { deletePost, deleting };
};
