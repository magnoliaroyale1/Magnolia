import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, ListGroup, Spinner } from 'react-bootstrap';
import { useAdminSupportChats, useAdminSupportMessages, useSendAdminMessage } from '../../hooks/useAdminChat';
import { formatTimeBR } from '../../utils/date';

type ChatFilter = 'all' | 'client' | 'clinic';

export const AdminChat = () => {
  const { chats, loading } = useAdminSupportChats();
  const [chatFilter, setChatFilter] = useState<ChatFilter>('all');
  const [activeChatId, setActiveChatId] = useState<string>('');
  const { messages, loading: messagesLoading } = useAdminSupportMessages(activeChatId);
  const { sendMessage } = useSendAdminMessage();
  const [newMessage, setNewMessage] = useState('');

  const filteredChats = chatFilter === 'all'
    ? chats
    : chats.filter(c => c.userRole === chatFilter);

  const activeChat = chats.find(c => c.id === activeChatId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId) return;
    const ok = await sendMessage(activeChatId, newMessage);
    if (ok) setNewMessage('');
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" className="text-olive" />
      </Container>
    );
  }

  const counts = {
    all: chats.length,
    client: chats.filter(c => c.userRole === 'client').length,
    clinic: chats.filter(c => c.userRole === 'clinic').length,
  };

  return (
    <Card className="border-0 shadow-sm" style={{ height: '70vh' }}>
      <Row className="g-0 h-100">
        <Col md={4} className="border-end d-flex flex-column">
          <div className="p-3 border-bottom">
            <h5 className="font-serif fw-bold text-olive mb-2">Conversas</h5>
            <div className="d-flex gap-2">
              {(['all', 'client', 'clinic'] as ChatFilter[]).map(f => (
                <Button
                  key={f}
                  size="sm"
                  variant={chatFilter === f ? 'olive' : 'outline-olive'}
                  className="rounded-pill flex-fill"
                  onClick={() => setChatFilter(f)}
                >
                  {f === 'all' ? 'Todas' : f === 'client' ? 'Clientes' : 'Clínicas'} ({counts[f]})
                </Button>
              ))}
            </div>
          </div>
          {filteredChats.length === 0 ? (
            <div className="p-4 text-center text-muted">
              <i className="bi bi-chat-dots fs-1 d-block mb-2"></i>
              Nenhuma conversa ainda.
            </div>
          ) : (
            <ListGroup variant="flush" className="overflow-auto flex-grow-1">
              {filteredChats.map(chat => (
                <ListGroup.Item
                  key={chat.id}
                  action
                  active={activeChatId === chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`border-0 py-3 ${(chat.unreadCount || 0) > 0 && activeChatId !== chat.id ? 'bg-warning bg-opacity-10 fw-bold' : ''}`}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="overflow-hidden">
                      <h6 className={`mb-1 text-truncate ${(chat.unreadCount || 0) > 0 && activeChatId !== chat.id ? 'fw-bold' : ''}`} style={{ maxWidth: '160px' }}>
                        {chat.userName}
                      </h6>
                      <small className={`text-truncate d-block ${(chat.unreadCount || 0) > 0 && activeChatId !== chat.id ? 'fw-bold text-dark' : 'text-muted'}`} style={{ maxWidth: '160px' }}>
                        {chat.lastMessage || 'Nenhuma mensagem'}
                      </small>
                      <small className="text-muted">
                        {chat.userRole === 'clinic' ? 'Clínica' : 'Cliente'}
                      </small>
                    </div>
                    <div className="text-end flex-shrink-0 ms-2">
                      <small className="text-muted d-block">{formatTimeBR(chat.lastMessageAt)}</small>
                      {(chat.unreadCount || 0) > 0 && (
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
                <h6 className="fw-bold mb-0">
                  {activeChat.userName}
                  <small className="text-muted ms-2 fw-normal">
                    ({activeChat.userRole === 'clinic' ? 'Clínica' : 'Cliente'})
                  </small>
                </h6>
              </div>

              <div className="flex-grow-1 p-4 overflow-auto bg-light">
                {messagesLoading ? (
                  <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>
                ) : messages.length === 0 ? (
                  <p className="text-muted text-center">Nenhuma mensagem ainda.</p>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`d-flex mb-3 ${msg.senderId === 'admin' ? 'justify-content-end' : ''}`}>
                      <div
                        className={`p-3 rounded-4 ${msg.senderId === 'admin' ? 'bg-olive text-white' : msg.senderId === 'system' ? 'bg-light text-muted' : 'bg-white shadow-sm'}`}
                        style={{ maxWidth: '70%' }}
                      >
                        {msg.senderId === 'system' && <small className="d-block">{msg.text}</small>}
                        {msg.senderId !== 'system' && <p className="mb-1" style={{ overflowWrap: 'break-word' }}>{msg.text}</p>}
                        <small className={msg.senderId === 'admin' ? 'opacity-75' : 'text-muted'}>
                          {msg.createdAt?.toDate?.().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || ''}
                          {msg.senderId !== 'admin' && msg.senderId !== 'system' && ` - ${msg.senderName}`}
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
                    placeholder="Digite sua resposta..."
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
                Selecione uma conversa
              </div>
            </div>
          )}
        </Col>
      </Row>
    </Card>
  );
};
