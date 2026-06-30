import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Spinner, Modal, Form, Tab, Tabs, Alert } from 'react-bootstrap';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useAppointmentsByClient, useCancelAppointment, useRescheduleAppointment } from '../hooks/useAppointments';
import { useClientReviews, useEditReview } from '../hooks/useClientReviews';
import { useFavoriteClinics } from '../hooks/useFavorites';
import { usePreferences, type ClientPreferences } from '../hooks/usePreferences';
import { useRecommendations } from '../hooks/useRecommendations';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { useClinicSchedule, generateTimeSlots } from '../hooks/useClinicSchedule';
import { formatDateBR } from '../utils/date';
import { PROCEDURES_LIST } from '../utils/constants';
import { ClinicCard } from '../components/ClinicCard';
import type { Appointment, CancellationPolicy } from '../types';

export const DashboardClient = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { appointments, loading: apptLoading } = useAppointmentsByClient(user?.uid || '');
  const { reviews, loading: revLoading } = useClientReviews(user?.uid || '');
  const { editReview, editing: editingReview } = useEditReview();
  const { clinics: favClinics, loading: favLoading } = useFavoriteClinics(user?.uid || '');
  const { preferences, loading: prefLoading, savePreferences } = usePreferences(user?.uid || '');
  const { clinics: recommendations, loading: recLoading } = useRecommendations(preferences);
  const { history: searchHistory, loading: histLoading } = useSearchHistory(user?.uid || '');
  const { cancelAppointment, cancelling } = useCancelAppointment();
  const { rescheduleAppointment, rescheduling } = useRescheduleAppointment();

  const [activeTab, setActiveTab] = useState('appointments');
  const [apptFilter, setApptFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  const [showPrefsModal, setShowPrefsModal] = useState(false);
  const [editPrefs, setEditPrefs] = useState<ClientPreferences>(preferences);
  const [saving, setSaving] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelApptId, setCancelApptId] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelPolicy, setCancelPolicy] = useState<CancellationPolicy | null>(null);
  const [cancelError, setCancelError] = useState('');

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [availSlots, setAvailSlots] = useState<string[]>([]);
  const { schedule } = useClinicSchedule(rescheduleAppt?.clinicId || '');

  const [showEditReviewModal, setShowEditReviewModal] = useState(false);
  const [editReviewTarget, setEditReviewTarget] = useState<{ clinicId: string; reviewId: string } | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [tomorrowAppts, setTomorrowAppts] = useState<Appointment[]>([]);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const upcoming = appointments.filter(a => {
      if (a.status !== 'confirmed' && a.status !== 'pending') return false;
      const d = a.date instanceof Date ? a.date : a.date?.toDate();
      if (!d) return false;
      return d.toISOString().split('T')[0] === tomorrowStr;
    });
    setTomorrowAppts(upcoming);
  }, [appointments]);

  useEffect(() => {
    if (!prefLoading) setEditPrefs(preferences);
  }, [preferences, prefLoading]);

  const filteredAppts = appointments.filter(a => {
    if (apptFilter === 'upcoming') return a.status === 'pending' || a.status === 'confirmed';
    if (apptFilter === 'completed') return a.status === 'completed';
    if (apptFilter === 'cancelled') return a.status === 'cancelled' || a.status === 'cancelled_by_client';
    return true;
  });

  const openCancelModal = async (appt: Appointment) => {
    setCancelApptId(appt.id);
    setCancelReason('');
    setCancelError('');
    try {
      const snap = await getDoc(doc(db, 'clinics', appt.clinicId));
      const policy = snap.data()?.cancellationPolicy;
      setCancelPolicy(policy || null);
    } catch {
      setCancelPolicy(null);
    }
    setShowCancelModal(true);
  };

  const handleCancel = async () => {
    if (!cancelPolicy?.allowCancellation) { setCancelError('Esta clínica não permite cancelamento.'); return; }
    const appt = appointments.find(a => a.id === cancelApptId);
    if (!appt) return;
    const apptDate = appt.date instanceof Date ? appt.date : appt.date?.toDate();
    if (apptDate) {
      const hoursDiff = (apptDate.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursDiff < cancelPolicy.minHoursBeforeCancel) {
        setCancelError(`Só é possível cancelar com até ${cancelPolicy.minHoursBeforeCancel}h de antecedência.`);
        return;
      }
    }
    const ok = await cancelAppointment(cancelApptId, cancelReason);
    if (ok) {
      setShowCancelModal(false);
      setSuccessMsg(cancelPolicy.chargeCancellationFee && cancelPolicy.cancellationFee > 0
        ? `Cancelado! Multa de R$ ${cancelPolicy.cancellationFee} aplicada.`
        : 'Agendamento cancelado com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const openRescheduleModal = async (appt: Appointment) => {
    setRescheduleAppt(appt);
    setNewDate('');
    setNewTime('');
    setAvailSlots([]);
    setShowRescheduleModal(true);
  };

  useEffect(() => {
    if (newDate && rescheduleAppt) {
      const dayOfWeek = new Date(newDate).getDay();
      if (!schedule.daysOfWeek.includes(dayOfWeek) || schedule.blockedDates.includes(new Date(newDate).toISOString().split('T')[0])) {
        setAvailSlots([]);
        return;
      }
      const slots = generateTimeSlots(schedule);
      setAvailSlots(slots);
    }
  }, [newDate, rescheduleAppt, schedule]);

  const handleReschedule = async () => {
    if (!rescheduleAppt || !newDate || !newTime) return;
    const ok = await rescheduleAppointment(rescheduleAppt.id, new Date(newDate), newTime);
    if (ok) {
      setShowRescheduleModal(false);
      setSuccessMsg('Agendamento reagendado com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const openEditReviewModal = (clinicId: string, reviewId: string, currentRating: number, currentComment: string) => {
    setEditReviewTarget({ clinicId, reviewId });
    setEditRating(currentRating);
    setEditComment(currentComment);
    setShowEditReviewModal(true);
  };

  const handleEditReview = async () => {
    if (!editReviewTarget) return;
    const ok = await editReview(editReviewTarget.clinicId, editReviewTarget.reviewId, { rating: editRating, comment: editComment });
    if (ok) {
      setShowEditReviewModal(false);
      setSuccessMsg('Avaliação atualizada!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

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

  if (apptLoading || revLoading || favLoading || prefLoading || histLoading) {
    return (
      <Container className="py-5 mt-5 text-center">
        <Spinner animation="border" className="text-olive" />
      </Container>
    );
  }

  const renderAppointments = () => (
    <>
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-olive text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '56px', height: '56px' }}>
              <i className="bi bi-person fs-3"></i>
            </div>
            <div className="flex-grow-1">
              <h5 className="fw-bold mb-0">{user?.displayName || 'Usuário'}</h5>
              <small className="text-muted">{appointments.length} agendamento{appointments.length !== 1 ? 's' : ''}</small>
            </div>
            <Button variant="gold" size="sm" className="rounded-pill" onClick={() => navigate('/clinics')}>
              <i className="bi bi-plus me-1"></i>Novo
            </Button>
          </div>
        </Card.Body>
      </Card>

      {successMsg && <Alert variant="success" className="rounded-4 mb-3" dismissible onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {tomorrowAppts.length > 0 && (
        <Alert variant="info" className="rounded-4 mb-3">
          <i className="bi bi-bell-fill me-2"></i>
          <strong>Lembrete!</strong> Você tem {tomorrowAppts.length} agendamento{tomorrowAppts.length > 1 ? 's' : ''} amanhã:
          {tomorrowAppts.map(a => (
            <span key={a.id} className="d-block ms-4 small">{a.procedure} às {a.time}</span>
          ))}
        </Alert>
      )}

      <div className="d-flex gap-2 mb-3 flex-wrap">
        {(['all', 'upcoming', 'completed', 'cancelled'] as const).map(f => (
          <Badge
            key={f}
            bg={apptFilter === f ? 'olive' : 'light'}
            text={apptFilter === f ? 'white' : 'dark'}
            className="rounded-pill px-3 py-2"
            style={{ cursor: 'pointer' }}
            onClick={() => setApptFilter(f)}
          >
            {f === 'all' ? 'Todos' : f === 'upcoming' ? 'Próximos' : f === 'completed' ? 'Concluídos' : 'Cancelados'}
          </Badge>
        ))}
      </div>

      {filteredAppts.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-5 text-center">
            <i className="bi bi-calendar-x text-muted fs-1 d-block mb-3"></i>
            <p className="text-muted">Nenhum agendamento encontrado.</p>
          </Card.Body>
        </Card>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filteredAppts.map(appt => {
            const apptDate = appt.date instanceof Date ? appt.date : appt.date?.toDate();
            const canCancel = appt.status === 'pending' || appt.status === 'confirmed';
            const canReschedule = appt.status === 'pending' || appt.status === 'confirmed';
            return (
              <Card key={appt.id} className="border-0 shadow-sm">
                <Card.Body className="p-3">
                  <Row className="align-items-center g-2">
                    <Col xs={3} md={2}>
                      <div className="bg-light rounded-3 d-flex align-items-center justify-content-center" style={{ height: '64px' }}>
                        <i className="bi bi-building text-olive fs-3"></i>
                      </div>
                    </Col>
                    <Col xs={5} md={6}>
                      <h6 className="fw-bold mb-1 text-truncate">{appt.procedure}</h6>
                      <small className="text-muted d-block text-truncate">
                        {appt.professionalName && <><i className="bi bi-person me-1"></i>{appt.professionalName}<br /></>}
                        <i className="bi bi-calendar me-1"></i>{apptDate ? formatDateBR(apptDate) : ''} às {appt.time}
                      </small>
                    </Col>
                    <Col xs={4} md={2} className="text-end">
                      <Badge
                        bg={appt.status === 'confirmed' ? 'success' : appt.status === 'completed' ? 'secondary' : appt.status === 'cancelled' || appt.status === 'cancelled_by_client' ? 'danger' : 'warning'}
                        className="rounded-pill"
                      >
                        {appt.status === 'confirmed' ? 'Confirmado' : appt.status === 'completed' ? 'Concluído' : appt.status === 'cancelled' || appt.status === 'cancelled_by_client' ? 'Cancelado' : 'Pendente'}
                      </Badge>
                    </Col>
                    <Col xs={12} md={2}>
                      <div className="d-flex gap-1 justify-content-end mt-2 mt-md-0">
                        {canCancel && (
                          <Button variant="outline-danger" size="sm" className="rounded-pill" onClick={() => openCancelModal(appt)}>
                            Cancelar
                          </Button>
                        )}
                        {canReschedule && (
                          <Button variant="outline-olive" size="sm" className="rounded-pill" onClick={() => openRescheduleModal(appt)}>
                            Remarcar
                          </Button>
                        )}
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );

  const renderReviews = () => (
    <>
      <h5 className="font-serif fw-bold text-olive mb-3">
        <i className="bi bi-star me-2"></i>Minhas Avaliações
      </h5>
      {reviews.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-5 text-center">
            <i className="bi bi-chat-square-text text-muted fs-1 d-block mb-3"></i>
            <p className="text-muted">Você ainda não avaliou nenhuma clínica.</p>
          </Card.Body>
        </Card>
      ) : (
        <div className="d-flex flex-column gap-3">
          {reviews.map(r => (
            <Card key={r.id} className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="fw-bold mb-1">{r.clinicName || 'Clínica'}</h6>
                    <div className="mb-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <i key={s} className={`bi bi-star${s <= r.rating ? '-fill' : ''} text-gold me-1 small`}></i>
                      ))}
                    </div>
                    {r.comment && <p className="text-muted small mb-0">{r.comment}</p>}
                    <small className="text-muted">{formatDateBR(r.createdAt)}</small>
                  </div>
                  <Button variant="outline-olive" size="sm" className="rounded-pill" onClick={() => openEditReviewModal(r.clinicId, r.id, r.rating, r.comment)}>
                    <i className="bi bi-pencil"></i>
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </>
  );

  const renderFavorites = () => (
    <>
      <h5 className="font-serif fw-bold text-olive mb-3">
        <i className="bi bi-heart me-2"></i>Clínicas Favoritas
      </h5>
      {favClinics.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-5 text-center">
            <i className="bi bi-heartbreak text-muted fs-1 d-block mb-3"></i>
            <p className="text-muted">Nenhuma clínica favoritada ainda.</p>
            <Button variant="olive" className="rounded-pill" onClick={() => navigate('/clinics')}>Explorar Clínicas</Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row className="g-3">
            {favClinics.map(c => (
              <Col md={6} key={c.id}>
                <ClinicCard clinic={c} />
              </Col>
            ))}
          </Row>
          {recommendations.length > 0 && (
            <div className="mt-4">
              <h6 className="fw-bold text-olive mb-3">
                <i className="bi bi-star me-2"></i>Recomendados para você
              </h6>
              <Row className="g-3">
                {recommendations.slice(0, 3).map(c => (
                  <Col md={4} key={c.id}>
                    <ClinicCard clinic={c} />
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </>
      )}
    </>
  );

  const renderHistory = () => {
    const completed = appointments.filter(a => a.status === 'completed');
    return (
      <>
        <h5 className="font-serif fw-bold text-olive mb-3">
          <i className="bi bi-clock-history me-2"></i>Histórico de Procedimentos
        </h5>
        {completed.length === 0 ? (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-5 text-center">
              <i className="bi bi-journal text-muted fs-1 d-block mb-3"></i>
              <p className="text-muted">Nenhum procedimento concluído ainda.</p>
            </Card.Body>
          </Card>
        ) : (
          <div className="position-relative mb-4">
            {completed.map((appt, idx) => {
              const apptDate = appt.date instanceof Date ? appt.date : appt.date?.toDate();
              return (
                <div key={appt.id} className="d-flex gap-3 mb-3">
                  <div className="d-flex flex-column align-items-center">
                    <div className="bg-olive text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', minWidth: '36px' }}>
                      <i className="bi bi-check2 fs-6"></i>
                    </div>
                    {idx < completed.length - 1 && <div className="flex-grow-1" style={{ width: '2px', backgroundColor: '#3A5A40', minHeight: '20px' }}></div>}
                  </div>
                  <Card className="flex-grow-1 border-0 shadow-sm">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between">
                        <div>
                          <h6 className="fw-bold mb-1">{appt.procedure}</h6>
                          <small className="text-muted d-block">
                            {apptDate ? formatDateBR(apptDate) : ''} às {appt.time}
                          </small>
                          {appt.professionalName && <small className="text-muted">Profissional: {appt.professionalName}</small>}
                          {appt.valor && <small className="text-muted d-block">Valor: R$ {appt.valor}</small>}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {searchHistory.length > 0 && (
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <h6 className="fw-bold text-olive mb-3">
                <i className="bi bi-search me-2"></i>Buscas Recentes
              </h6>
              {searchHistory.slice(0, 5).map((entry, idx) => (
                <div key={idx} className="d-flex align-items-center gap-2 py-1">
                  <i className="bi bi-clock text-muted small"></i>
                  <small className="text-muted">{entry.filters.procedure || entry.term || 'Busca geral'}{entry.filters.location ? ` - ${entry.filters.location}` : ''}</small>
                </div>
              ))}
            </Card.Body>
          </Card>
        )}
      </>
    );
  };

  return (
    <Container className="py-5 mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="font-serif fw-bold text-olive mb-0">Meu Painel</h2>
        <div className="d-flex gap-2">
          <Button variant="outline-olive" size="sm" className="rounded-pill" onClick={() => navigate('/support-chat')}>
            <i className="bi bi-headset me-1"></i>Suporte
          </Button>
          <Button variant="outline-olive" size="sm" className="rounded-pill" onClick={() => navigate('/dashboard/client/profile')}>
            <i className="bi bi-person-gear me-1"></i>Perfil
          </Button>
          <Button variant="outline-olive" size="sm" className="rounded-pill" onClick={openPrefsModal}>
            <i className="bi bi-sliders me-1"></i>Preferências
          </Button>
        </div>
      </div>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'appointments')} className="mb-4">
        <Tab eventKey="appointments" title={`Agendamentos (${appointments.length})`}>
          <div className="mt-3">{renderAppointments()}</div>
        </Tab>
        <Tab eventKey="reviews" title={`Avaliações (${reviews.length})`}>
          <div className="mt-3">{renderReviews()}</div>
        </Tab>
        <Tab eventKey="favorites" title={`Favoritos (${favClinics.length})`}>
          <div className="mt-3">{renderFavorites()}</div>
        </Tab>
        <Tab eventKey="history" title="Histórico">
          <div className="mt-3">{renderHistory()}</div>
        </Tab>
      </Tabs>

      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-serif text-olive">Cancelar Agendamento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {cancelError && <Alert variant="danger" className="rounded-4 py-2">{cancelError}</Alert>}
          {cancelPolicy && !cancelPolicy.allowCancellation ? (
            <p className="text-muted">Esta clínica não permite cancelamento pelo cliente.</p>
          ) : (
            <>
              {cancelPolicy && cancelPolicy.chargeCancellationFee && cancelPolicy.cancellationFee > 0 && (
                <Alert variant="warning" className="rounded-4 py-2">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Multa de R$ {cancelPolicy.cancellationFee} será aplicada.
                </Alert>
              )}
              <Form.Group>
                <Form.Label className="fw-medium">Motivo (opcional)</Form.Label>
                <Form.Control as="textarea" rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="rounded-4" placeholder="Por que deseja cancelar?" />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" className="rounded-pill" onClick={() => setShowCancelModal(false)}>Voltar</Button>
          <Button variant="danger" className="rounded-pill" onClick={handleCancel} disabled={cancelling || !cancelPolicy?.allowCancellation}>
            {cancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showRescheduleModal} onHide={() => setShowRescheduleModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-serif text-olive">Remarcar Agendamento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Nova Data</Form.Label>
            <Form.Control type="date" className="rounded-pill" value={newDate} onChange={e => { setNewDate(e.target.value); setNewTime(''); }} />
          </Form.Group>
          {newDate && (
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Novo Horário</Form.Label>
              <div className="d-flex gap-2 flex-wrap">
                {availSlots.length === 0 ? (
                  <small className="text-muted">Nenhum horário disponível nesta data.</small>
                ) : (
                  availSlots.map(slot => (
                    <Badge
                      key={slot}
                      bg={newTime === slot ? 'olive' : 'light'}
                      text={newTime === slot ? 'white' : 'dark'}
                      className="rounded-pill px-3 py-2"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setNewTime(slot)}
                    >
                      {slot}
                    </Badge>
                  ))
                )}
              </div>
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" className="rounded-pill" onClick={() => setShowRescheduleModal(false)}>Voltar</Button>
          <Button variant="olive" className="rounded-pill" onClick={handleReschedule} disabled={rescheduling || !newDate || !newTime}>
            {rescheduling ? 'Remarcando...' : 'Confirmar Remarcação'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditReviewModal} onHide={() => setShowEditReviewModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-serif text-olive">Editar Avaliação</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Nota</Form.Label>
            <div className="d-flex gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <i
                  key={s}
                  className={`bi bi-star${s <= editRating ? '-fill' : ''} text-gold fs-3`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setEditRating(s)}
                ></i>
              ))}
            </div>
          </Form.Group>
          <Form.Group>
            <Form.Label className="fw-medium">Comentário</Form.Label>
            <Form.Control as="textarea" rows={3} value={editComment} onChange={e => setEditComment(e.target.value)} className="rounded-4" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" className="rounded-pill" onClick={() => setShowEditReviewModal(false)}>Cancelar</Button>
          <Button variant="olive" className="rounded-pill" onClick={handleEditReview} disabled={editingReview}>
            {editingReview ? 'Salvando...' : 'Salvar'}
          </Button>
        </Modal.Footer>
      </Modal>

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
                    onClick={() => setEditPrefs(prev => ({
                      ...prev,
                      procedures: prev.procedures.includes(proc)
                        ? prev.procedures.filter(p => p !== proc)
                        : [...prev.procedures, proc]
                    }))}
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
                    onClick={() => setEditPrefs(prev => ({
                      ...prev,
                      cities: prev.cities.includes(city)
                        ? prev.cities.filter(c => c !== city)
                        : [...prev.cities, city]
                    }))}
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
              <Form.Select value={editPrefs.minRating} onChange={(e) => setEditPrefs(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))} className="rounded-pill">
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
