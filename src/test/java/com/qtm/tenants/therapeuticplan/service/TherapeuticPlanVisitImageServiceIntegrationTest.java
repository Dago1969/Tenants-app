package com.qtm.tenants.therapeuticplan.service;

import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanVisitImageDto;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanVisitEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanVisitImageEntity;
import com.qtm.tenants.therapeuticplan.mapper.TherapeuticPlanVisitImageMapper;
import com.qtm.tenants.therapeuticplan.repository.TherapeuticPlanVisitImageRepository;
import com.qtm.tenants.therapeuticplan.repository.TherapeuticPlanVisitRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifica che il service immagini persista davvero il file nella tabella dedicata
 * quando la visita referenziata esiste gia nel database.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({TherapeuticPlanVisitImageService.class, TherapeuticPlanVisitImageMapper.class})
@Transactional
class TherapeuticPlanVisitImageServiceIntegrationTest {

    @Autowired
    private TherapeuticPlanVisitImageService imageService;

    @Autowired
    private TherapeuticPlanVisitImageRepository imageRepository;

    @Autowired
    private TherapeuticPlanVisitRepository visitRepository;

    @Test
    void shouldPersistImageBytesForExistingVisit() {
        Long therapeuticPlanId = 99991L;
        LocalDateTime visitDate = LocalDateTime.of(2026, 5, 17, 10, 30);
        visitRepository.save(TherapeuticPlanVisitEntity.builder()
                .therapeuticPlanId(therapeuticPlanId)
                .date(visitDate)
                .caregiver("relative")
                .clinicalCenter("Centro Test")
                .neurologist("Neurologo Test")
                .gastroenterologist("Gastroenterologo Test")
                .type("outpatient")
                .priority("none")
                .jsonVisit("{}")
                .build());

        byte[] imageBytes = "fake-png-content".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "visit-image.png",
                "image/png",
                imageBytes
        );

        TherapeuticPlanVisitImageDto saved = imageService.saveImage(therapeuticPlanId, visitDate, file, "Immagine di test");

        assertThat(saved.getId()).isNotNull();

        List<TherapeuticPlanVisitImageEntity> persistedImages = imageRepository
                .findByTherapeuticPlanIdAndVisitDate(therapeuticPlanId, visitDate);

        assertThat(persistedImages).hasSize(1);
        assertThat(persistedImages.get(0).getImageName()).isEqualTo("visit-image.png");
        assertThat(persistedImages.get(0).getImageType()).isEqualTo("image/png");
        assertThat(persistedImages.get(0).getDescription()).isEqualTo("Immagine di test");
        assertThat(persistedImages.get(0).getImageData()).containsExactly(imageBytes);
    }
}