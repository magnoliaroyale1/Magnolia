import { useState, useCallback } from 'react';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, updateDoc, limit } from 'firebase/firestore';
import { db } from '../services/firebase';

export interface AppNotification {
  id?: string;
  userId: string;
  type: 'appointment_reminder' | 'new_clinic' | 'promotion' | 'approval' | 'message';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Timestamp;
}

export const useNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification)));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id!), { read: true })));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const requestBrowserPermission = async () => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const showBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.svg'
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    requestBrowserPermission,
    showBrowserNotification
  };
};

export const useCreateNotification = () => {
  const createNotification = async (data: Omit<AppNotification, 'id'>) => {
    try {
      await addDoc(collection(db, 'notifications'), data);
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  };

  return { createNotification };
};
