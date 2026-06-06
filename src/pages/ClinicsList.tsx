import { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ClinicCard } from '../components/ClinicCard';
import { SearchFilters } from '../components/SearchFilters';
import { useAuth } from '../context/AuthContext';
import { useSearchHistory } from '../hooks/useSearchHistory';
import type { Clinic } from '../types';

interface Filters {
  location: string;
  procedure: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  verifiedOnly: boolean;
}

export const ClinicsList = () => {
  const { user } = useAuth();
  const { saveSearch } = useSearchHistory(user?.uid || '');
  const [allClinics, setAllClinics] = useState<Clinic[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const q = query(
          collection(db, 'clinics'),
          where('status', '==', 'approved'),
          orderBy('rating', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clinic));
        setAllClinics(data);
        setFilteredClinics(data);
      } catch (err) {
        console.warn('Query indexada falhou, buscando todas e filtrando...', err);
        try {
          const snapshot = await getDocs(collection(db, 'clinics'));
          const data = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Clinic))
            .filter(c => c.status === 'approved')
            .sort((a, b) => (b.rating || 0) - (a.rating || 0));
          setAllClinics(data);
          setFilteredClinics(data);
        } catch (fallbackErr) {
          console.error('Fallback também falhou:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchClinics();
  }, []);

  const handleFilter = (filters: Filters) => {
    let result = [...allClinics];

    if (filters.location) {
      result = result.filter(c =>
        c.address?.city?.toLowerCase().includes(filters.location.toLowerCase()) ||
        c.address?.state?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.procedure) {
      result = result.filter(c =>
        (c.procedures || []).some(p => p.toLowerCase() === filters.procedure.toLowerCase())
      );
    }

    if (filters.minRating) {
      const min = parseFloat(filters.minRating);
      if (!isNaN(min)) {
        result = result.filter(c => (c.rating || 0) >= min);
      }
    }

    if (filters.minPrice || filters.maxPrice) {
      const min = filters.minPrice ? parseFloat(filters.minPrice) : 0;
      const max = filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity;
      if (!isNaN(min) && !isNaN(max)) {
        result = result.filter(c => {
          const price = c.plan === 'premium' ? 397 : c.plan === 'professional' ? 197 : 97;
          return price >= min && price <= max;
        });
      }
    }

    if (filters.verifiedOnly) {
      result = result.filter(c => c.verified === true);
    }

    setFilteredClinics(result);

    if (user) {
      saveSearch('', {
        location: filters.location,
        procedure: filters.procedure,
        minRating: filters.minRating,
        verifiedOnly: filters.verifiedOnly ? 'sim' : ''
      });
    }
  };

  return (
    <Container className="py-5 mt-5">
      <div className="mb-4">
        <h2 className="font-serif fw-bold text-olive">Encontre sua Clínica</h2>
        <p className="text-muted">Explore as melhores clínicas de estética premium</p>
      </div>

      <SearchFilters onFilter={handleFilter} />

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" className="text-olive" />
        </div>
      ) : filteredClinics.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-search text-muted fs-1 mb-3 d-block"></i>
          <p className="text-muted">Nenhuma clínica encontrada com esses filtros.</p>
        </div>
      ) : (
        <Row className="g-4">
          {filteredClinics.map(clinic => (
            <Col md={6} lg={4} key={clinic.id}>
              <ClinicCard clinic={clinic} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};
