# Plano de Implementação

## A. Fix — Clínicas não listadas (ClinicsList.tsx)

**Arquivo:** `src/pages/ClinicsList.tsx`

**Problema:** A query `where('status', '==', 'approved') + orderBy('rating', 'desc')` exige índice composto no Firestore. Se o índice não existir, a query falha e o catch só loga o erro — `allClinics` fica vazio, usuário vê "Nenhuma clínica encontrada".

**Solução:** Adicionar fallback client-side: se a query indexada falhar, buscar todas as clínicas (`getDocs(collection(db, 'clinics'))`), filtrar `c.status === 'approved'` e ordenar por `rating` em memória.

**Código a substituir (linhas 27-46):**
```tsx
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const q = query(
          collection(db, 'clinics'),
          where('status', '==', 'approved'),
          orderBy('rating', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clinic));
        setAllClinics(data);
        setFilteredClinics(data);
      } catch (err) {
        console.warn('Query indexada falhou, buscando todas e filtrando...', err);
        try {
          const snapshot = await getDocs(collection(db, 'clinics'));
          const data = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Clinic))
            .filter(c => c.status === 'approved')
            .sort((a, b) => (b.rating || 0) - (a.rating || 0));
          setAllClinics(data);
          setFilteredClinics(data);
        } catch (fallbackErr) {
          console.error('Fallback também falhou:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchClinics();
  }, []);
```

---

## B. Fix — Deduplicação de chat de suporte

**Arquivo:** `src/hooks/useAdminChat.ts`

**Problema:** `useUserSupportChat` verifica com `where('participants', 'array-contains', userId)`. Se o StrictMode do React montar o efeito duas vezes, ambas as execuções veem `snapshot.empty === true` e criam dois docs.

**Solução:**
1. Trocar verificação para `where('userId', '==', userId)` (sem array-contains, mais confiável).
2. Na criação, usar um fluxo "verifica + cria" mais seguro. Como Firestore transactions são limitadas, podemos fazer o seguinte: depois de criar, logar o ID; se houver duplicata, remover a mais antiga.

**Código a substituir no `useUserSupportChat` (função initChat):**
```tsx
const initChat = async () => {
  try {
    // Verifica por userId exato (mais confiável que array-contains)
    const q = query(
      collection(db, 'supportChats'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Cria novo chat
      const docRef = await addDoc(collection(db, 'supportChats'), {
        userId,
        userName,
        userRole,
        participants: [userId, 'admin'],
        lastMessage: 'Conversa com suporte iniciada.',
        lastMessageAt: Timestamp.now(),
        unreadCount: 0,
        createdAt: Timestamp.now()
      });
      await addDoc(collection(db, `supportChats/${docRef.id}/messages`), {
        senderId: 'system',
        senderName: 'Sistema',
        text: 'Conversa com suporte iniciada.',
        createdAt: Timestamp.now()
      });
      setChatId(docRef.id);
    } else {
      // Se houver múltiplos (duplicatas), usar o mais recente e remover os antigos
      const sorted = snapshot.docs.sort(
        (a, b) => b.data().createdAt?.toDate?.() - a.data().createdAt?.toDate?.()
      );
      setChatId(sorted[0].id);
      // Remove duplicatas
      for (let i = 1; i < sorted.length; i++) {
        await deleteDoc(doc(db, 'supportChats', sorted[i].id));
      }
    }
  } catch (error) {
    console.error('Error initializing support chat:', error);
  } finally {
    setLoading(false);
  }
};
```
Precisa importar `deleteDoc` do firebase/firestore.

---

## C. Separação Cliente × Clínica (AdminChat.tsx)

**Arquivo:** `src/pages/admin/AdminChat.tsx`

**Problema:** Todos os chats aparecem misturados.

**Solução:** Adicionar um estado `chatFilter: 'all' | 'client' | 'clinic'` e dois botões/tabs no topo da sidebar. Filtrar `chats` por `userRole`.

**Alterações:**
1. Adicionar state: `const [chatFilter, setChatFilter] = useState<'all' | 'client' | 'clinic'>('all');`
2. Filtrar: `const filteredChats = chatFilter === 'all' ? chats : chats.filter(c => c.userRole === chatFilter);`
3. No JSX, substituir o cabeçalho "Conversas" por:
```tsx
<div className="p-3 border-bottom">
  <h5 className="font-serif fw-bold text-olive mb-2">Conversas</h5>
  <div className="d-flex gap-2">
    <Button
      size="sm"
      variant={chatFilter === 'all' ? 'olive' : 'outline-olive'}
      className="rounded-pill flex-fill"
      onClick={() => setChatFilter('all')}
    >
      Todas ({chats.length})
    </Button>
    <Button
      size="sm"
      variant={chatFilter === 'client' ? 'olive' : 'outline-olive'}
      className="rounded-pill flex-fill"
      onClick={() => setChatFilter('client')}
    >
      Clientes ({chats.filter(c => c.userRole === 'client').length})
    </Button>
    <Button
      size="sm"
      variant={chatFilter === 'clinic' ? 'olive' : 'outline-olive'}
      className="rounded-pill flex-fill"
      onClick={() => setChatFilter('clinic')}
    >
      Clínicas ({chats.filter(c => c.userRole === 'clinic').length})
    </Button>
  </div>
</div>
```
4. Mapear `filteredChats` em vez de `chats`.

---

## D. Destaque de conversas não lidas (AdminChat.tsx)

**Arquivo:** `src/pages/admin/AdminChat.tsx`

**Problema:** Sem destaque visual para chats com `unreadCount > 0`.

**Solução:** Adicionar classe condicional no `ListGroup.Item`:
```tsx
<ListGroup.Item
  key={chat.id}
  action
  active={activeChatId === chat.id}
  onClick={() => setActiveChatId(chat.id)}
  className={`border-0 py-3 ${(chat.unreadCount || 0) > 0 && activeChatId !== chat.id ? 'bg-warning bg-opacity-10 fw-bold' : ''}`}
>
```

---

## E. Notificações para mensagens do chat

**Arquivo:** `src/hooks/useAdminChat.ts`

**Problema:** Nenhum hook cria notificações quando uma mensagem é enviada.

**Solução:** Adicionar criação de notificação em ambos os hooks de envio:

### Em `useSendAdminMessage`:
Após o `updateDoc`, adicionar:
```tsx
// Notificar o usuário
try {
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
} catch (err) {
  console.error('Error creating notification:', err);
}
```
Precisa importar `getDoc` do firebase/firestore.

### Em `useSendUserSupportMessage`:
Após o `updateDoc`, adicionar:
```tsx
// Notificar admins (buscar todos os admins)
try {
  const adminSnapshot = await getDocs(
    query(collection(db, 'users'), where('role', '==', 'admin'))
  );
  const notifications = adminSnapshot.docs.map(admin => ({
    userId: admin.id,
    type: 'message' as const,
    title: `Nova mensagem de ${senderName}`,
    message: text,
    link: '/dashboard/admin/chat',
    read: false,
    createdAt: Timestamp.now()
  }));
  for (const notif of notifications) {
    await addDoc(collection(db, 'notifications'), notif);
  }
} catch (err) {
  console.error('Error creating admin notification:', err);
}
```

---

## Ordem de implementação sugerida

1. **A** (ClinicsList fallback) — impacto imediato, clínicas voltam a aparecer
2. **B** (dedup chat) — resolve duplicatas
3. **E** (notificações) — resolve direcionamento ao chat
4. **C** (separação abas) — melhoria visual
5. **D** (destaque não lidas) — melhoria visual

---

## Como testar após implementar

```bash
npm run build
```
Verificar 0 erros de TypeScript e build bem-sucedido.
