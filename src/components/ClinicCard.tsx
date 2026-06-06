import { Card, Badge, Button, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { StarRating } from './StarRating';
import type { Clinic } from '../types';

interface ClinicCardProps {
  clinic: Clinic;
}

export const ClinicCard = ({ clinic }: ClinicCardProps) => {
  return (
    <Card className="h-100 card-hover overflow-hidden">
      <div className="position-relative">
        <Card.Img 
          variant="top" 
          src={clinic.images[0] || 'https://via.placeholder.com/400x300'} 
          style={{ height: '200px', objectFit: 'cover' }}
        />
        {clinic.verified && (
          <Badge className="position-absolute top-0 end-0 m-3 badge-verified rounded-pill px-3 py-2">
            <i className="bi bi-patch-check-fill me-1"></i>
            Verificada
          </Badge>
        )}
        <Badge bg="light" text="dark" className="position-absolute bottom-0 start-0 m-3 rounded-pill px-3">
          <i className="bi bi-geo-alt-fill text-olive me-1"></i>
          {clinic.address.city}, {clinic.address.state}
        </Badge>
      </div>
      
      <Card.Body className="p-4" style={{ minWidth: 0 }}>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="font-serif fw-bold text-olive mb-0 fs-5 text-truncate" title={clinic.name}>
            {clinic.name}
          </Card.Title>
          <div className="d-flex align-items-center gap-1">
            <span className="fw-bold text-gold">{clinic.rating.toFixed(1)}</span>
            <i className="bi bi-star-fill text-gold small"></i>
          </div>
        </div>
        
        <div className="mb-3">
          <StarRating rating={Math.round(clinic.rating)} size="sm" />
          <small className="text-muted ms-2">({clinic.reviewCount} avaliações)</small>
        </div>
        
        <div className="mb-3">
          <div className="d-flex gap-2 flex-wrap">
            {clinic.procedures.slice(0, 3).map((proc, idx) => (
              <Badge key={idx} bg="light" text="dark" className="fw-normal border">
                {proc}
              </Badge>
            ))}
            {clinic.procedures.length > 3 && (
              <Badge bg="light" text="dark" className="fw-normal">
                +{clinic.procedures.length - 3}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="d-flex justify-content-between align-items-center mb-3">
          <small className="text-muted text-truncate" style={{ maxWidth: '200px' }}>
            {clinic.description.substring(0, 60)}...
          </small>
        </div>

        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <div className="progress flex-grow-1" style={{ width: '60px' }}>
              <div 
                className="progress-bar" 
                role="progressbar" 
                style={{ width: `${clinic.score}%` }}
              ></div>
            </div>
            <small className="text-muted">{clinic.score}</small>
          </div>
          <Link to={`/clinic/${clinic.id}`}>
            <Button variant="outline-olive" size="sm" className="rounded-pill px-3">
              Ver perfil
            </Button>
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
};