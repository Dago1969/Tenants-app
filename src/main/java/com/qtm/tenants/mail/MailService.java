package com.qtm.tenants.mail;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Service dedicato all'invio delle email applicative tramite configurazione SMTP di Spring.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    /**
     * Invia una mail testuale semplice verso il destinatario specificato.
     */
    public void sendSimpleMail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.info("[MailService] Email inviata a {} con oggetto {}", to, subject);
        } catch (Exception exception) {
            log.error("[MailService] Errore durante l'invio della mail a {}", to, exception);
            throw new IllegalStateException("Errore durante l'invio della mail di onboarding", exception);
        }
    }
}