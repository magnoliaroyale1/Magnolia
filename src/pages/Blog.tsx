import { Container, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import { useBlogPosts } from '../hooks/useBlogPosts';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { formatDateBR } from '../utils/date';

export const Blog = () => {
  const { posts, loading } = useBlogPosts();

  return (
    <Container className="py-5 mt-5">
      <SEO
        title="Blog"
        description="Dicas, tendências e guias sobre estética premium, procedimentos e cuidados com a pele."
        url="https://magnoliaroyale.com.br/blog"
      />
      <div className="text-center mb-5">
        <h2 className="font-serif fw-bold text-olive">Blog Magnolia Royale</h2>
        <p className="text-muted">Dicas e tendências do mundo da estética</p>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" className="text-olive" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-newspaper text-muted fs-1 d-block mb-3"></i>
          <p className="text-muted">Nenhum post publicado ainda.</p>
        </div>
      ) : (
        <Row className="g-4">
          {posts.map(post => (
            <Col md={6} key={post.id}>
              <Card className="border-0 shadow-sm card-hover h-100">
                <Card.Img
                  src={post.image || 'https://via.placeholder.com/600x400'}
                  style={{ height: '250px', objectFit: 'cover' }}
                />
                <Card.Body className="p-4">
                  {post.category && (
                    <Badge bg="light" text="dark" className="mb-2">{post.category}</Badge>
                  )}
                  <h4 className="font-serif fw-bold text-olive mb-2">{post.title}</h4>
                  <p className="text-muted mb-3">{post.excerpt}</p>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      <i className="bi bi-clock me-1"></i>
                      {post.readTime} min de leitura
                    </small>
                    <small className="text-muted">
                      {formatDateBR(post.createdAt)}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};
