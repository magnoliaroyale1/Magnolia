import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, getDoc, addDoc, onSnapshot, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export interface SupportChat {
  id: string;
  userId: string;
  userName: string;
  userRole: 'clinic' | 'client';
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  unreadCount: number;
  createdAt: Timestamp;
}

export const useAdminSupportChats = () => {
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'supportChats'),
      orderBy('lastMessageAt', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SupportChat)));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching support chats:', error);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { chats, loading };
};

export const useAdminSupportMessages = (chatId: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) { setLoading(false); return; }
    const q = query(
      collection(db, 'supportChats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [chatId]);

  return { messages, loading };
};

export const useSendAdminMessage = () => {
  const sendMessage = async (chatId: string, text: string) => {
    try {
      await addDoc(collection(db, 'supportChats', chatId, 'messages'), {
        senderId: 'admin',
        senderName: 'Suporte Magnolia',
        text,
        createdAt: Timestamp.now(),
        read: false
      });
      await updateDoc(doc(db, 'supportChats', chatId), {
        lastMessage: text,
        lastMessageAt: Timestamp.now()
      });
      const chatDoc = await getDoc(doc(db, 'supportChats', chatId));
      const chatData = chatDoc.data();
      if (chatData?.userId) {
        await addDoc(collection(db, 'notifications'), {
          userId: chatData.userId,
          type: 'message',
          title: 'Nova mensagem do suporte',
          message: text,
          link: '/support-chat',
          read: false,
          createdAt: Timestamp.now()
        });
      }
      return true;
    } catch (error) {
      console.error('Error sending admin message:', error);
      return false;
    }
  };
  return { sendMessage };
};

export const useUserSupportChat = (userId: string, userName: string, userRole: 'clinic' | 'client') => {
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const findOrCreateChat = async () => {
      const q = query(
        collection(db, 'supportChats'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const sorted = snapshot.docs.sort(
          (a, b) => b.data().createdAt?.toDate?.()?.getTime() - a.data().createdAt?.toDate?.()?.getTime()
        );
        setChatId(sorted[0].id);
        for (let i = 1; i < sorted.length; i++) {
          await deleteDoc(doc(db, 'supportChats', sorted[i].id));
        }
      } else {
        const ref = await addDoc(collection(db, 'supportChats'), {
          userId,
          userName,
          userRole,
          participants: ['admin', userId],
          lastMessage: '',
          lastMessageAt: Timestamp.now(),
          unreadCount: 0,
          createdAt: Timestamp.now()
        });
        await addDoc(collection(db, 'supportChats', ref.id, 'messages'), {
          senderId: 'system',
          senderName: 'Sistema',
          text: 'Conversa com suporte iniciada.',
          createdAt: Timestamp.now(),
          read: false
        });
        setChatId(ref.id);
      }
      setLoading(false);
    };

    findOrCreateChat();
  }, [userId, userName, userRole]);

  return { chatId, loading };
};

export const useUserSupportMessages = (chatId: string | null) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chatId) { setLoading(false); return; }
    setLoading(true);
    const q = query(
      collection(db, 'supportChats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [chatId]);

  return { messages, loading };
};

export const useSendUserSupportMessage = () => {
  const sendMessage = async (chatId: string, senderId: string, senderName: string, text: string) => {
    try {
      await addDoc(collection(db, 'supportChats', chatId, 'messages'), {
        senderId,
        senderName,
        text,
        createdAt: Timestamp.now(),
        read: false
      });
      await updateDoc(doc(db, 'supportChats', chatId), {
        lastMessage: text,
        lastMessageAt: Timestamp.now()
      });
      const adminSnapshot = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'admin'))
      );
      for (const adminDoc of adminSnapshot.docs) {
        await addDoc(collection(db, 'notifications'), {
          userId: adminDoc.id,
          type: 'message',
          title: `Nova mensagem de ${senderName}`,
          message: text,
          link: '/dashboard/admin/chat',
          read: false,
          createdAt: Timestamp.now()
        });
      }
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };
  return { sendMessage };
};
