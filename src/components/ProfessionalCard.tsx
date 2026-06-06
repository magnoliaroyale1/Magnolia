import { Card, Button } from 'react-bootstrap';
import type { Professional } from '../types';

interface ProfessionalCardProps {
  professional: Professional;
  selected: boolean;
  onSelect: () => void;
}

export const ProfessionalCard = ({ professional, selected, onSelect }: ProfessionalCardProps) => (
  <Card
    className={`border-0 shadow-sm mb-2 ${selected ? 'bg-olive text-white' : ''}`}
    style={{ cursor: 'pointer' }}
    onClick={onSelect}
  >
    <Card.Body className="p-3 d-flex align-items-center gap-3">
      <div
        className="rounded-circle bg-light d-flex align-items-center justify-content-center flex-shrink-0"
        style={{ width: '48px', height: '48px' }}
      >
        <i className={`bi bi-person-fill fs-4 ${selected ? 'text-white' : 'text-olive'}`}></i>
      </div>
      <div className="overflow-hidden">
        <h6 className={`mb-0 fw-bold text-truncate ${selected ? 'text-white' : ''}`}>{professional.name}</h6>
        <small className={selected ? 'text-white-50' : 'text-muted'}>
          {professional.procedures.join(', ')}
        </small>
      </div>
      {selected && <i className="bi bi-check-circle-fill ms-auto fs-5"></i>}
    </Card.Body>
  </Card>
);
