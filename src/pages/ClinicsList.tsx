import { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Button } from 'react-bootstrap';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ClinicCard } from '../components/ClinicCard';
import { SearchFilters } from '../components/SearchFilters';
import { useFavorites } from '../hooks/useFavorites';
import { SEO } from '../components/SEO';
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
  const [displayLimit, setDisplayLimit] = useState(9);

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
        console.error('Erro ao buscar clínicas. Crie o índice composto no Firebase Console:', err);
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
    setDisplayLimit(9);

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
      <SEO
        title="Encontrar Clínicas"
        description="Explore e compare as melhores clínicas de estética premium. Filtre por localização, procedimento e avaliação."
        url="https://magnoliaroyale.com.br/clinics"
      />
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
        <>
          <Row className="g-4">
            {filteredClinics.slice(0, displayLimit).map(clinic => (
              <Col md={6} lg={4} key={clinic.id}>
                <ClinicCard clinic={clinic} />
              </Col>
            ))}
          </Row>
          {displayLimit < filteredClinics.length && (
            <div className="text-center mt-4">
              <Button variant="outline-olive" className="rounded-pill px-5" onClick={() => setDisplayLimit(prev => prev + 9)}>
                Carregar mais ({filteredClinics.length - displayLimit} restantes)
              </Button>
            </div>
          )}
        </>
      )}
    </Container>
  );
};
