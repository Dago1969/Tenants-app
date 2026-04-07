package com.qtm.tenantsapp.mail;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Service per l'invio di email tramite SMTP.
 * Utilizza la configurazione spring.mail.* da application.yml.
 * Esempio di utilizzo:
 *   mailService.sendSimpleMail("destinatario@email.com", "Oggetto", "Testo del messaggio");
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    /**
     * Invia una semplice email di testo.
     * @param to destinatario
     * @param subject oggetto
     * @param text corpo del messaggio
     */
    public void sendSimpleMail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.info("Email inviata a {} con oggetto '{}'.", to, subject);
        } catch (Exception e) {
            log.error("Errore durante l'invio della mail a {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Errore invio mail", e);
        }
    }
}
