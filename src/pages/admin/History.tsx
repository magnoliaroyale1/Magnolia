import { useState, useEffect } from 'react';
import { Container, Card, Table, Spinner, Form, Row, Col } from 'react-bootstrap';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { formatDateBR } from '../../utils/date';
import type { Appointment } from '../../types';

export const AdminHistory = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db, 'appointments'), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        setAppointments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = appointments.filter(a =>
    !filter || a.status === filter || a.clientName?.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" className="text-olive" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h4 className="font-serif fw-bold text-olive mb-4">
        <i className="bi bi-clock-history me-2"></i>Histórico de Agendamentos
      </h4>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-pill">
                <option value="">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="confirmed">Confirmado</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Table hover responsive className="mb-0">
          <thead className="bg-olive text-white">
            <tr>
              <th className="px-3">Data</th>
              <th>Cliente</th>
              <th>Procedimento</th>
              <th>Status</th>
              <th className="text-end px-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">Nenhum agendamento encontrado.</td>
              </tr>
            ) : (
              filtered.map(a => (
                <tr key={a.id}>
                  <td className="px-3">{formatDateBR(a.date)}</td>
                  <td>{a.clientName}</td>
                  <td>{a.procedure}</td>
                  <td>
                    <span className={`badge rounded-pill ${a.status === 'confirmed' ? 'bg-success' : a.status === 'cancelled' ? 'bg-danger' : a.status === 'completed' ? 'bg-olive' : 'bg-warning'}`}>
                      {a.status === 'pending' ? 'Pendente' : a.status === 'confirmed' ? 'Confirmado' : a.status === 'completed' ? 'Concluído' : 'Cancelado'}
                    </span>
                  </td>
                  <td className="text-end px-3">{a.valor ? `R$ ${a.valor.toFixed(2)}` : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </Container>
  );
};
