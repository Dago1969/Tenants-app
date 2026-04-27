package com.qtm.tenants.otp.service;

import com.qtm.commonlib.dto.UserDto;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

/**
 * Classe pura che normalizza canale e destinatario OTP a partire dall'anagrafica utente.
 */
final class OtpTargetResolver {

    private static final String PHONE_PATTERN = "^\\+[1-9]\\d{7,14}$";

    private OtpTargetResolver() {
    }

    static OtpDeliveryTarget resolve(UserDto user, String fallbackChannel) {
        if (user == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Utente mancante per l'operazione OTP");
        }

        String channel = normalizeChannel(user.getCanaleOtp(), fallbackChannel);
        String destination = switch (channel) {
            case "email" -> normalizeEmail(user.getEmail());
            case "sms", "whatsapp", "call" -> normalizePhone(user.getTelefono());
            default -> throw new ResponseStatusException(BAD_REQUEST, "Canale OTP non supportato: " + channel);
        };

        return new OtpDeliveryTarget(channel, destination);
    }

    static OtpDeliveryTarget resolvePhone(String phoneNumber, String requestedChannel, String fallbackChannel) {
        String channel = normalizeChannel(requestedChannel, fallbackChannel);
        if ("email".equals(channel)) {
            throw new ResponseStatusException(BAD_REQUEST, "Il canale email richiede un utente con email associata; usare sms, whatsapp o call");
        }
        return new OtpDeliveryTarget(channel, normalizePhone(phoneNumber));
    }

    private static String normalizeChannel(String requestedChannel, String fallbackChannel) {
        String rawValue = requestedChannel != null && !requestedChannel.isBlank() ? requestedChannel : fallbackChannel;
        if (rawValue == null || rawValue.isBlank()) {
            return "sms";
        }

        String normalized = rawValue.trim().toLowerCase();
        if ("voice".equals(normalized)) {
            return "call";
        }
        if ("telefono".equals(normalized)) {
            return "sms";
        }
        return normalized;
    }

    private static String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Telefono utente obbligatorio per il canale OTP selezionato");
        }
        String normalizedPhone = phone.trim().replace(" ", "");
        if (!normalizedPhone.matches(PHONE_PATTERN)) {
            throw new ResponseStatusException(BAD_REQUEST, "Il telefono OTP deve essere in formato E.164, ad esempio +391234567890");
        }
        return normalizedPhone;
    }

    private static String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Email utente obbligatoria per il canale OTP email");
        }
        return email.trim();
    }

    record OtpDeliveryTarget(String channel, String destination) {
    }
}