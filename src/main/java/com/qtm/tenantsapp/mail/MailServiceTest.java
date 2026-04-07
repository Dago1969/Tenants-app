package com.qtm.tenantsapp.mail;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Test di esempio per MailService.
 * ATTENZIONE: Questo test invia realmente una mail, quindi è disabilitato di default.
 */
@SpringBootTest
public class MailServiceTest {
    @Autowired
    private MailService mailService;

    @Test
    @Disabled("Abilita solo per test reali: invia una mail!")
    void testSendSimpleMail() {
        mailService.sendSimpleMail("destinatario@email.com", "Test oggetto", "Test corpo messaggio");
    }
}
