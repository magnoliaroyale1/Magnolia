import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, ListGroup, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useChats, useMessages, useSendMessage, useMarkAsRead } from '../hooks/useChat';
import { formatTimeBR } from '../utils/date';

export const Chat = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { chats, loading: chatsLoading } = useChats(user?.uid || '');
  const [activeChatId, setActiveChatId] = useState(searchParams.get('chatId') || '');
  const { messages, loading: messagesLoading } = useMessages(activeChatId);
  const { sendMessage } = useSendMessage();
  const { markAsRead } = useMarkAsRead();
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (searchParams.get('chatId')) {
      setActiveChatId(searchParams.get('chatId')!);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeChatId && user) {
      markAsRead(activeChatId, user.uid);
    }
  }, [activeChatId, user]);

  const activeChat = chats.find(c => c.id === activeChatId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !user) return;
    const success = await sendMessage(activeChatId, user.uid, newMessage);
    if (success) setNewMessage('');
  };

  if (chatsLoading) {
    return (
      <Container className="py-5 mt-5 text-center">
        <Spinner animation="border" className="text-olive" />
      </Container>
    );
  }

  return (
    <Container className="py-5 mt-5">
      <Card className="border-0 shadow-sm" style={{ height: '70vh' }}>
        <Row className="g-0 h-100">
          <Col md={4} className="border-end">
            <div className="p-3 border-bottom">
              <h5 className="font-serif fw-bold text-olive mb-0">Conversas</h5>
            </div>
            {chats.length === 0 ? (
              <div className="p-4 text-center text-muted">
                <i className="bi bi-chat-dots fs-1 d-block mb-2"></i>
                Nenhuma conversa ainda.
              </div>
            ) : (
              <ListGroup variant="flush" className="overflow-auto" style={{ height: 'calc(70vh - 60px)' }}>
                {chats.map(chat => (
                  <ListGroup.Item
                    key={chat.id}
                    action
                    active={activeChatId === chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className="border-0 py-3"
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1 fw-bold text-truncate" style={{ maxWidth: '160px' }}>
                          {user?.role === 'client' ? chat.clinicName : chat.clientName}
                        </h6>
                        <small className="text-muted text-truncate d-block" style={{ maxWidth: '150px' }}>
                          {chat.lastMessage || 'Clique para conversar'}
                        </small>
                      </div>
                      <div className="text-end">
                        <small className="text-muted d-block">
                          {formatTimeBR(chat.lastMessageAt)}
                        </small>
                        {(chat.unreadCount || 0) > 0 && activeChatId !== chat.id && (
                          <span className="badge bg-olive rounded-pill">{chat.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Col>

          <Col md={8} className="d-flex flex-column">
            {activeChat ? (
              <>
                <div className="p-3 border-bottom bg-white">
                  <h6 className="fw-bold mb-0 text-truncate">
                    {user?.role === 'client' ? activeChat.clinicName : activeChat.clientName}
                  </h6>
                </div>

                <div className="flex-grow-1 p-4 overflow-auto bg-light" style={{ height: 'calc(70vh - 130px)' }}>
                  {messagesLoading ? (
                    <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>
                  ) : messages.length === 0 ? (
                    <p className="text-muted text-center">Nenhuma mensagem ainda. Envie uma mensagem!</p>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className={`d-flex mb-3 ${msg.senderId === user?.uid ? 'justify-content-end' : ''}`}>
                        <div
                          className={`p-3 rounded-4 ${msg.senderId === user?.uid ? 'bg-olive text-white' : 'bg-white shadow-sm'}`}
                          style={{ maxWidth: '70%' }}
                        >
                          <p className="mb-1" style={{ overflowWrap: 'break-word' }}>{msg.text}</p>
                          <small className={msg.senderId === user?.uid ? 'opacity-75' : 'text-muted'}>
                            {formatTimeBR(msg.createdAt)}
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
              </>
            ) : (
              <div className="d-flex align-items-center justify-content-center h-100 bg-light">
                <div className="text-center text-muted">
                  <i className="bi bi-chat-dots fs-1 d-block mb-3"></i>
                  <p>Selecione uma conversa para começar</p>
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Card>
    </Container>
  );
};
