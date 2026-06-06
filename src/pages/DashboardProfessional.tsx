import { useState } from 'react';
import { Container, Row, Col, Card, ListGroup, Badge, Button, Spinner, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfessional } from '../hooks/useProfessionals';
import { useUpdateProfessional } from '../hooks/useProfessionals';
import { useAppointmentsByProfessional } from '../hooks/useAppointments';
import { useProfessionalPortfolio, useAddPortfolioItem, useDeletePortfolioItem } from '../hooks/useProfessionalPortfolio';
import { useUploadClinicImages } from '../hooks/useUploadImage';
import { formatDateBR } from '../utils/date';
import { PROCEDURES_LIST } from '../utils/constants';

export const DashboardProfessional = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { professional, loading: profLoading } = useProfessional(user?.uid || '');
  const { appointments, loading: apptLoading } = useAppointmentsByProfessional(user?.uid || '');
  const { updateProfessional } = useUpdateProfessional();
  const { portfolio, loading: portLoading, refetch: refetchPort } = useProfessionalPortfolio(user?.uid || '');
  const { addItem, adding } = useAddPortfolioItem();
  const { deleteItem } = useDeletePortfolioItem();
  const { uploadClinicImage } = useUploadClinicImages();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editProcedures, setEditProcedures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [showPortModal, setShowPortModal] = useState(false);
  const [portImage, setPortImage] = useState('');
  const [portProcedure, setPortProcedure] = useState('');
  const [portDescription, setPortDescription] = useState('');
  const [uploadingPort, setUploadingPort] = useState(false);

  const openEditModal = () => {
    setEditBio(professional?.bio || '');
    setEditProcedures(professional?.procedures || []);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!professional?.id) return;
    setSaving(true);
    const ok = await updateProfessional(professional.id, { bio: editBio, procedures: editProcedures });
    setSaving(false);
    if (ok) setShowEditModal(false);
  };

  if (profLoading) {
    return (
      <Container className="py-5 mt-5 text-center">
        <Spinner animation="border" className="text-olive" />
      </Container>
    );
  }

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;

  return (
    <Container className="py-5 mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="font-serif fw-bold text-olive">
            <i className="bi bi-person-badge me-2"></i>
            {professional?.name || user?.displayName || 'Painel Profissional'}
          </h2>
          <p className="text-muted mb-0">
            {professional?.bio?.substring(0, 80)}...
            {professional?.procedures?.length ? ` • ${professional.procedures.join(', ')}` : ''}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-olive" size="sm" className="rounded-pill" onClick={openEditModal}>
            <i className="bi bi-pencil me-1"></i>Editar Perfil
          </Button>
          <Button variant="outline-olive" size="sm" className="rounded-pill" onClick={() => navigate('/support-chat')}>
            <i className="bi bi-headset me-1"></i>Suporte
          </Button>
        </div>
      </div>

      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="p-4">
              <i className="bi bi-calendar-check text-gold fs-1 mb-2"></i>
              <h3 className="font-serif fw-bold text-olive">{appointments.length}</h3>
              <p className="text-muted mb-0">Total</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="p-4">
              <i className="bi bi-clock text-gold fs-1 mb-2"></i>
              <h3 className="font-serif fw-bold text-olive">{pendingCount + confirmedCount}</h3>
              <p className="text-muted mb-0">Pendentes/Confirmados</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="p-4">
              <i className="bi bi-check-circle text-gold fs-1 mb-2"></i>
              <h3 className="font-serif fw-bold text-olive">{completedCount}</h3>
              <p className="text-muted mb-0">Concluídos</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="p-4">
              <i className="bi bi-star text-gold fs-1 mb-2"></i>
              <h3 className="font-serif fw-bold text-olive">-</h3>
              <p className="text-muted mb-0">Avaliação</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="font-serif fw-bold text-olive mb-0">Meu Portfólio</h5>
            <Button variant="olive" size="sm" className="rounded-pill" onClick={() => setShowPortModal(true)}>
              <i className="bi bi-plus"></i> Adicionar
            </Button>
          </div>
          {portLoading ? (
            <Spinner animation="border" size="sm" className="text-olive" />
          ) : portfolio.length === 0 ? (
            <small className="text-muted">Nenhuma foto no portfólio.</small>
          ) : (
            <Row className="g-2">
              {portfolio.map(item => (
                <Col md={3} key={item.id} className="position-relative">
                  <img src={item.imageUrl} className="rounded-3 w-100" style={{ height: '120px', objectFit: 'cover' }} />
                  <Button
                    variant="danger"
                    size="sm"
                    className="position-absolute top-0 end-0 m-1 rounded-circle"
                    onClick={async () => { await deleteItem(user?.uid || '', item.id); refetchPort(); }}
                  >
                    <i className="bi bi-x"></i>
                  </Button>
                  <small className="d-block text-muted text-truncate">{item.procedure} - {item.description}</small>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 pt-4 px-4">
          <h5 className="font-serif fw-bold text-olive mb-0">Meus Agendamentos</h5>
        </Card.Header>
        <Card.Body className="p-4">
          {apptLoading ? (
            <div className="text-center py-4"><Spinner animation="border" size="sm" className="text-olive" /></div>
          ) : appointments.length === 0 ? (
            <p className="text-muted mb-0">Nenhum agendamento ainda.</p>
          ) : (
            <ListGroup variant="flush">
              {appointments.map(appt => (
                <ListGroup.Item key={appt.id} className="px-0 py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1 fw-bold">{appt.clientName} - {appt.procedure}</h6>
                      <small className="text-muted">
                        {formatDateBR(appt.date)} às {appt.time}
                        {appt.valor ? ` | R$ ${appt.valor.toFixed(2)}` : ''}
                      </small>
                      <Badge
                        bg={appt.status === 'confirmed' ? 'success' : appt.status === 'completed' ? 'secondary' : appt.status === 'cancelled' ? 'danger' : 'warning'}
                        className="ms-2 rounded-pill"
                      >
                        {appt.status === 'confirmed' ? 'Confirmado' : appt.status === 'completed' ? 'Concluído' : appt.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      <Modal show={showPortModal} onHide={() => setShowPortModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-serif text-olive">Adicionar ao Portfólio</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Foto</Form.Label>
              <Form.Control type="file" accept="image/*" className="rounded-pill" onChange={async (e: any) => {
                const file = e.target.files?.[0];
                if (!file || !user) return;
                setUploadingPort(true);
                const url = await uploadClinicImage(file, `portfolio/${user.uid}`);
                if (url) setPortImage(url);
                setUploadingPort(false);
              }} disabled={uploadingPort} />
              {portImage && <img src={portImage} className="rounded-3 mt-2" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Procedimento</Form.Label>
              <Form.Select value={portProcedure} onChange={e => setPortProcedure(e.target.value)} className="rounded-pill">
                <option value="">Selecione...</option>
                {PROCEDURES_LIST.map(p => <option key={p} value={p}>{p}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Descrição</Form.Label>
              <Form.Control as="textarea" rows={2} value={portDescription} onChange={e => setPortDescription(e.target.value)} className="rounded-4" />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" className="rounded-pill" onClick={() => setShowPortModal(false)}>Cancelar</Button>
          <Button variant="olive" className="rounded-pill" disabled={!portImage || !portProcedure || adding} onClick={async () => {
            if (!user) return;
            await addItem(user.uid, { imageUrl: portImage, procedure: portProcedure, description: portDescription });
            setShowPortModal(false);
            setPortImage('');
            setPortProcedure('');
            setPortDescription('');
            refetchPort();
          }}>
            {adding ? 'Salvando...' : 'Salvar'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-serif text-olive">Editar Perfil</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Bio</Form.Label>
              <Form.Control as="textarea" rows={4} value={editBio} onChange={e => setEditBio(e.target.value)} className="rounded-4" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Procedimentos</Form.Label>
              <div className="d-flex gap-2 flex-wrap">
                {PROCEDURES_LIST.map(proc => (
                  <Badge
                    key={proc}
                    bg={editProcedures.includes(proc) ? 'olive' : 'light'}
                    text={editProcedures.includes(proc) ? 'white' : 'dark'}
                    className="rounded-pill px-3 py-2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setEditProcedures(prev =>
                      prev.includes(proc) ? prev.filter(p => p !== proc) : [...prev, proc]
                    )}
                  >
                    {proc}
                  </Badge>
                ))}
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" className="rounded-pill" onClick={() => setShowEditModal(false)}>Cancelar</Button>
          <Button variant="olive" className="rounded-pill" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};
