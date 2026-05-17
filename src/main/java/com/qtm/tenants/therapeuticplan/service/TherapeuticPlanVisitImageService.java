package com.qtm.tenants.therapeuticplan.service;

import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanVisitImageDto;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanVisitImageEntity;
import com.qtm.tenants.therapeuticplan.mapper.TherapeuticPlanVisitImageMapper;
import com.qtm.tenants.therapeuticplan.repository.TherapeuticPlanVisitImageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service per gestire le immagini associate alle visite del piano terapeutico.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TherapeuticPlanVisitImageService {

    private final TherapeuticPlanVisitImageRepository repository;
    private final TherapeuticPlanVisitImageMapper mapper;

    /**
     * Salva un'immagine per una visita.
     *
     * @param therapeuticPlanId ID del piano terapeutico
     * @param visitDate data della visita
     * @param file file immagine
     * @param description descrizione dell'immagine
     * @return DTO dell'immagine salvata
     */
    public TherapeuticPlanVisitImageDto saveImage(Long therapeuticPlanId, LocalDateTime visitDate,
                                                   MultipartFile file, String description) {
        try {
            TherapeuticPlanVisitImageEntity entity = TherapeuticPlanVisitImageEntity.builder()
                    .therapeuticPlanId(therapeuticPlanId)
                    .visitDate(visitDate)
                    .imageName(file.getOriginalFilename())
                    .imageType(file.getContentType())
                    .imageData(file.getBytes())
                    .description(description)
                    .uploadDate(LocalDateTime.now())
                    .build();

            TherapeuticPlanVisitImageEntity saved = repository.save(entity);
            log.info("Immagine salvata: {} per visita {} del piano {}", saved.getId(), visitDate, therapeuticPlanId);
            return mapper.toDto(saved);
        } catch (IOException e) {
            log.error("Errore durante il salvataggio dell'immagine", e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Errore durante il caricamento dell'immagine");
        }
    }

    /**
     * Recupera tutte le immagini di una visita.
     *
     * @param therapeuticPlanId ID del piano terapeutico
     * @param visitDate data della visita
     * @return lista di DTO delle immagini
     */
    public List<TherapeuticPlanVisitImageDto> getImagesForVisit(Long therapeuticPlanId, LocalDateTime visitDate) {
        List<TherapeuticPlanVisitImageEntity> images = repository.findByTherapeuticPlanIdAndVisitDate(therapeuticPlanId, visitDate);
        return images.stream()
                .map(mapper::toDto)
                .toList();
    }

    /**
     * Recupera un'immagine specifica.
     *
     * @param imageId ID dell'immagine
     * @return entity dell'immagine con i dati binari
     */
    public TherapeuticPlanVisitImageEntity getImageById(Long imageId) {
        return repository.findById(imageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Immagine non trovata"));
    }

    /**
     * Elimina un'immagine.
     *
     * @param imageId ID dell'immagine
     */
    public void deleteImage(Long imageId) {
        repository.findById(imageId)
                .ifPresentOrElse(
                    image -> {
                        repository.delete(image);
                        log.info("Immagine eliminata: {} dalla visita del piano {}", imageId, image.getTherapeuticPlanId());
                    },
                    () -> {
                        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Immagine non trovata");
                    }
                );
    }

    /**
     * Elimina tutte le immagini di una visita.
     *
     * @param therapeuticPlanId ID del piano terapeutico
     * @param visitDate data della visita
     */
    public void deleteImagesForVisit(Long therapeuticPlanId, LocalDateTime visitDate) {
        long count = repository.countByTherapeuticPlanIdAndVisitDate(therapeuticPlanId, visitDate);
        repository.deleteByTherapeuticPlanIdAndVisitDate(therapeuticPlanId, visitDate);
        log.info("Eliminate {} immagini dalla visita {} del piano {}", count, visitDate, therapeuticPlanId);
    }
}
