import { useState } from 'react';
import { Card, ListGroup, Badge, Button, Row, Col, Form, Spinner } from 'react-bootstrap';
import { useAppointmentsByClinic, useUpdateAppointmentStatus } from '../hooks/useAppointments';
import { useProfessionalsByClinic } from '../hooks/useProfessionals';
import { formatDateBR } from '../utils/date';
import type { Appointment } from '../types';

interface DayScheduleProps {
  clinicId: string;
}

export const DaySchedule = ({ clinicId }: DayScheduleProps) => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedProf, setSelectedProf] = useState('');
  const { appointments, loading } = useAppointmentsByClinic(clinicId);
  const { professionals } = useProfessionalsByClinic(clinicId);
  const { updateStatus } = useUpdateAppointmentStatus();

  const dayAppointments = appointments.filter(a => {
    const aDate = a.date instanceof Date ? a.date : a.date?.toDate?.() || new Date();
    const aDateStr = aDate.toISOString().split('T')[0];
    const matchesDate = aDateStr === selectedDate;
    const matchesProf = !selectedProf || a.professionalId === selectedProf;
    return matchesDate && matchesProf;
  }).sort((a, b) => a.time.localeCompare(b.time));

  const changeDay = (delta: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleStatus = async (id: string, status: Appointment['status']) => {
    await updateStatus(id, status);
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body className="p-4">
        <Row className="g-3 mb-4">
          <Col md={6}>
            <div className="d-flex align-items-center gap-2">
              <Button variant="outline-olive" size="sm" className="rounded-pill" onClick={() => changeDay(-1)}>
                <i className="bi bi-chevron-left"></i>
              </Button>
              <Form.Control
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="rounded-pill text-center"
                style={{ maxWidth: '200px' }}
              />
              <Button variant="outline-olive" size="sm" className="rounded-pill" onClick={() => changeDay(1)}>
                <i className="bi bi-chevron-right"></i>
              </Button>
            </div>
          </Col>
          <Col md={4}>
            <Form.Select
              value={selectedProf}
              onChange={e => setSelectedProf(e.target.value)}
              className="rounded-pill"
            >
              <option value="">Todos os profissionais</option>
              {professionals.map(p => (
                <option key={p.id} value={p.uid}>{p.name}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2} className="text-end">
            <small className="text-muted">{dayAppointments.length} agendamento(s)</small>
          </Col>
        </Row>

        {loading ? (
          <div className="text-center py-4"><Spinner animation="border" size="sm" className="text-olive" /></div>
        ) : dayAppointments.length === 0 ? (
          <p className="text-muted text-center py-4 mb-0">Nenhum agendamento para esta data.</p>
        ) : (
          <ListGroup variant="flush">
            {dayAppointments.map(appt => (
              <ListGroup.Item key={appt.id} className="px-0 py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-light rounded-4 p-2 text-center" style={{ minWidth: '60px' }}>
                      <strong className="d-block text-olive">{appt.time}</strong>
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">{appt.clientName}</h6>
                      <small className="text-muted">
                        {appt.procedure}
                        {appt.professionalName ? ` • ${appt.professionalName}` : ''}
                      </small>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Badge
                      bg={appt.status === 'confirmed' ? 'success' : appt.status === 'completed' ? 'secondary' : appt.status === 'cancelled' ? 'danger' : 'warning'}
                      className="rounded-pill"
                    >
                      {appt.status === 'confirmed' ? 'Confirmado' : appt.status === 'completed' ? 'Concluído' : appt.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                    </Badge>
                    {appt.status === 'pending' && (
                      <>
                        <Button variant="outline-success" size="sm" className="rounded-pill" onClick={() => handleStatus(appt.id, 'confirmed')}>
                          Aceitar
                        </Button>
                        <Button variant="outline-danger" size="sm" className="rounded-pill" onClick={() => handleStatus(appt.id, 'cancelled')}>
                          Recusar
                        </Button>
                      </>
                    )}
                    {appt.status === 'confirmed' && (
                      <Button variant="outline-secondary" size="sm" className="rounded-pill" onClick={() => handleStatus(appt.id, 'completed')}>
                        Concluir
                      </Button>
                    )}
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
};
