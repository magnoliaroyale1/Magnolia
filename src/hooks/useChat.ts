import { useState, useEffect } from 'react';
import {
  collection, query, where, getDocs, addDoc, orderBy, onSnapshot,
  doc, updateDoc, Timestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Chat, Message } from '../types';

export const useChats = (userId: string) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  return { chats, loading };
};

export const useMessages = (chatId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [chatId]);

  return { messages, loading };
};

export const useSendMessage = () => {
  const sendMessage = async (chatId: string, senderId: string, text: string) => {
    try {
      const messageData = {
        senderId,
        text,
        createdAt: Timestamp.now(),
        read: false,
        chatId
      };
      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        lastMessageAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  return { sendMessage };
};

export const useCreateChat = () => {
  const createChat = async (clientId: string, clinicId: string, clientName: string, clinicName: string) => {
    try {
      const existingQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', clientId)
      );
      const snapshot = await getDocs(existingQuery);
      const existing = snapshot.docs.find(d => {
        const data = d.data();
        return data.clinicId === clinicId && data.clientId === clientId;
      });
      if (existing) return existing.id;

      const chatRef = await addDoc(collection(db, 'chats'), {
        clientId,
        clinicId,
        clientName,
        clinicName,
        participants: [clientId, clinicId],
        lastMessage: '',
        lastMessageAt: Timestamp.now(),
        unreadCount: 0
      });
      return chatRef.id;
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  };

  return { createChat };
};

export const useMarkAsRead = () => {
  const markAsRead = async (chatId: string, userId: string) => {
    try {
      const q = query(
        collection(db, 'chats', chatId, 'messages'),
        where('read', '==', false),
        where('senderId', '!=', userId)
      );
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(d => updateDoc(doc(db, 'chats', chatId, 'messages', d.id), { read: true }));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  return { markAsRead };
};
