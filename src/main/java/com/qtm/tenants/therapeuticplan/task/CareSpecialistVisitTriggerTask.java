package com.qtm.tenants.therapeuticplan.task;

import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanVisitEntity;
import com.qtm.tenants.therapeuticplan.repository.TherapeuticPlanVisitRepository;
import com.qtm.tenants.therapeuticplan.service.TherapeuticPlanScheduleEngineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Trigger Temporale (Task) per il Care Specialist.
 * Verifica periodicamente le visite pianificate in automatico (PROPOSTO_AUTOMATICO) imminenti
 * e notifica l'operatore o aggiorna lo stato dei promemoria.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CareSpecialistVisitTriggerTask {

    private final TherapeuticPlanVisitRepository visitRepository;

    /**
     * Task pianificato eseguito quotidianamente alle 01:00 AM.
     */
    @Scheduled(cron = "${app.care-specialist.trigger-cron:0 0 1 * * ?}")
    @Transactional(readOnly = true)
    public void executeCareSpecialistTrigger() {
        log.info("Esecuzione Trigger Temporale (Task) per Care Specialist...");
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.plusDays(7);

        List<TherapeuticPlanVisitEntity> upcomingProposedVisits = visitRepository.findByStatusAndDateBetween(
                TherapeuticPlanScheduleEngineService.STATUS_PROPOSTO_AUTOMATICO,
                now,
                threshold
        );

        if (upcomingProposedVisits.isEmpty()) {
            log.info("Trigger Care Specialist: Nessuna visita in proposta automatica nei prossimi 7 giorni.");
            return;
        }

        log.info("Trigger Care Specialist: Trovate {} visite in 'PROPOSTO_AUTOMATICO' pianificate nei prossimi 7 giorni (entro il {}).",
                upcomingProposedVisits.size(), threshold);

        for (TherapeuticPlanVisitEntity visit : upcomingProposedVisits) {
            log.info("Visita proposta per il piano {} il {}: tipo '{}'",
                    visit.getTherapeuticPlanId(), visit.getDate(), visit.getType());
        }
    }
}
