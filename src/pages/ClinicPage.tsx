import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Form, Tab, Tabs, Alert, Spinner, Modal } from 'react-bootstrap';
import { StarRating } from '../components/StarRating';
import { useClinicProfile } from '../hooks/useClinicProfile';
import { useReviews, useSubmitReview, useCheckCanReview } from '../hooks/useReviews';
import { formatDateBR } from '../utils/date';
import { useCreateAppointment } from '../hooks/useAppointments';
import { useCreateChat } from '../hooks/useChat';
import { useFavorites } from '../hooks/useFavorites';
import { useSubmitReport } from '../hooks/useReports';
import { useUploadClinicImages } from '../hooks/useUploadImage';
import { useAuth } from '../context/AuthContext';
import { useProfessionalsByClinic } from '../hooks/useProfessionals';
import { useBlogPosts } from '../hooks/useBlogPosts';
import { ProfessionalCard } from '../components/ProfessionalCard';
import { TimeSlotPicker } from '../components/TimeSlotPicker';
import { Helmet } from 'react-helmet-async';
import { SEO } from '../components/SEO';

export const ClinicPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clinic, loading } = useClinicProfile(id || '');
  const { reviews, loading: reviewsLoading } = useReviews(id || '');
  const { submitReview, submitting } = useSubmitReview();
  const { checkCanReview } = useCheckCanReview();
  const { uploadClinicImage } = useUploadClinicImages();
  const { createAppointment, creating } = useCreateAppointment();
  const { createChat } = useCreateChat();
  const { toggleFavorite, isFavorite } = useFavorites(user?.uid || '');
  const { submitReport, submitting: reporting } = useSubmitReport();

  const [activeTab, setActiveTab] = useState('about');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [reviewBlockReason, setReviewBlockReason] = useState('');
  const [reviewChecked, setReviewChecked] = useState(false);
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (user?.role === 'client' && id) {
      checkCanReview(id, user.uid).then(result => {
        setCanReview(result.canReview);
        setReviewBlockReason(result.reason);
        setReviewChecked(true);
      });
    }
  }, [user, id]);

  const { professionals, loading: profLoading } = useProfessionalsByClinic(id || '');
  const { posts: blogPosts, loading: blogLoading } = useBlogPosts(id || '');
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState<{ id: string; name: string } | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [appointmentSuccess, setAppointmentSuccess] = useState(false);
  const [appointmentBlocked, setAppointmentBlocked] = useState(false);
  const [reviewProfFilter, setReviewProfFilter] = useState('');
  const [reviewProfessionalId, setReviewProfessionalId] = useState('');

  const profsForProcedure = selectedProcedure
    ? professionals.filter(p => p.procedures.includes(selectedProcedure))
    : [];

  const filteredReviews = reviewProfFilter
    ? reviews.filter(r => r.professionalId === reviewProfFilter)
    : reviews;

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  const [chatLoading, setChatLoading] = useState(false);

  if (loading) {
    return (
      <Container className="py-5 mt-5 text-center">
        <Spinner animation="border" className="text-olive" />
      </Container>
    );
  }

  if (!clinic) {
    return (
      <Container className="py-5 mt-5">
        <Alert variant="warning" className="rounded-4">Clínica não encontrada.</Alert>
      </Container>
    );
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) return;
    const success = await submitReview(id!, user.uid, user.displayName, rating, comment, reviewPhotos, reviewProfessionalId || undefined);
    if (success) {
      setReviewSuccess(true);
      setRating(0);
      setComment('');
      setReviewPhotos([]);
      setReviewProfessionalId('');
      setTimeout(() => setReviewSuccess(false), 3000);
    }
  };

  const handleReviewPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadClinicImage(file, `reviews/${id}/${user?.uid}`);
    if (url) {
      setReviewPhotos(prev => [...prev, url]);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'client' || !selectedProcedure || !appointmentDate || !selectedProfessional) {
      if (user && user.role !== 'client') setAppointmentBlocked(true);
      return;
    }
    const success = await createAppointment({
      clinicId: id!,
      professionalId: selectedProfessional.id,
      professionalName: selectedProfessional.name,
      clientId: user.uid,
      clientName: user.displayName,
      procedure: selectedProcedure,
      date: new Date(appointmentDate),
      time: appointmentTime,
      status: 'pending'
    });
    if (success) {
      setAppointmentSuccess(true);
      setSelectedProcedure('');
      setSelectedProfessional(null);
      setAppointmentDate('');
      setAppointmentTime('09:00');
      setTimeout(() => setAppointmentSuccess(false), 3000);
    }
  };

  const handleChat = async () => {
    if (!user) { navigate('/login'); return; }
    setChatLoading(true);
    const chatId = await createChat(user.uid, id!, user.displayName, clinic.name);
    if (chatId) navigate(`/chat?chatId=${chatId}`);
    setChatLoading(false);
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reportReason) return;
    const success = await submitReport(id!, user.uid, reportReason, reportDescription);
    if (success) {
      setReportSuccess(true);
      setReportReason('');
      setReportDescription('');
      setTimeout(() => { setReportSuccess(false); setShowReportModal(false); }, 2000);
    }
  };

  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) * 10) / 10
    : clinic.rating || 0;

  const schemaOrg = clinic ? {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: clinic.name,
    description: clinic.description,
    image: clinic.images?.[0],
    address: clinic.address ? {
      '@type': 'PostalAddress',
      streetAddress: clinic.address.street,
      addressLocality: clinic.address.city,
      addressRegion: clinic.address.state,
      postalCode: clinic.address.zipCode
    } : undefined,
    aggregateRating: clinic.reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: clinic.rating,
      reviewCount: clinic.reviewCount
    } : undefined,
    priceRange: '$$'
  } : null;

  return (
    <Container className="py-5 mt-5">
      <SEO
        title={clinic?.name || 'Clínica'}
        description={clinic?.description?.slice(0, 160) || 'Clínica parceira Magnolia Royale'}
        image={clinic?.images?.[0]}
        url={`https://magnoliaroyale.com.br/clinic/${id}`}
      />
      {schemaOrg && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(schemaOrg)}</script>
        </Helmet>
      )}
      <Row>
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <div className="position-relative">
              <Card.Img
                src={clinic.images?.[0] || 'https://via.placeholder.com/800x400'}
                style={{ height: '400px', objectFit: 'cover' }}
              />
              {clinic.verified && (
                <Badge className="position-absolute top-0 end-0 m-3 badge-verified rounded-pill px-3 py-2 fs-6">
                  <i className="bi bi-patch-check-fill me-2"></i>
                  Clínica Verificada
                </Badge>
              )}
              {user?.role === 'client' && (
                <Button
                  variant={isFavorite(id!) ? 'gold' : 'light'}
                  className="position-absolute top-0 start-0 m-3 rounded-circle p-2"
                  onClick={() => toggleFavorite(id!)}
                  title={isFavorite(id!) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <i className={`bi ${isFavorite(id!) ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                </Button>
              )}
            </div>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h1 className="font-serif fw-bold text-olive" title={clinic.name}>{clinic.name}</h1>
                  <p className="text-muted mb-0">
                    <i className="bi bi-geo-alt-fill me-2"></i>
                    {clinic.address?.street}, {clinic.address?.number} - {clinic.address?.city}, {clinic.address?.state}
                  </p>
                </div>
                <div className="text-end">
                  <h3 className="font-serif fw-bold text-gold mb-0">{avgRating}</h3>
                  <StarRating rating={Math.round(avgRating)} />
                  <small className="text-muted">{reviews.length || clinic.reviewCount} avaliações</small>
                </div>
              </div>

              <div className="d-flex gap-2 mb-4 flex-wrap">
                {(clinic.procedures || []).map((proc, idx) => (
                  <Badge key={idx} bg="light" text="dark" className="px-3 py-2 border rounded-pill">
                    {proc}
                  </Badge>
                ))}
              </div>

              <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-4">
                <div className="flex-grow-1">
                  <small className="text-muted">Score de Confiança</small>
                  <div className="progress mt-1">
                    <div className="progress-bar" style={{ width: `${Math.min(clinic.score || 0, 100)}%` }}></div>
                  </div>
                </div>
                <span className="fw-bold text-olive fs-4">{clinic.score || 0}</span>
              </div>

              <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'about')} className="mb-4">
                <Tab eventKey="about" title="Sobre">
                  <p className="mt-3">{clinic.description}</p>
                </Tab>
                <Tab eventKey="reviews" title={`Avaliações (${reviews.length || clinic.reviewCount})`}>
                  <div className="mt-3">
                    {reviewSuccess && (
                      <Alert variant="success" className="rounded-4">Avaliação enviada com sucesso!</Alert>
                    )}
                    {user?.role === 'client' && reviewChecked ? (
                      canReview ? (
                        <Form onSubmit={handleSubmitReview}>
                          <h5 className="font-serif mb-3">Deixe sua avaliação</h5>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-medium">Avaliar</Form.Label>
                            <Form.Select className="rounded-pill" value={reviewProfessionalId} onChange={e => setReviewProfessionalId(e.target.value)}>
                              <option value="">A clínica (geral)</option>
                              {professionals.map(p => (
                                <option key={p.id} value={p.uid}>{p.name}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-medium">Sua nota</Form.Label>
                            <StarRating rating={rating} interactive onRate={setRating} size="lg" />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-medium">Comentário</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              className="rounded-4"
                              placeholder="Conte sua experiência..."
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-medium">Fotos antes/depois (opcional)</Form.Label>
                            <div className="d-flex gap-2 flex-wrap mb-2">
                              {reviewPhotos.map((photo, idx) => (
                                <img key={idx} src={photo} className="rounded-3" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                              ))}
                            </div>
                            <Form.Control type="file" accept="image/*" onChange={handleReviewPhotoUpload} className="rounded-pill" />
                          </Form.Group>
                          <Button variant="olive" type="submit" className="rounded-pill" disabled={submitting || rating === 0}>
                            {submitting ? 'Enviando...' : 'Enviar Avaliação'}
                          </Button>
                        </Form>
                      ) : (
                        <Alert variant="info" className="rounded-4">
                          <i className="bi bi-info-circle me-2"></i>
                          {reviewBlockReason || 'Você ainda não pode avaliar esta clínica.'}
                        </Alert>
                      )
                    ) : user ? (
                      <p className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>Apenas clientes com agendamento concluído podem avaliar.
                      </p>
                    ) : (
                      <p className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>Apenas clientes com agendamento concluído podem avaliar.
                      </p>
                    )}
                    <hr />
                    {professionals.length > 0 && (
                      <div className="d-flex gap-2 flex-wrap mb-3">
                        <Badge
                          bg={!reviewProfFilter ? 'olive' : 'light'}
                          text={!reviewProfFilter ? 'white' : 'dark'}
                          className="rounded-pill px-3 py-2"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setReviewProfFilter('')}
                        >
                          Todos
                        </Badge>
                        {professionals.map(p => (
                          <Badge
                            key={p.id}
                            bg={reviewProfFilter === p.uid ? 'olive' : 'light'}
                            text={reviewProfFilter === p.uid ? 'white' : 'dark'}
                            className="rounded-pill px-3 py-2"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setReviewProfFilter(p.uid)}
                          >
                            {p.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {reviewsLoading ? (
                      <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
                    ) : filteredReviews.length === 0 ? (
                      <p className="text-muted">Nenhuma avaliação ainda.</p>
                    ) : (
                      filteredReviews.map(review => (
                        <div key={review.id} className="mb-4 pb-3 border-bottom">
                          <div className="d-flex justify-content-between">
                            <div>
                              <strong>{review.clientName}</strong>
                              {review.professionalId && professionals.find(p => p.uid === review.professionalId) && (
                                <small className="text-muted ms-2">
                                  → {professionals.find(p => p.uid === review.professionalId)?.name}
                                </small>
                              )}
                              <StarRating rating={review.rating} size="sm" />
                            </div>
                            <small className="text-muted">{formatDateBR(review.createdAt)}</small>
                          </div>
                          {review.comment && <p className="mt-2 mb-0">{review.comment}</p>}
                          {(review as any).images?.length > 0 && (
                            <div className="d-flex gap-2 mt-2">
                              {(review as any).images.map((img: string, idx: number) => (
                                <img key={idx} src={img} className="rounded-3" style={{ width: '80px', height: '60px', objectFit: 'cover' }} />
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </Tab>
                <Tab eventKey="profissionais" title="Profissionais">
                  <div className="mt-3">
                    {profLoading ? (
                      <Spinner animation="border" size="sm" className="text-olive" />
                    ) : professionals.length === 0 ? (
                      <p className="text-muted">Nenhum profissional cadastrado.</p>
                    ) : (
                      <Row className="g-3">
                        {professionals.map(p => (
                          <Col md={6} key={p.id}>
                            <Card className="border-0 shadow-sm h-100">
                              <Card.Body className="p-4">
                                <div className="d-flex align-items-center gap-3 mb-3">
                                  <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                                    <i className="bi bi-person-fill fs-2 text-olive"></i>
                                  </div>
                                  <div>
                                    <h6 className="fw-bold mb-1">{p.name}</h6>
                                    <small className="text-muted">{p.procedures.join(', ')}</small>
                                  </div>
                                </div>
                                {p.bio && <p className="small text-muted mb-3">{p.bio}</p>}
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </div>
                </Tab>
                <Tab eventKey="portfolio" title="Portfólio">
                  <Row className="g-3 mt-2">
                    {(clinic.images?.length ? clinic.images : [1, 2, 3, 4]).length > 0 ? (
                      (clinic.images?.length ? clinic.images : [1, 2, 3, 4]).map((img, idx) => (
                        <Col md={6} key={idx}>
                          <img
                            src={typeof img === 'string' ? img : `https://via.placeholder.com/400x300`}
                            className="rounded-3 w-100"
                            style={{ height: '250px', objectFit: 'cover' }}
                            alt="Portfolio"
                          />
                        </Col>
                      ))
                    ) : (
                      <p className="text-muted">Nenhuma imagem no portfólio ainda.</p>
                    )}
                  </Row>
                </Tab>
                <Tab eventKey="blog" title={`Blog (${blogPosts.length})`}>
                  <div className="mt-3">
                    {blogLoading ? (
                      <Spinner animation="border" size="sm" className="text-olive" />
                    ) : blogPosts.length === 0 ? (
                      <p className="text-muted">Nenhum post publicado ainda.</p>
                    ) : (
                      <Row className="g-3">
                        {blogPosts.map(post => (
                          <Col md={6} key={post.id}>
                            <Card className="border-0 shadow-sm h-100">
                              <Card.Img
                                src={post.image || 'https://via.placeholder.com/600x400'}
                                style={{ height: '200px', objectFit: 'cover' }}
                              />
                              <Card.Body className="p-4">
                                {post.category && (
                                  <Badge bg="light" text="dark" className="mb-2">{post.category}</Badge>
                                )}
                                <h6 className="font-serif fw-bold text-olive mb-2">{post.title}</h6>
                                <p className="text-muted small mb-3">{post.excerpt}</p>
                                <div className="d-flex justify-content-between align-items-center">
                                  <small className="text-muted">
                                    <i className="bi bi-clock me-1"></i>{post.readTime} min
                                  </small>
                                  <small className="text-muted">{formatDateBR(post.createdAt)}</small>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm sticky-top" style={{ top: '100px' }}>
            <Card.Body className="p-4">
              <h5 className="font-serif fw-bold text-olive mb-3">Agendar Consulta</h5>
              {appointmentSuccess && (
                <Alert variant="success" className="rounded-4 py-2">Solicitação enviada!</Alert>
              )}
              {appointmentBlocked && (
                <Alert variant="warning" className="rounded-4 py-2" dismissible onClose={() => setAppointmentBlocked(false)}>
                  <i className="bi bi-exclamation-triangle me-2"></i>Apenas clientes podem agendar.
                </Alert>
              )}
              <Form onSubmit={handleSchedule}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Procedimento</Form.Label>
                  <Form.Select
                    className="rounded-pill"
                    value={selectedProcedure}
                    onChange={(e) => { setSelectedProcedure(e.target.value); setSelectedProfessional(null); setAppointmentDate(''); }}
                    required
                  >
                    <option value="">Selecione...</option>
                    {(clinic.procedures || []).map(p => <option key={p} value={p}>{p}</option>)}
                  </Form.Select>
                </Form.Group>

                {selectedProcedure && (
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">Profissional</Form.Label>
                    {profLoading ? (
                      <Spinner animation="border" size="sm" className="text-olive" />
                    ) : profsForProcedure.length === 0 ? (
                      <small className="text-muted">Nenhum profissional disponível para este procedimento.</small>
                    ) : (
                      profsForProcedure.map(p => (
                        <ProfessionalCard
                          key={p.id}
                          professional={p}
                          selected={selectedProfessional?.id === p.id}
                          onSelect={() => setSelectedProfessional({ id: p.id, name: p.name })}
                        />
                      ))
                    )}
                  </Form.Group>
                )}

                {selectedProfessional && (
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">Data</Form.Label>
                    <Form.Control
                      type="date"
                      className="rounded-pill"
                      value={appointmentDate}
                      onChange={(e) => { setAppointmentDate(e.target.value); setAppointmentTime(''); }}
                      required
                    />
                  </Form.Group>
                )}

                {selectedProfessional && appointmentDate && (
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">Horário</Form.Label>
                    <TimeSlotPicker
                      clinicId={id!}
                      professionalId={selectedProfessional.id}
                      date={appointmentDate}
                      selectedTime={appointmentTime}
                      onSelectTime={setAppointmentTime}
                    />
                  </Form.Group>
                )}

                <Button
                  variant="gold"
                  type="submit"
                  className="w-100 rounded-pill py-2"
                  disabled={creating || !user || user.role !== 'client' || !selectedProfessional || !appointmentTime}
                >
                  <i className="bi bi-calendar-check me-2"></i>
                  {creating ? 'Solicitando...' : 'Solicitar Agendamento'}
                </Button>
                {!user && (
                  <small className="text-muted d-block text-center mt-2">
                    <a href="/login" className="text-gold">Faça login</a> para agendar
                  </small>
                )}
                {user && user.role !== 'client' && (
                  <small className="text-muted d-block text-center mt-2">
                    <i className="bi bi-info-circle me-1"></i>Apenas clientes podem agendar.
                  </small>
                )}
              </Form>

              <hr className="my-4" />

              <Button
                variant="outline-olive"
                className="w-100 rounded-pill"
                onClick={handleChat}
                disabled={chatLoading}
              >
                <i className="bi bi-chat-dots me-2"></i>
                {chatLoading ? 'Abrindo...' : 'Conversar com Clínica'}
              </Button>

              {clinic?.cancellationPolicy && (
                <div className="mt-3 p-3 bg-light rounded-3">
                  <h6 className="fw-bold small text-olive mb-2">
                    <i className="bi bi-info-circle me-1"></i>Regras de Cancelamento
                  </h6>
                  {clinic.cancellationPolicy.allowCancellation ? (
                    <small className="text-muted d-block">
                      Cancelamento permitido até {clinic.cancellationPolicy.minHoursBeforeCancel}h antes.
                    </small>
                  ) : (
                    <small className="text-muted d-block">Cancelamento não permitido.</small>
                  )}
                  {clinic.cancellationPolicy.chargeCancellationFee && clinic.cancellationPolicy.cancellationFee > 0 && (
                    <small className="text-muted d-block">
                      Multa de R$ {clinic.cancellationPolicy.cancellationFee} em caso de cancelamento fora do prazo.
                    </small>
                  )}
                  {clinic.cancellationPolicy.allowRescheduling ? (
                    <small className="text-muted d-block">
                      Remarcação permitida até {clinic.cancellationPolicy.minHoursBeforeReschedule}h antes.
                    </small>
                  ) : (
                    <small className="text-muted d-block">Remarcação não permitida.</small>
                  )}
                </div>
              )}

              <div className="mt-3">
                <Button
                  variant="link"
                  className="text-muted small text-decoration-none p-0"
                  onClick={() => setShowReportModal(true)}
                >
                  <i className="bi bi-flag me-1"></i>
                  Denunciar esta clínica
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-serif text-olive">Denunciar Clínica</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleReport}>
          <Modal.Body>
            {reportSuccess && <Alert variant="success" className="rounded-4">Denúncia enviada com sucesso!</Alert>}
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Motivo</Form.Label>
              <Form.Select value={reportReason} onChange={(e) => setReportReason(e.target.value)} required>
                <option value="">Selecione...</option>
                <option value="Irregularidades">Irregularidades</option>
                <option value="Problemas em procedimentos">Problemas em procedimentos</option>
                <option value="Falta de higiene">Falta de higiene</option>
                <option value="Publicidade enganosa">Publicidade enganosa</option>
                <option value="Outro">Outro</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Descrição</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="rounded-4"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" className="rounded-pill" onClick={() => setShowReportModal(false)}>Cancelar</Button>
            <Button variant="danger" className="rounded-pill" type="submit" disabled={reporting}>
              {reporting ? 'Enviando...' : 'Enviar Denúncia'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};
