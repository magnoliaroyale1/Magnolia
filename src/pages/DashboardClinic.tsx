import { useState } from 'react';
import { Card, Row, Col, Container, ListGroup, Badge, Button, ProgressBar, Spinner, Modal, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClinicProfile } from '../hooks/useClinicProfile';
import { useAppointmentsByClinic, usePendingAppointments, useUpdateAppointmentStatus } from '../hooks/useAppointments';
import { formatDateBR } from '../utils/date';
import { useUploadClinicImages } from '../hooks/useUploadImage';
import { PROCEDURES_LIST, PLANS } from '../utils/constants';
import { UpgradeModal } from '../components/UpgradeModal';
import { useProfessionalsByClinic, useCreateProfessional, useUpdateProfessional, useDeleteProfessional } from '../hooks/useProfessionals';
import { useClinicBlogPosts, useCreateBlogPost, useUpdateBlogPost, useDeleteBlogPost } from '../hooks/useClinicBlog';
import { useClinicSchedule, useUpdateSchedule, generateTimeSlots } from '../hooks/useClinicSchedule';
import { DaySchedule } from '../components/DaySchedule';
import { BlogPostModal } from '../components/BlogPostModal';
import type { Appointment, ClinicSchedule } from '../types';

export const DashboardClinic = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const clinicId = user?.clinicId || user?.uid || '';
  const { clinic, loading: clinicLoading, updateClinic, addImage, removeImage } = useClinicProfile(clinicId);
  const { appointments, loading: apptLoading } = useAppointmentsByClinic(clinicId);
  const { appointments: pendingAppts, loading: pendingLoading } = usePendingAppointments(clinicId);
  const { updateStatus } = useUpdateAppointmentStatus();
  const { uploadClinicImage, uploading } = useUploadClinicImages();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editProcedures, setEditProcedures] = useState<string[]>([]);
  const [editSuccess, setEditSuccess] = useState(false);
  const { professionals, loading: profLoading, refetch: refetchProfs } = useProfessionalsByClinic(clinicId);
  const { createProfessional, creating } = useCreateProfessional();
  const { updateProfessional, updating } = useUpdateProfessional();
  const { deleteProfessional } = useDeleteProfessional();
  const { schedule } = useClinicSchedule(clinicId);
  const { updateSchedule } = useUpdateSchedule();
  const { posts: blogPosts, loading: blogLoading, refetch: refetchBlog } = useClinicBlogPosts(clinicId);
  const { createPost, creating: creatingPost } = useCreateBlogPost();
  const { updatePost, updating: updatingPost } = useUpdateBlogPost();
  const { deletePost } = useDeleteBlogPost();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [planUpgraded, setPlanUpgraded] = useState(false);

  const [showProfModal, setShowProfModal] = useState(false);
  const [editingProfId, setEditingProfId] = useState<string | null>(null);
  const [profName, setProfName] = useState('');
  const [profEmail, setProfEmail] = useState('');
  const [profBio, setProfBio] = useState('');
  const [profProcedures, setProfProcedures] = useState<string[]>([]);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editSchedule, setEditSchedule] = useState<ClinicSchedule>(schedule);

  const [showBlogModal, setShowBlogModal] = useState(false);
  const [editingBlogPost, setEditingBlogPost] = useState<any>(null);

  const openBlogModal = (post?: any) => {
    setEditingBlogPost(post || null);
    setShowBlogModal(true);
  };

  const handleSaveBlogPost = async (data: any) => {
    if (editingBlogPost) {
      await updatePost(editingBlogPost.id, data);
    } else {
      await createPost({
        ...data,
        author: clinic?.name || 'Clínica',
        clinicId,
        clinicName: clinic?.name,
        createdAt: new Date()
      });
    }
    refetchBlog();
  };

  const handleDeleteBlogPost = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este post?')) {
      await deletePost(id);
      refetchBlog();
    }
  };

  const openProfModal = (prof?: { id: string; name: string; email: string; bio: string; procedures: string[] }) => {
    setEditingProfId(prof?.id || null);
    setProfName(prof?.name || '');
    setProfEmail(prof?.email || '');
    setProfBio(prof?.bio || '');
    setProfProcedures(prof?.procedures || []);
    setShowProfModal(true);
  };

  const handleSaveProf = async () => {
    if (!profName.trim() || !profEmail.trim()) return;
    if (editingProfId) {
      await updateProfessional(editingProfId, {
        name: profName,
        email: profEmail,
        bio: profBio,
        procedures: profProcedures
      } as any);
    } else {
      await createProfessional({
        uid: `mock_${Date.now()}`,
        clinicId,
        name: profName,
        email: profEmail,
        bio: profBio,
        procedures: profProcedures
      });
    }
    setShowProfModal(false);
    refetchProfs();
  };

  const handleDeleteProf = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este profissional?')) {
      await deleteProfessional(id);
      refetchProfs();
    }
  };

  const openScheduleModal = () => {
    setEditSchedule(schedule);
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async () => {
    const ok = await updateSchedule(clinicId, editSchedule);
    if (ok) setShowScheduleModal(false);
  };

  const openEditModal = () => {
    setEditDescription(clinic?.description || '');
    setEditPhone(clinic?.phone || '');
    setEditProcedures(clinic?.procedures || []);
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    const success = await updateClinic({
      description: editDescription,
      phone: editPhone,
      procedures: editProcedures
    });
    if (success) {
      setEditSuccess(true);
      setTimeout(() => { setEditSuccess(false); setShowEditModal(false); }, 1500);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadClinicImage(file, clinicId);
    if (url) {
      await addImage(url);
    }
  };

  const toggleProcedure = (proc: string) => {
    setEditProcedures(prev =>
      prev.includes(proc) ? prev.filter(p => p !== proc) : [...prev, proc]
    );
  };

  if (clinicLoading || apptLoading || pendingLoading) {
    return (
      <Container className="py-5 mt-5 text-center">
        <Spinner animation="border" className="text-olive" />
      </Container>
    );
  }

  const totalAppointments = appointments.length;
  const avgRating = clinic?.rating || 0;
  const upcomingCount = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;

  const handleStatus = async (id: string, status: Appointment['status']) => {
    await updateStatus(id, status);
  };

  return (
    <Container className="py-5 mt-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="font-serif fw-bold text-olive">Painel da Clínica</h2>
              <p className="text-muted mb-0">Bem-vindo de volta, {user?.displayName}</p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <Button variant="outline-olive" size="sm" className="rounded-pill" onClick={() => navigate('/dashboard/clinic/clientes')}>
                <i className="bi bi-people me-1"></i>Clientes
              </Button>
              <Button variant="outline-olive" size="sm" className="rounded-pill" onClick={() => navigate('/dashboard/clinic/relatorios')}>
                <i className="bi bi-graph-up me-1"></i>Relatórios
              </Button>
              <Button variant="outline-olive" size="sm" className="rounded-pill" onClick={openEditModal}>
                <i className="bi bi-pencil me-1"></i>Gerenciar Perfil
              </Button>
              <Badge
                bg={clinic?.status === 'approved' ? 'success' : clinic?.status === 'rejected' ? 'danger' : 'warning'}
                className="rounded-pill px-3 py-2"
              >
                {clinic?.status === 'approved' ? 'Aprovado' : clinic?.status === 'rejected' ? 'Reprovado' : 'Pendente'}
              </Badge>
            </div>
          </div>

      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="p-4">
              <i className="bi bi-calendar-check text-gold fs-1 mb-2"></i>
              <h3 className="font-serif fw-bold text-olive">{totalAppointments}</h3>
              <p className="text-muted mb-0">Agendamentos</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="p-4">
              <i className="bi bi-star-fill text-gold fs-1 mb-2"></i>
              <h3 className="font-serif fw-bold text-olive">{avgRating.toFixed(1)}</h3>
              <p className="text-muted mb-0">Avaliação Média</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="p-4">
              <i className="bi bi-calendar2-week text-gold fs-1 mb-2"></i>
              <h3 className="font-serif fw-bold text-olive">{upcomingCount}</h3>
              <p className="text-muted mb-0">Próximos</p>
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
      </Row>

      <Row className="g-4">
        <Col md={8}>
          <DaySchedule clinicId={clinicId} />
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="font-serif fw-bold text-olive mb-0">Score de Confiança</h5>
                <Button variant="link" className="text-decoration-none p-0" onClick={openEditModal}>
                  <i className="bi bi-pencil text-gold"></i>
                </Button>
              </div>
              <div className="d-flex align-items-center gap-3 mb-2">
                <div className="flex-grow-1">
                  <ProgressBar now={Math.min(clinic?.score || 0, 100)} variant="gold" className="mb-1" />
                </div>
                <span className="fw-bold text-olive">{clinic?.score || 0}</span>
              </div>
              <small className="text-muted">
                {clinic?.description ? 'Perfil completo ✓' : 'Adicione uma descrição +'}
                {' | '}
                {(clinic?.images?.length || 0) > 0 ? 'Fotos ✓' : 'Fotos +'}
              </small>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm bg-olive text-white">
            <Card.Body className="p-4">
              <h5 className="font-serif fw-bold mb-3">Plano Atual: {clinic?.plan === 'premium' ? 'Premium' : clinic?.plan === 'professional' ? 'Profissional' : 'Básico'}</h5>
              <p className="opacity-75 mb-3">
                {clinic?.plan === 'basic'
                  ? 'Aproveite mais recursos com o plano Profissional'
                  : clinic?.plan === 'professional'
                    ? 'Recursos premium disponíveis no plano Premium'
                    : 'Você está no plano máximo!'}
              </p>
              {clinic?.plan !== 'premium' && (
                <Button variant="gold" className="w-100 rounded-pill" onClick={() => setShowUpgradeModal(true)}>Fazer Upgrade</Button>
              )}
              <Button variant="outline-light" className="w-100 rounded-pill mt-2" onClick={() => navigate('/support-chat')}>
                <i className="bi bi-headset me-1"></i>Falar com Suporte
              </Button>
              {planUpgraded && (
                <Alert variant="success" className="mt-2 rounded-4 py-2 small">Plano atualizado com sucesso!</Alert>
              )}
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="font-serif fw-bold text-olive mb-0">Profissionais</h5>
                <Button variant="olive" size="sm" className="rounded-pill" onClick={() => openProfModal()}>
                  <i className="bi bi-plus"></i>
                </Button>
              </div>
              {profLoading ? (
                <Spinner animation="border" size="sm" className="text-olive" />
              ) : professionals.length === 0 ? (
                <small className="text-muted">Nenhum profissional cadastrado.</small>
              ) : (
                <ListGroup variant="flush">
                  {professionals.map(p => (
                    <ListGroup.Item key={p.id} className="px-0 py-2 border-0 d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0 fw-bold small">{p.name}</h6>
                        <small className="text-muted">{p.procedures.slice(0, 2).join(', ')}{p.procedures.length > 2 ? '...' : ''}</small>
                      </div>
                      <div className="d-flex gap-1">
                        <Button variant="link" size="sm" className="p-0 text-gold" onClick={() => openProfModal(p)}>
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleDeleteProf(p.id)}>
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="font-serif fw-bold text-olive mb-0">Horários</h5>
                <Button variant="outline-olive" size="sm" className="rounded-pill" onClick={openScheduleModal}>
                  <i className="bi bi-gear"></i>
                </Button>
              </div>
              <small className="text-muted d-block">
                {schedule.daysOfWeek.length} dias/semana • {schedule.startTime}-{schedule.endTime}
              </small>
              <small className="text-muted">Slots de {schedule.slotDuration}min</small>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="font-serif fw-bold text-olive mb-0">Blog da Clínica</h5>
                <Button variant="olive" size="sm" className="rounded-pill" onClick={() => openBlogModal()}>
                  <i className="bi bi-plus"></i>
                </Button>
              </div>
              {blogLoading ? (
                <Spinner animation="border" size="sm" className="text-olive" />
              ) : blogPosts.length === 0 ? (
                <small className="text-muted">Nenhum post publicado.</small>
              ) : (
                blogPosts.slice(0, 3).map(post => (
                  <div key={post.id} className="d-flex justify-content-between align-items-start py-2 border-bottom">
                    <div className="flex-grow-1 me-2">
                      <h6 className="mb-0 small fw-bold text-truncate">{post.title}</h6>
                      <small className="text-muted">{post.category} · {post.readTime}min</small>
                    </div>
                    <div className="d-flex gap-1 flex-shrink-0">
                      <Button variant="link" size="sm" className="p-0 text-gold" onClick={() => openBlogModal(post)}>
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleDeleteBlogPost(post.id)}>
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </div>
                ))
              )}
              {blogPosts.length > 3 && (
                <small className="text-muted d-block mt-2">+{blogPosts.length - 3} posts</small>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-serif text-olive">Gerenciar Perfil</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editSuccess && <Alert variant="success" className="rounded-4">Perfil atualizado com sucesso!</Alert>}

          <h6 className="fw-bold mb-3">Fotos do Portfólio</h6>
          <Row className="g-2 mb-4">
            {(clinic?.images || []).map((img, idx) => (
              <Col md={4} key={idx} className="position-relative">
                <img src={img} className="rounded-3 w-100" style={{ height: '120px', objectFit: 'cover' }} alt={`Foto ${idx + 1}`} />
                <Button
                  variant="danger"
                  size="sm"
                  className="position-absolute top-0 end-0 m-1 rounded-circle"
                  onClick={() => removeImage(idx)}
                >
                  <i className="bi bi-x"></i>
                </Button>
              </Col>
            ))}
            <Col md={4}>
              <div className="border rounded-3 d-flex align-items-center justify-content-center" style={{ height: '120px', cursor: 'pointer' }}>
                <Form.Label className="m-0 p-3 text-center w-100" style={{ cursor: 'pointer' }}>
                  <i className="bi bi-camera-plus fs-2 text-muted d-block mb-1"></i>
                  <small className="text-muted">Adicionar foto</small>
                  <Form.Control type="file" accept="image/*" className="d-none" onChange={handleImageUpload} disabled={uploading} />
                </Form.Label>
              </div>
            </Col>
          </Row>

          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Descrição da Clínica</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="rounded-4"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Telefone</Form.Label>
              <Form.Control
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="rounded-pill"
              />
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
                    onClick={() => toggleProcedure(proc)}
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
          <Button variant="olive" className="rounded-pill" onClick={handleSaveProfile}>Salvar Alterações</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showProfModal} onHide={() => setShowProfModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-serif text-olive">
            {editingProfId ? 'Editar Profissional' : 'Adicionar Profissional'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Nome</Form.Label>
              <Form.Control type="text" value={profName} onChange={e => setProfName(e.target.value)} className="rounded-pill" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">E-mail (usado para login)</Form.Label>
              <Form.Control type="email" value={profEmail} onChange={e => setProfEmail(e.target.value)} className="rounded-pill" disabled={!!editingProfId} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Bio</Form.Label>
              <Form.Control as="textarea" rows={3} value={profBio} onChange={e => setProfBio(e.target.value)} className="rounded-4" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Procedimentos</Form.Label>
              <div className="d-flex gap-2 flex-wrap">
                {PROCEDURES_LIST.map(proc => (
                  <Badge
                    key={proc}
                    bg={profProcedures.includes(proc) ? 'olive' : 'light'}
                    text={profProcedures.includes(proc) ? 'white' : 'dark'}
                    className="rounded-pill px-3 py-2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setProfProcedures(prev =>
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
          <Button variant="secondary" className="rounded-pill" onClick={() => setShowProfModal(false)}>Cancelar</Button>
          <Button variant="olive" className="rounded-pill" onClick={handleSaveProf} disabled={creating || updating}>
            {creating || updating ? 'Salvando...' : 'Salvar'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showScheduleModal} onHide={() => setShowScheduleModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-serif text-olive">Configurar Horários</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Dias de Funcionamento</Form.Label>
              <div className="d-flex gap-2 flex-wrap">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => (
                  <Badge
                    key={i}
                    bg={editSchedule.daysOfWeek.includes(i) ? 'olive' : 'light'}
                    text={editSchedule.daysOfWeek.includes(i) ? 'white' : 'dark'}
                    className="rounded-pill px-3 py-2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setEditSchedule(prev => ({
                      ...prev,
                      daysOfWeek: prev.daysOfWeek.includes(i)
                        ? prev.daysOfWeek.filter(d => d !== i)
                        : [...prev.daysOfWeek, i]
                    }))}
                  >
                    {day}
                  </Badge>
                ))}
              </div>
            </Form.Group>
            <Row className="g-3 mb-3">
              <Col>
                <Form.Label className="fw-medium">Início</Form.Label>
                <Form.Control type="time" value={editSchedule.startTime} onChange={e => setEditSchedule(prev => ({ ...prev, startTime: e.target.value }))} className="rounded-pill" />
              </Col>
              <Col>
                <Form.Label className="fw-medium">Fim</Form.Label>
                <Form.Control type="time" value={editSchedule.endTime} onChange={e => setEditSchedule(prev => ({ ...prev, endTime: e.target.value }))} className="rounded-pill" />
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Duração do Slot</Form.Label>
              <Form.Select value={editSchedule.slotDuration} onChange={e => setEditSchedule(prev => ({ ...prev, slotDuration: Number(e.target.value) }))} className="rounded-pill">
                <option value={30}>30 minutos</option>
                <option value={60}>60 minutos</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" className="rounded-pill" onClick={() => setShowScheduleModal(false)}>Cancelar</Button>
          <Button variant="olive" className="rounded-pill" onClick={handleSaveSchedule}>Salvar</Button>
        </Modal.Footer>
      </Modal>

      <BlogPostModal
        show={showBlogModal}
        onHide={() => { setShowBlogModal(false); setEditingBlogPost(null); }}
        onSave={handleSaveBlogPost}
        initial={editingBlogPost ? {
          title: editingBlogPost.title,
          excerpt: editingBlogPost.excerpt,
          content: editingBlogPost.content,
          category: editingBlogPost.category,
          readTime: editingBlogPost.readTime,
          image: editingBlogPost.image
        } : undefined}
        saving={creatingPost || updatingPost}
      />

      <UpgradeModal
        show={showUpgradeModal}
        onHide={() => setShowUpgradeModal(false)}
        currentPlan={clinic?.plan || 'basic'}
      />
    </Container>
  );
};
