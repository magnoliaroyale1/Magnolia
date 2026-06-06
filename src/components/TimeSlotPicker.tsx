import { Form, Spinner } from 'react-bootstrap';
import { useProfessionalAvailability } from '../hooks/useProfessionalAvailability';

interface TimeSlotPickerProps {
  clinicId: string;
  professionalId: string;
  date: string;
  selectedTime: string;
  onSelectTime: (time: string) => void;
}

export const TimeSlotPicker = ({ clinicId, professionalId, date, selectedTime, onSelectTime }: TimeSlotPickerProps) => {
  const { availableSlots, loading } = useProfessionalAvailability(clinicId, professionalId, date);

  if (!date) {
    return <small className="text-muted">Selecione uma data primeiro.</small>;
  }

  if (loading) {
    return (
      <div className="text-center py-3">
        <Spinner animation="border" size="sm" className="text-olive" />
      </div>
    );
  }

  if (availableSlots.length === 0) {
    return <small className="text-danger">Nenhum horário disponível nesta data.</small>;
  }

  return (
    <div className="d-flex gap-2 flex-wrap">
      {availableSlots.map(time => (
        <div
          key={time}
          className={`rounded-pill px-3 py-2 small ${selectedTime === time ? 'bg-olive text-white' : 'bg-light'}`}
          style={{ cursor: 'pointer' }}
          onClick={() => onSelectTime(time)}
        >
          {time}
        </div>
      ))}
    </div>
  );
};
