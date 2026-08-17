package com.qtm.tenants.user.service;

import com.qtm.commonlib.dto.UserDto;
import com.qtm.commonlib.dto.UserRoleProjectDto;
import com.qtm.tenants.mail.MailService;
import com.qtm.tenants.otp.service.UserOtpService;
import com.qtm.tenants.user.dto.UserOnboardingRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

/**
 * Service orchestratore per la creazione utente tenant: provisioning remoto, associazione user_role_project e invio mail iniziale.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserOnboardingService {

    private final UserRemoteService userRemoteService;
    private final DashboardUserRoleProjectClient dashboardUserRoleProjectClient;
    private final MailService mailService;
    private final UserOtpService userOtpService;

    @Value("${qtm.dashboard.frontend-base-url:http://localhost:4200}")
    private String dashboardFrontendBaseUrl;

    /**
     * Esegue l'onboarding completo di un utente creato dal wizard tenant utilizzando i servizi remoti gia presenti.
     */
    public UserDto onboard(UserOnboardingRequest request) {
        validateRequest(request);

        log.info("[UserOnboardingService] Avvio onboarding username={}, email={}, clientId={}, roleId={}, tenantId={}, projectId={}",
            request.getUsername(), request.getEmail(), request.getClientId(), request.getRoleId(),
            request.getTenantId(), request.getProjectId());

        request.setTemporaryPassword(false);
        request.setSkipOnboardingMail(true); // Disabilita mail automatica da QTMDB: TENAPP gestisce l'invio personalizzato
        UserDto createdUser = userRemoteService.create(request);
        if (createdUser.getId() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Creazione utente completata senza identificativo restituito");
        }

        UserRoleProjectDto relation = new UserRoleProjectDto();
        relation.setUserId(createdUser.getId());
        relation.setTenantId(request.getTenantId());
        relation.setRoleId(request.getRoleId());
        relation.setProjectId(request.getProjectId());
        dashboardUserRoleProjectClient.create(relation);

        log.info("[UserOnboardingService] Utente creato e associato username={}, userId={}, tenantId={}, roleId={}, projectId={}",
            createdUser.getUsername(), createdUser.getId(), relation.getTenantId(), relation.getRoleId(), relation.getProjectId());

        sendOnboardingMail(createdUser);
        userOtpService.sendOtpWhenConfigured(createdUser);

        createdUser.setPassword(null);
        createdUser.setTemporaryPassword(false);
        return createdUser;
    }

    private void validateRequest(UserOnboardingRequest request) {
        if (request == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Richiesta onboarding mancante");
        }
        if (isBlank(request.getUsername())) {
            throw new ResponseStatusException(BAD_REQUEST, "Username obbligatorio");
        }
        if (isBlank(request.getEmail())) {
            throw new ResponseStatusException(BAD_REQUEST, "Email obbligatoria per l'invio delle credenziali");
        }
        if (isBlank(request.getClientId())) {
            throw new ResponseStatusException(BAD_REQUEST, "Client del tenant mancante");
        }
        if (isBlank(request.getRoleId())) {
            throw new ResponseStatusException(BAD_REQUEST, "Ruolo obbligatorio");
        }
        if (request.getTenantId() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Tenant obbligatorio");
        }
        if (request.getProjectId() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Progetto obbligatorio");
        }
    }

    private void sendOnboardingMail(UserDto createdUser) {
        String generatedPassword = createdUser.getPassword();
        if (isBlank(generatedPassword)) {
            throw new ResponseStatusException(BAD_REQUEST, "Password temporanea non disponibile per l'invio della mail");
        }

//        String subject = "Accesso Tenants App";
//        String body = "Ciao,\n\n"
//                + "il tuo account e' stato creato con successo.\n"
//            + "URL di accesso: " + dashboardFrontendBaseUrl + "\n"
//                + "Username: " + createdUser.getUsername() + "\n"
//                + "Password temporanea: " + generatedPassword + "\n\n"
//            + "Ti consigliamo di cambiare la password dopo il primo accesso.\n";
//
//        mailService.sendSimpleMail(createdUser.getEmail(), subject, body);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}