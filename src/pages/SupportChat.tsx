import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useUserSupportChat, useUserSupportMessages, useSendUserSupportMessage } from '../hooks/useAdminChat';

export const SupportChat = () => {
  const { user } = useAuth();
  const userRole = user?.role === 'clinic' ? 'clinic' : 'client';
  const { chatId, loading: chatLoading } = useUserSupportChat(user?.uid || '', user?.displayName || '', userRole);
  const { messages, loading: msgLoading } = useUserSupportMessages(chatId);
  const { sendMessage } = useSendUserSupportMessage();
  const [newMessage, setNewMessage] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !user) return;
    const ok = await sendMessage(chatId, user.uid, user.displayName, newMessage);
    if (ok) setNewMessage('');
  };

  if (chatLoading) {
    return (
      <Container className="py-5 mt-5 text-center">
        <Spinner animation="border" className="text-olive" />
      </Container>
    );
  }

  return (
    <Container className="py-5 mt-5">
      <h4 className="font-serif fw-bold text-olive mb-4">
        <i className="bi bi-headset me-2"></i>Falar com Suporte
      </h4>
      <Card className="border-0 shadow-sm" style={{ height: '60vh' }}>
        <Card.Body className="p-0 d-flex flex-column">
          <div className="p-3 border-bottom bg-light">
            <h6 className="fw-bold mb-0">Suporte Magnolia Royale</h6>
            <small className="text-muted">Respondemos em horário comercial</small>
          </div>

          <div className="flex-grow-1 p-4 overflow-auto bg-light">
            {msgLoading ? (
              <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>
            ) : messages.length === 0 ? (
              <p className="text-muted text-center">Envie sua mensagem. Responderemos em breve!</p>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`d-flex mb-3 ${msg.senderId === user?.uid ? 'justify-content-end' : ''}`}>
                  <div
                    className={`p-3 rounded-4 ${msg.senderId === user?.uid ? 'bg-olive text-white' : msg.senderId === 'system' ? 'bg-light text-muted' : 'bg-white shadow-sm'}`}
                    style={{ maxWidth: '70%' }}
                  >
                    {msg.senderId === 'system' && <small className="d-block">{msg.text}</small>}
                    {msg.senderId !== 'system' && <p className="mb-1" style={{ overflowWrap: 'break-word' }}>{msg.text}</p>}
                    <small className={msg.senderId === user?.uid ? 'opacity-75' : 'text-muted'}>
                      {msg.createdAt?.toDate?.().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || ''}
                      {msg.senderId !== user?.uid && msg.senderId !== 'system' ? ` - ${msg.senderName}` : ''}
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-top bg-white">
            <Form className="d-flex gap-2" onSubmit={handleSend}>
              <Form.Control
                type="text"
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="rounded-pill"
              />
              <Button variant="olive" type="submit" className="rounded-pill px-4" disabled={!newMessage.trim()}>
                <i className="bi bi-send"></i>
              </Button>
            </Form>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};
