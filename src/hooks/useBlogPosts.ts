import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { BlogPost } from '../types';

export const useBlogPosts = (clinicId?: string) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const constraints: any[] = [orderBy('createdAt', 'desc'), limit(50)];
        if (clinicId) {
          constraints.unshift(where('clinicId', '==', clinicId));
        }
        const q = query(collection(db, 'blogPosts'), ...constraints);
        const snapshot = await getDocs(q);
        setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost)));
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [clinicId]);

  return { posts, loading };
};
