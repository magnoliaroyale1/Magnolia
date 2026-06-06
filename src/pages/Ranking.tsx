import { Container, Card, ListGroup, Badge, ProgressBar, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { calculateClinicScore } from '../utils/score';
import type { Clinic } from '../types';

export const Ranking = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankedClinics = async () => {
      try {
        const q = query(
          collection(db, 'clinics'),
          where('status', '==', 'approved'),
          orderBy('score', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const clinicsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Clinic));
        
        setClinics(clinicsData);
      } catch (error) {
        console.error('Erro ao buscar ranking:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankedClinics();
  }, []);

  if (loading) {
    return (
      <Container className="py-5 mt-5 text-center">
        <div className="spinner-border text-olive" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5 mt-5">
      <div className="text-center mb-5">
        <h2 className="font-serif fw-bold text-olive">Ranking de Clínicas</h2>
        <p className="text-muted">As clínicas mais bem avaliadas da plataforma em tempo real</p>
      </div>

      {clinics.length === 0 ? (
        <Alert variant="info" className="rounded-4 text-center">
          <i className="bi bi-info-circle me-2"></i>
          Nenhuma clínica aprovada no ranking ainda. Seja a primeira!
        </Alert>
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <ListGroup variant="flush">
              {clinics.map((clinic, index) => {
                const score = calculateClinicScore(clinic);
                const rank = index + 1;
                
                // Medalhas para top 3
                const getRankStyle = () => {
                  if (rank === 1) return { bg: 'bg-gold', icon: '🥇' };
                  if (rank === 2) return { bg: 'bg-olive', icon: '🥈' };
                  if (rank === 3) return { bg: 'bg-olive', icon: '🥉', dimmed: true };
                  return { bg: 'bg-olive', icon: `${rank}`, dimmed: true };
                };
                
                const rankStyle = getRankStyle();

                return (
                  <ListGroup.Item key={clinic.id} className="p-4">
                    <div className="d-flex align-items-center gap-4">
                      <div className={`${rankStyle.bg} ${rankStyle.dimmed ? 'opacity-75' : ''} text-white rounded-circle d-flex align-items-center justify-content-center fw-bold`} 
                           style={{ width: '55px', height: '55px', fontSize: rank <= 3 ? '1.5rem' : '1.2rem' }}>
                        {rankStyle.icon}
                      </div>
                      
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h5 className="fw-bold mb-1">
                              <Link to={`/clinic/${clinic.id}`} className="text-decoration-none text-olive">
                                {clinic.name}
                              </Link>
                              {clinic.verified && (
                                <Badge className="ms-2 badge-verified rounded-pill">
                                  <i className="bi bi-patch-check-fill me-1"></i>
                                  Verificada
                                </Badge>
                              )}
                            </h5>
                            <p className="text-muted mb-1 small">
                              <i className="bi bi-geo-alt me-1"></i>
                              {clinic.address?.city}, {clinic.address?.state}
                            </p>
                            <Badge bg="light" text="dark" className="me-2">
                              <i className="bi bi-star-fill text-gold me-1"></i>
                              {(clinic.rating || 0).toFixed(1)}
                            </Badge>
                            <small className="text-muted">{clinic.reviewCount || 0} avaliações</small>
                          </div>
                          
                          <div className="text-end">
                            <h4 className="font-serif fw-bold text-gold mb-0">{score}</h4>
                            <small className="text-muted">pontos</small>
                          </div>
                        </div>
                        
                        <ProgressBar now={Math.min(score, 100)} variant="gold" style={{ height: '8px' }} />
                        
                        <div className="d-flex gap-2 mt-2 flex-wrap">
                          {(clinic.procedures || []).slice(0, 3).map((proc, idx) => (
                            <Badge key={idx} bg="light" text="dark" className="fw-normal border rounded-pill px-3 py-2">
                              {proc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};