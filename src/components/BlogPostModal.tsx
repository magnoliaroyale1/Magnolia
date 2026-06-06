import { useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';

interface BlogPostModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (data: {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    readTime: number;
    image: string;
  }) => Promise<void>;
  initial?: {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    readTime: number;
    image: string;
  };
  saving?: boolean;
}

const CATEGORIES = ['Estética', 'Saúde', 'Tendências', 'Cuidados', 'Procedimentos', 'Dicas'];

export const BlogPostModal = ({ show, onHide, onSave, initial, saving }: BlogPostModalProps) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt || '');
  const [content, setContent] = useState(initial?.content || '');
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0]);
  const [readTime, setReadTime] = useState(initial?.readTime || 5);
  const [image, setImage] = useState(initial?.image || '');

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    await onSave({ title, excerpt, content, category, readTime, image });
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="font-serif text-olive">
          {initial ? 'Editar Post' : 'Novo Post'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Título</Form.Label>
            <Form.Control type="text" value={title} onChange={e => setTitle(e.target.value)} className="rounded-pill" placeholder="Título do post" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Resumo</Form.Label>
            <Form.Control type="text" value={excerpt} onChange={e => setExcerpt(e.target.value)} className="rounded-pill" placeholder="Breve descrição que aparece no card" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Conteúdo</Form.Label>
            <Form.Control as="textarea" rows={6} value={content} onChange={e => setContent(e.target.value)} className="rounded-4" placeholder="Escreva o conteúdo do post aqui..." />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Categoria</Form.Label>
            <Form.Select value={category} onChange={e => setCategory(e.target.value)} className="rounded-pill">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Tempo de Leitura (minutos)</Form.Label>
            <Form.Control type="number" min={1} value={readTime} onChange={e => setReadTime(Number(e.target.value))} className="rounded-pill" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">URL da Imagem</Form.Label>
            <Form.Control type="text" value={image} onChange={e => setImage(e.target.value)} className="rounded-pill" placeholder="https://..." />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" className="rounded-pill" onClick={onHide}>Cancelar</Button>
        <Button variant="olive" className="rounded-pill" onClick={handleSave} disabled={saving || !title.trim() || !content.trim()}>
          {saving ? <><Spinner animation="border" size="sm" className="me-2" />Salvando...</> : 'Publicar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
