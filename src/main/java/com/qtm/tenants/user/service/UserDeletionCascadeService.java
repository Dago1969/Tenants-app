package com.qtm.tenants.user.service;

import com.qtm.tenants.nurse.repository.NurseRepository;
import com.qtm.tenants.therapeuticplan.repository.TherapeuticPlanNurseAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service per gestire l'eliminazione cascata di un utente.
 * Prima di eliminare l'utente da QTMDB, elimina:
 * 1. Le relazioni piano-infermiera dove l'infermiera ha userid = userId
 * 2. Le infermiere associate a questo userid
 * 3. Le relazioni user_role_project da QTMDB (tramite client remoto)
 * 4. L'utente stesso da QTMDB (tramite client remoto)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserDeletionCascadeService {

    private final NurseRepository nurseRepository;
    private final TherapeuticPlanNurseAssignmentRepository therapeuticPlanNurseAssignmentRepository;
    private final UserRemoteService userRemoteService;
    private final DashboardUserRoleProjectClient dashboardUserRoleProjectClient;

    /**
     * Esegue l'eliminazione cascata di un utente risolvendo tutte le FK.
     * Ordine di eliminazione:
     * 1. Tutte le relazioni piano-infermiera dove l'infermiera è associata a questo userId
     * 2. Le infermiere associate a questo userid
     * 3. Tutte le relazioni user_role_project da QTMDB (tramite client remoto)
     * 4. L'utente da QTMDB (tramite client remoto)
     * 
     * @param userId ID dell'utente da eliminare
     */
    @Transactional
    public void deleteUserWithCascade(Long userId) {
        log.info("[UserDeletionCascadeService] ============ INIZIO ELIMINAZIONE CASCATA userId={} ============", userId);
        try {
            // Step 1: Elimina relazioni piano-infermiera dove l'infermiera ha questo userid
            log.info("[UserDeletionCascadeService] Step 1: Eliminazione relazioni piano-infermiera...");
            deleteTherapeuticPlanNurseAssignments(userId);
            log.info("[UserDeletionCascadeService] Step 1 ✓ Completato");

            // Step 2: Elimina le infermiere associate a questo userid
            log.info("[UserDeletionCascadeService] Step 2: Eliminazione infermiere...");
            deleteNursesAssociatedToUser(userId);
            log.info("[UserDeletionCascadeService] Step 2 ✓ Completato");

            // Step 3: Elimina tutte le relazioni user_role_project da QTMDB
            log.info("[UserDeletionCascadeService] Step 3: Eliminazione relazioni user_role_project da QTMDB...");
            deleteUserRoleProjectRelations(userId);
            log.info("[UserDeletionCascadeService] Step 3 ✓ Completato");

            // Step 4: Elimina l'utente da QTMDB
            log.info("[UserDeletionCascadeService] Step 4: Eliminazione utente da QTMDB...");
            userRemoteService.delete(userId);
            log.info("[UserDeletionCascadeService] Step 4 ✓ Completato");

            log.info("[UserDeletionCascadeService] ============ ELIMINAZIONE CASCATA COMPLETATA CON SUCCESSO userId={} ============", userId);
        } catch (Exception e) {
            log.error("[UserDeletionCascadeService] ============ ERRORE DURANTE ELIMINAZIONE CASCATA userId={} ============", userId, e);
            throw new RuntimeException("Errore durante l'eliminazione dell'utente: " + e.getMessage(), e);
        }
    }

    /**
     * Elimina tutte le relazioni piano-infermiera dove l'infermiera è associata al userId fornito.
     * Questo preserva l'infermiera ma rimuove solo le relazioni con i piani terapeutici.
     * 
     * @param userId ID dell'utente (che potrebbe essere il userid di una infermiera)
     */
    private void deleteTherapeuticPlanNurseAssignments(Long userId) {
        // Trova tutte le infermiere che hanno questo userid
        var infermiere = nurseRepository.findAll().stream()
                .filter(nurse -> userId.toString().equals(nurse.getUserid()))
                .toList();

        if (infermiere.isEmpty()) {
            log.debug("[UserDeletionCascadeService] Nessuna infermiera trovata con userid={}", userId);
            return;
        }

        // Per ogni infermiera, elimina le relazioni con i piani terapeutici
        int deletedCount = 0;
        for (var nurse : infermiere) {
            long count = therapeuticPlanNurseAssignmentRepository.deleteByNurseId(nurse.getId());
            deletedCount += count;
            log.info("[UserDeletionCascadeService] Eliminate {} relazioni piano-infermiera per nurseId={}", count, nurse.getId());
        }

        log.info("[UserDeletionCascadeService] Totale relazioni piano-infermiera eliminate: {} per userId={}", deletedCount, userId);
    }

    /**
     * Elimina tutte le infermiere che hanno il userid fornito.
     * 
     * @param userId ID dell'utente (che è il userid di una o più infermiere)
     */
    private void deleteNursesAssociatedToUser(Long userId) {
        // Trova tutte le infermiere che hanno questo userid
        var infermiere = nurseRepository.findAll().stream()
                .filter(nurse -> userId.toString().equals(nurse.getUserid()))
                .toList();

        if (infermiere.isEmpty()) {
            log.debug("[UserDeletionCascadeService] Nessuna infermiera da eliminare con userid={}", userId);
            return;
        }

        // Elimina tutte le infermiere associate
        for (var nurse : infermiere) {
            nurseRepository.delete(nurse);
            log.info("[UserDeletionCascadeService] Eliminata infermiera nurseId={} con userid={}", nurse.getId(), userId);
        }

        log.info("[UserDeletionCascadeService] Eliminate {} infermiere per userid={}", infermiere.size(), userId);
    }

    /**
     * Elimina tutte le relazioni user_role_project di un utente da QTMDB.
     * Questo è necessario per risolvere i vincoli FK prima di eliminare l'utente.
     * 
     * @param userId ID dell'utente
     */
    private void deleteUserRoleProjectRelations(Long userId) {
        try {
            log.debug("[UserDeletionCascadeService] Eliminazione relazioni user_role_project per userid={}", userId);
            dashboardUserRoleProjectClient.deleteByUserId(userId);
            log.info("[UserDeletionCascadeService] Relazioni user_role_project eliminate per userid={}", userId);
        } catch (Exception e) {
            log.error("[UserDeletionCascadeService] Errore durante eliminazione relazioni user_role_project per userid={}", userId, e);
            throw e;
        }
    }
}
