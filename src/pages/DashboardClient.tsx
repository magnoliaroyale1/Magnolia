import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, ListGroup, Badge, Button, Spinner, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useAppointmentsByClient } from '../hooks/useAppointments';
import { useFavoriteClinics } from '../hooks/useFavorites';
import { usePreferences, type ClientPreferences } from '../hooks/usePreferences';
import { useRecommendations } from '../hooks/useRecommendations';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { formatDateBR } from '../utils/date';
import { PROCEDURES_LIST } from '../utils/constants';
import { ClinicCard } from '../components/ClinicCard';

export const DashboardClient = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { appointments, loading: apptLoading } = useAppointmentsByClient(user?.uid || '');
  const { clinics: favClinics, loading: favLoading } = useFavoriteClinics(user?.uid || '');
  const { preferences, loading: prefLoading, savePreferences } = usePreferences(user?.uid || '');
  const { clinics: recommendations, loading: recLoading } = useRecommendations(preferences);
  const { history: searchHistory, loading: histLoading } = useSearchHistory(user?.uid || '');

  const [showPrefsModal, setShowPrefsModal] = useState(false);
  const [editPrefs, setEditPrefs] = useState<ClientPreferences>(preferences);
  const [saving, setSaving] = useState(false);

  const openPrefsModal = () => {
    setEditPrefs(preferences);
    setShowPrefsModal(true);
  };

  const handleSavePrefs = async () => {
    setSaving(true);
    await savePreferences(editPrefs);
    setSaving(false);
    setShowPrefsModal(false);
  };

  const togglePrefProcedure = (proc: string) => {
    setEditPrefs(prev => ({
      ...prev,
      procedures: prev.procedures.includes(proc)
        ? prev.procedures.filter(p => p !== proc)
        : [...prev.procedures, proc]
    }));
  };

  const togglePrefCity = (city: string) => {
    setEditPrefs(prev => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter(c => c !== city)
        : [...prev.cities, city]
    }));
  };

  if (apptLoading || favLoading || prefLoading || histLoading) {
    return (
      <Container className="py-5 mt-5 text-center">
        <Spinner animation="border" className="text-olive" />
      </Container>
    );
  }

  return (
    <Container className="py-5 mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="font-serif fw-bold text-olive mb-0">Meu Painel</h2>
        <div className="d-flex gap-2">
          <Button variant="outline-olive" size="sm" className="rounded-pill" onClick={() => navigate('/support-chat')}>
            <i className="bi bi-headset me-1"></i>Suporte
          </Button>
          <Button variant="outline-olive" size="sm" className="rounded-pill" onClick={openPrefsModal}>
            <i className="bi bi-sliders me-1"></i>Preferências
          </Button>
        </div>
      </div>

      <Row className="g-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4 text-center">
              <div className="bg-olive text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-person fs-1"></i>
              </div>
              <h5 className="font-serif fw-bold text-truncate">{user?.displayName || 'Usuário'}</h5>
              <p className="text-muted mb-3">
                Cliente desde {formatDateBR(user?.createdAt) || '2025'}
              </p>
              <Badge bg="light" text="dark" className="rounded-pill px-3">
                <i className="bi bi-star-fill text-gold me-1"></i>
                {appointments.length} agendamentos
              </Badge>
              {preferences.procedures.length > 0 && (
                <div className="mt-3">
                  <small className="text-muted d-block mb-1">Interesses:</small>
                  <div className="d-flex gap-1 flex-wrap justify-content-center">
                    {preferences.procedures.map(p => (
                      <Badge key={p} bg="olive" className="rounded-pill">{p}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pt-4 px-4">
              <h5 className="font-serif fw-bold text-olive mb-0">Próximos Agendamentos</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {appointments.length === 0 ? (
                <p className="text-muted">Nenhum agendamento ainda.</p>
              ) : (
                <ListGroup variant="flush">
                  {appointments.map(app => (
                    <ListGroup.Item key={app.id} className="px-0 py-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="fw-bold mb-1 text-truncate">{app.procedure}</h6>
                          {app.professionalName && <small className="text-muted">{app.professionalName}</small>}
                          <p className="text-muted mb-0 small">
                            {formatDateBR(app.date)} às {app.time}
                          </p>
                        </div>
                        <Badge
                          bg={app.status === 'confirmed' ? 'success' : app.status === 'completed' ? 'secondary' : app.status === 'cancelled' ? 'danger' : 'warning'}
                          className="rounded-pill"
                        >
                          {app.status === 'confirmed' ? 'Confirmado' : app.status === 'completed' ? 'Concluído' : app.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                        </Badge>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
              <Button
                variant="outline-olive"
                className="w-100 rounded-pill mt-3"
                onClick={() => navigate('/clinics')}
              >
                <i className="bi bi-plus-lg me-2"></i>Novo Agendamento
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recomendações */}
      {!recLoading && recommendations.length > 0 && (
        <div className="mt-4">
          <h5 className="font-serif fw-bold text-olive mb-3">
            <i className="bi bi-star me-2"></i>Recomendados para você
          </h5>
          <Row className="g-3">
            {recommendations.slice(0, 3).map(clinic => (
              <Col md={4} key={clinic.id}>
                <ClinicCard clinic={clinic} />
              </Col>
            ))}
          </Row>
        </div>
      )}

      <Row className="g-4 mt-2">
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <h5 className="font-serif fw-bold text-olive mb-3">
                <i className="bi bi-heart me-2"></i>Favoritos
              </h5>
              {favClinics.length === 0 ? (
                <p className="text-muted mb-3">Nenhuma clínica favoritada</p>
              ) : (
                <ListGroup variant="flush" className="mb-3">
                  {favClinics.slice(0, 3).map(c => (
                    <ListGroup.Item key={c.id} className="px-0 py-2 border-0">
                      <span
                        className="text-decoration-none text-olive fw-medium text-truncate d-inline-block"
                        style={{ cursor: 'pointer', maxWidth: '100%' }}
                        onClick={() => navigate(`/clinic/${c.id}`)}
                      >
                        {c.name}
                      </span>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
              <Button variant="outline-olive" className="rounded-pill w-100" onClick={() => navigate('/clinics')}>
                Explorar Clínicas
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <h5 className="font-serif fw-bold text-olive mb-3">
                <i className="bi bi-clock-history me-2"></i>Histórico de Buscas
              </h5>
              {searchHistory.length === 0 ? (
                <p className="text-muted mb-3">Nenhuma busca recente.</p>
              ) : (
                <ListGroup variant="flush" className="mb-3">
                  {searchHistory.slice(0, 5).map((entry, idx) => (
                    <ListGroup.Item key={idx} className="px-0 py-2 border-0">
                      <i className="bi bi-search text-muted me-2"></i>
                      <span className="text-muted text-truncate d-inline-block" style={{ maxWidth: '250px' }}>
                        {entry.filters.procedure || entry.term || 'Busca geral'}
                        {entry.filters.location ? ` - ${entry.filters.location}` : ''}
                      </span>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
              <Button variant="outline-olive" className="rounded-pill w-100" onClick={() => navigate('/clinics')}>
                <i className="bi bi-search me-1"></i>Buscar Clínicas
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de Preferências */}
      <Modal show={showPrefsModal} onHide={() => setShowPrefsModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-serif text-olive">Minhas Preferências</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Procedimentos de interesse</Form.Label>
              <div className="d-flex gap-2 flex-wrap">
                {PROCEDURES_LIST.map(proc => (
                  <Badge
                    key={proc}
                    bg={editPrefs.procedures.includes(proc) ? 'olive' : 'light'}
                    text={editPrefs.procedures.includes(proc) ? 'white' : 'dark'}
                    className="rounded-pill px-3 py-2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => togglePrefProcedure(proc)}
                  >
                    {proc}
                  </Badge>
                ))}
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Cidades de interesse</Form.Label>
              <div className="d-flex gap-2 flex-wrap">
                {['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Salvador', 'Brasília'].map(city => (
                  <Badge
                    key={city}
                    bg={editPrefs.cities.includes(city) ? 'olive' : 'light'}
                    text={editPrefs.cities.includes(city) ? 'white' : 'dark'}
                    className="rounded-pill px-3 py-2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => togglePrefCity(city)}
                  >
                    {city}
                  </Badge>
                ))}
              </div>
            </Form.Group>
            <Form.Check
              type="switch"
              label="Mostrar apenas clínicas verificadas"
              checked={editPrefs.verifiedOnly}
              onChange={(e) => setEditPrefs(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
              className="mb-3"
            />
            <Form.Group>
              <Form.Label className="fw-medium">Avaliação mínima</Form.Label>
              <Form.Select
                value={editPrefs.minRating}
                onChange={(e) => setEditPrefs(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
                className="rounded-pill"
              >
                <option value={0}>Qualquer</option>
                <option value={4}>4+ estrelas</option>
                <option value={4.5}>4.5+ estrelas</option>
                <option value={5}>5 estrelas</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" className="rounded-pill" onClick={() => setShowPrefsModal(false)}>Cancelar</Button>
          <Button variant="olive" className="rounded-pill" onClick={handleSavePrefs} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Preferências'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};
