import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';

export const ClientProfile = () => {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
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

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('O nome não pode ficar vazio.'); return; }
    try {
      setSaving(true);
      setError('');
      await updateDoc(doc(db, 'users', user!.uid), { displayName: displayName.trim() });
      setSuccess('Nome atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 6) { setPasswordError('A nova senha deve ter no mínimo 6 caracteres.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('As senhas não conferem.'); return; }
    try {
      setPasswordSaving(true);
      const fbUser = auth.currentUser;
      if (!fbUser || !fbUser.email) { setPasswordError('Usuário não autenticado.'); return; }
      const credential = EmailAuthProvider.credential(fbUser.email, currentPassword);
      await reauthenticateWithCredential(fbUser, credential);
      await updatePassword(fbUser, newPassword);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Senha alterada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordError('Senha atual incorreta.');
      } else {
        setPasswordError('Erro ao alterar senha. Tente novamente.');
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (deleteConfirmText !== 'EXCLUIR') { setDeleteError('Digite EXCLUIR para confirmar.'); return; }
    try {
      setDeleting(true);
      await deleteAccount(deletePassword);
      navigate('/login', { replace: true });
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setDeleteError('Senha incorreta.');
      } else {
        setDeleteError('Erro ao excluir conta. Tente novamente.');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container className="py-5 mt-5">
      <SEO title="Meu Perfil" description="Gerencie seus dados pessoais e conta." />
      <Row className="justify-content-center">
        <Col md={7} lg={6}>
          <h2 className="font-serif fw-bold text-olive mb-4">
            <i className="bi bi-person-gear me-2"></i>Meu Perfil
          </h2>

          {success && <Alert variant="success" className="rounded-4" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
          {error && <Alert variant="danger" className="rounded-4" dismissible onClose={() => setError('')}>{error}</Alert>}

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <h5 className="fw-bold text-olive mb-3">
                <i className="bi bi-person me-2"></i>Dados Pessoais
              </h5>
              <Form onSubmit={handleSaveName}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Nome</Form.Label>
                  <Form.Control
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="rounded-pill"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">E-mail</Form.Label>
                  <Form.Control
                    type="email"
                    value={user?.email || ''}
                    className="rounded-pill"
                    disabled
                    readOnly
                  />
                  <Form.Text className="text-muted">O e-mail não pode ser alterado.</Form.Text>
                </Form.Group>
                <Button variant="olive" type="submit" className="rounded-pill px-4" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <h5 className="fw-bold text-olive mb-3">
                <i className="bi bi-shield-lock me-2"></i>Segurança
              </h5>
              <Button variant="outline-olive" className="rounded-pill" onClick={() => setShowPasswordModal(true)}>
                <i className="bi bi-key me-2"></i>Alterar Senha
              </Button>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4 border-danger">
            <Card.Body className="p-4">
              <h5 className="fw-bold text-danger mb-3">
                <i className="bi bi-exclamation-triangle me-2"></i>Zona Perigosa
              </h5>
              <p className="text-muted small mb-3">
                Ao excluir sua conta, todos os seus dados serão removidos permanentemente.
                Esta ação não pode ser desfeita.
              </p>
              <Button variant="outline-danger" className="rounded-pill" onClick={() => setShowDeleteModal(true)}>
                <i className="bi bi-trash me-2"></i>Excluir Minha Conta
              </Button>
            </Card.Body>
          </Card>

          <div className="text-center">
            <Button variant="link" className="text-decoration-none text-muted" onClick={() => navigate('/dashboard/client')}>
              <i className="bi bi-arrow-left me-1"></i>Voltar ao Painel
            </Button>
          </div>
        </Col>
      </Row>

      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-serif text-olive">Alterar Senha</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleChangePassword}>
          <Modal.Body>
            {passwordError && <Alert variant="danger" className="rounded-4 py-2">{passwordError}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Senha Atual</Form.Label>
              <Form.Control type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="rounded-pill" required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Nova Senha</Form.Label>
              <Form.Control type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-pill" required minLength={6} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Confirmar Nova Senha</Form.Label>
              <Form.Control type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="rounded-pill" required />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" className="rounded-pill" onClick={() => setShowPasswordModal(false)}>Cancelar</Button>
            <Button variant="olive" type="submit" className="rounded-pill" disabled={passwordSaving}>
              {passwordSaving ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-serif text-danger">Excluir Conta</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteError && <Alert variant="danger" className="rounded-4 py-2">{deleteError}</Alert>}
          <Alert variant="warning" className="rounded-4 py-2">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Esta ação é permanente e irreversível. Todos os seus dados serão removidos.
          </Alert>
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Digite <strong>EXCLUIR</strong> para confirmar</Form.Label>
            <Form.Control type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="rounded-pill" placeholder="EXCLUIR" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Digite sua senha atual</Form.Label>
            <Form.Control type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="rounded-pill" placeholder="••••••••" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" className="rounded-pill" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
          <Button variant="danger" className="rounded-pill" onClick={handleDeleteAccount} disabled={deleting || deleteConfirmText !== 'EXCLUIR' || !deletePassword}>
            {deleting ? 'Excluindo...' : 'Excluir Conta'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};
