import { useState } from 'react';
import { Container, Card, Row, Col, Button, Form, Badge, Spinner, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClinicClients } from '../hooks/useClinicClients';
import { formatDateBR } from '../utils/date';

export const ClinicCRM = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const clinicId = user?.clinicId || user?.uid || '';
  const { clients, loading } = useClinicClients(clinicId);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container className="py-5 mt-5">
      <div className="d-flex align-items-center mb-4">
        <Button variant="link" className="p-0 me-3 text-decoration-none" onClick={() => navigate('/dashboard/clinic')}>
          <i className="bi bi-arrow-left fs-5"></i>
        </Button>
        <div>
          <h3 className="font-serif fw-bold text-olive mb-0">Clientes</h3>
          <small className="text-muted">{clients.length} cliente{clients.length !== 1 ? 's' : ''} encontrado{clients.length !== 1 ? 's' : ''}</small>
        </div>
      </div>

      <Form.Control
        type="text"
        placeholder="Buscar por nome ou email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="rounded-pill mb-4"
      />

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" className="text-olive" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-people text-muted fs-1 d-block mb-3"></i>
          <p className="text-muted">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filtered.map(client => (
            <Card
              key={client.clientId}
              className="border-0 shadow-sm"
              style={{ cursor: 'pointer' }}
              onClick={() => setExpanded(expanded === client.clientId ? null : client.clientId)}
            >
              <Card.Body className="p-4">
                <Row className="align-items-center">
                  <Col md={4}>
                    <h6 className="fw-bold mb-1">{client.name}</h6>
                    <small className="text-muted">{client.email}</small>
                  </Col>
                  <Col md={2} className="text-center">
                    <span className="fw-bold text-olive">{client.totalVisits}</span>
                    <small className="d-block text-muted">visitas</small>
                  </Col>
                  <Col md={2} className="text-center">
                    <span className="fw-bold text-olive">R$ {client.totalSpent.toFixed(0)}</span>
                    <small className="d-block text-muted">total gasto</small>
                  </Col>
                  <Col md={2} className="text-center">
                    <small className="text-muted d-block">Última visita</small>
                    <small className="fw-bold">{client.lastVisit ? formatDateBR(client.lastVisit) : '-'}</small>
                  </Col>
                  <Col md={2} className="text-end">
                    <i className={`bi bi-chevron-${expanded === client.clientId ? 'up' : 'down'} text-gold`}></i>
                  </Col>
                </Row>
                {client.procedures.length > 0 && (
                  <div className="mt-2 d-flex gap-1 flex-wrap">
                    {client.procedures.map(p => (
                      <Badge key={p} bg="light" text="dark" className="rounded-pill">{p}</Badge>
                    ))}
                  </div>
                )}

                {expanded === client.clientId && (
                  <div className="mt-3 pt-3 border-top">
                    <h6 className="fw-bold mb-3">Histórico de Agendamentos</h6>
                    <Table size="sm" className="mb-0">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Horário</th>
                          <th>Procedimento</th>
                          <th>Profissional</th>
                          <th>Status</th>
                          <th>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {client.appointments.map(appt => (
                          <tr key={appt.id}>
                            <td>{formatDateBR(appt.date)}</td>
                            <td>{appt.time}</td>
                            <td>{appt.procedure}</td>
                            <td>{appt.professionalName || '-'}</td>
                            <td>
                              <Badge
                                bg={appt.status === 'completed' ? 'success' : appt.status === 'confirmed' ? 'olive' : appt.status === 'cancelled' ? 'danger' : 'warning'}
                                className="rounded-pill"
                              >
                                {appt.status === 'completed' ? 'Concluído' : appt.status === 'confirmed' ? 'Confirmado' : appt.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                              </Badge>
                            </td>
                            <td>{appt.valor ? `R$ ${appt.valor}` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
};
