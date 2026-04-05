package com.qtm.tenants.referent.service;

import com.qtm.tenants.referent.entity.ReferentEntity;
import com.qtm.tenants.referent.repository.ReferentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service per la gestione dei referenti struttura.
 */
@Service
@RequiredArgsConstructor
public class ReferentService {
    private final ReferentRepository referentRepository;

    public List<ReferentEntity> findAll() {
        return referentRepository.findAll();
    }

    public Optional<ReferentEntity> findById(Long id) {
        return referentRepository.findById(id);
    }

    public ReferentEntity save(ReferentEntity referent) {
        return referentRepository.save(referent);
    }

    public void deleteById(Long id) {
        referentRepository.deleteById(id);
    }
}
