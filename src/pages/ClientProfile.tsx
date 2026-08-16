import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';
import { usePhoneInput } from '../utils/brasil';

export const ClientProfile = () => {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Phone input mask
  const phoneInput = usePhoneInput();
  
  useEffect(() => {
    if (user?.phone) {
      phoneInput.setValue(user.phone);
      setPhone(user.phone);
    }
  }, [user?.phone, phoneInput]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('O nome não pode ficar vazio.'); return; }
    if (displayName.trim().length > 100) { setError('Nome muito longo (máx. 100 caracteres).'); return; }
    try {
      setSaving(true);
      setError('');
      await updateDoc(doc(db, 'users', user!.uid), { displayName: displayName.trim() });
      setSuccess('Nome atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Erro ao atualizar nome. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && phoneInput.error) { setError('Telefone inválido.'); return; }
    try {
      setSaving(true);
      setError('');
      await updateDoc(doc(db, 'users', user!.uid), { phone: phoneInput.formattedValue });
      setSuccess('Telefone atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Erro ao atualizar telefone. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (!currentPassword) { setPasswordError('Senha atual é obrigatória.'); return; }
    if (newPassword.length < 6) { setPasswordError('A nova senha deve ter no mínimo 6 caracteres.'); return; }
    if (newPassword.length > 128) { setPasswordError('Nova senha muito longa (máx. 128 caracteres).'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('As senhas não coincidem.'); return; }
    try {
      setPasswordSaving(true);
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('Usuário não autenticado');
      const credential = EmailAuthProvider.credential(firebaseUser.email!, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Senha alterada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      if (err.code === 'auth/wrong-password') setPasswordError('Senha atual incorreta.');
      else if (err.code === 'auth/weak-password') setPasswordError('A nova senha é muito fraca.');
      else setPasswordError('Erro ao alterar senha. Tente novamente.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    if (deleteConfirmText !== 'EXCLUIR') { setDeleteError('Digite EXCLUIR para confirmar.'); return; }
    if (!deletePassword) { setDeleteError('Senha é obrigatória para confirmar.'); return; }
    try {
      setDeleting(true);
      await deleteAccount(deletePassword);
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password') setDeleteError('Senha incorreta.');
      else if (err.code === 'auth/requires-recent-login') setDeleteError('Por favor, faça login novamente antes de excluir a conta.');
      else setDeleteError('Erro ao excluir conta. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container className="py-5 mt-5">
      <SEO title="Meu Perfil" description="Gerencie seu perfil na Magnolia Royale" url="https://magnoliaroyale.com.br/profile" />
      <Row className="justify-content-center">
        <Col md={7} lg={6}>
          <div className="text-center mb-4">
            <i className="bi bi-person-circle text-olive" style={{ fontSize: '3rem' }}></i>
            <h2 className="font-serif fw-bold text-olive mt-3">Meu Perfil</h2>
            <p className="text-muted mt-2">Gerencie suas informações pessoais</p>
          </div>

          {success && <Alert variant="success" className="rounded-4 mb-4">{success}</Alert>}
          {error && <Alert variant="danger" className="rounded-4 mb-4">{error}</Alert>}

          <Card className="border-0 shadow-sm card-premium mb-4">
            <Card.Body className="p-4">
              <h5 className="fw-bold text-olive mb-4">Informações Pessoais</h5>

              <Form onSubmit={handleSaveName}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Nome completo</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Seu nome"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value.slice(0, 100))}
                    maxLength={100}
                    className="rounded-pill form-control-premium"
                    disabled={saving}
                    required
                  />
                  <Form.Text className="text-end">0 / 100</Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">E-mail</Form.Label>
                  <Form.Control
                    type="email"
                    value={user?.email || ''}
                    className="rounded-pill form-control-premium"
                    disabled
                  />
                  <Form.Text className="text-muted small">O e-mail não pode ser alterado</Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Telefone</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={phoneInput.formattedValue}
                    onChange={phoneInput.handleChange}
                    onBlur={() => { phoneInput.handleBlur(); setPhone(phoneInput.formattedValue); }}
                    maxLength={15}
                    className={`rounded-pill form-control-premium ${phoneInput.error ? 'is-invalid' : ''}`}
                    disabled={saving}
                  />
                  {phoneInput.error && <Form.Control.Feedback type="invalid">{phoneInput.error}</Form.Control.Feedback>}
                </Form.Group>

                <Button
                  variant="gold"
                  type="submit"
                  className="w-100 rounded-pill btn-lg"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm card-premium mb-4">
            <Card.Body className="p-4">
              <h5 className="fw-bold text-olive mb-4">Segurança</h5>
              <div className="d-flex flex-column gap-3">
                <Button
                  variant="outline-olive"
                  className="rounded-pill btn-lg"
                  onClick={() => setShowPasswordModal(true)}
                >
                  <i className="bi bi-key me-2"></i>Alterar Senha
                </Button>
                <Button
                  variant="outline-danger"
                  className="rounded-pill btn-lg"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <i className="bi bi-trash me-2"></i>Excluir Conta
                </Button>
              </div>
            </Card.Body>
          </Card>

          <div className="text-center">
            <Button variant="link" className="text-decoration-none text-muted" onClick={() => navigate('/dashboard/client')}>
              <i className="bi bi-arrow-left me-1"></i>Voltar ao Painel
            </Button>
          </div>
        </Col>
      </Row>

      {/* Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-serif text-olive">Alterar Senha</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleChangePassword}>
          <Modal.Body>
            {passwordError && <Alert variant="danger" className="rounded-4 py-2">{passwordError}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Senha Atual</Form.Label>
              <Form.Control
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                maxLength={128}
                className="rounded-pill form-control-premium"
                required
                autoComplete="current-password"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Nova Senha</Form.Label>
              <Form.Control
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                maxLength={128}
                className="rounded-pill form-control-premium"
                required
                autoComplete="new-password"
              />
              <Form.Text>Mínimo 6 caracteres</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Confirmar Nova Senha</Form.Label>
              <Form.Control
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                maxLength={128}
                className="rounded-pill form-control-premium"
                required
                autoComplete="new-password"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" className="rounded-pill" onClick={() => setShowPasswordModal(false)}>Cancelar</Button>
            <Button
              variant="gold"
              type="submit"
              className="rounded-pill"
              disabled={passwordSaving}
            >
              {passwordSaving ? 'Salvando...' : 'Alterar Senha'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-serif text-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>Excluir Conta
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleDeleteAccount}>
          <Modal.Body>
            <Alert variant="danger" className="rounded-4 py-3">
              <strong>Esta ação é irreversível!</strong>
              <p className="mb-0 mt-2 small">Todos os seus dados, agendamentos e histórico serão removidos permanentemente.</p>
            </Alert>
            {deleteError && <Alert variant="danger" className="rounded-4 py-2 mt-3">{deleteError}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Digite EXCLUIR para confirmar</Form.Label>
              <Form.Control
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                maxLength={7}
                className="rounded-pill form-control-premium"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Senha atual</Form.Label>
              <Form.Control
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                maxLength={128}
                className="rounded-pill form-control-premium"
                required
                autoComplete="current-password"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" className="rounded-pill" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
            <Button
              variant="danger"
              type="submit"
              className="rounded-pill"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Excluindo...
                </>
              ) : (
                'Excluir Minha Conta'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};