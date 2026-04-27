package com.qtm.tenants.otp.service;

import com.qtm.commonlib.dto.UserDto;
import com.qtm.tenants.otp.dto.OtpPhoneVerificationCheckRequest;
import com.qtm.tenants.otp.dto.OtpPhoneVerificationSendRequest;
import com.qtm.tenants.otp.config.TwilioVerifyProperties;
import com.qtm.tenants.otp.dto.OtpVerificationCheckRequest;
import com.qtm.tenants.otp.dto.OtpVerificationResultResponse;
import com.qtm.tenants.user.service.UserRemoteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

/**
 * Service applicativo che aggancia Twilio Verify agli utenti TENAPP e al loro onboarding.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserOtpService {

    private final UserRemoteService userRemoteService;
    private final TwilioVerifyClient twilioVerifyClient;
    private final TwilioVerifyProperties twilioVerifyProperties;

    public OtpVerificationResultResponse sendOtpForUser(Long userId) {
        UserDto user = userRemoteService.findById(userId);
        return sendOtpForUser(user);
    }

    public OtpVerificationResultResponse sendOtpForUser(UserDto user) {
        OtpTargetResolver.OtpDeliveryTarget target = OtpTargetResolver.resolve(user, twilioVerifyProperties.getDefaultChannel());
        TwilioVerifyClient.TwilioVerificationResource verification = twilioVerifyClient.startVerification(target.destination(), target.channel());
        log.info("[UserOtpService] OTP avviato userId={} channel={} status={}", user.getId(), target.channel(), verification.status());
        return toResponse(user.getId(), verification);
    }

    public OtpVerificationResultResponse sendOtpForPhone(OtpPhoneVerificationSendRequest request) {
        OtpTargetResolver.OtpDeliveryTarget target = OtpTargetResolver.resolvePhone(
                request.getPhoneNumber(),
                request.getChannel(),
                twilioVerifyProperties.getDefaultChannel()
        );
        TwilioVerifyClient.TwilioVerificationResource verification = twilioVerifyClient.startVerification(target.destination(), target.channel());
        log.info("[UserOtpService] OTP avviato phone={} channel={} status={}", maskDestination(target.destination()), target.channel(), verification.status());
        return toResponse(null, verification);
    }

    public OtpVerificationResultResponse checkOtpForUser(Long userId, OtpVerificationCheckRequest request) {
        if (request == null || request.getCode() == null || request.getCode().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Codice OTP obbligatorio");
        }

        UserDto user = userRemoteService.findById(userId);
        OtpTargetResolver.OtpDeliveryTarget target = OtpTargetResolver.resolve(user, twilioVerifyProperties.getDefaultChannel());
        TwilioVerifyClient.TwilioVerificationResource verification = twilioVerifyClient.checkVerification(target.destination(), request.getCode().trim());
        log.info("[UserOtpService] OTP verificato userId={} status={} approved={}", userId, verification.status(), isApproved(verification));
        return toResponse(userId, verification);
    }

    public OtpVerificationResultResponse checkOtpForPhone(OtpPhoneVerificationCheckRequest request) {
        if (request == null || request.getCode() == null || request.getCode().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Codice OTP obbligatorio");
        }

        OtpTargetResolver.OtpDeliveryTarget target = OtpTargetResolver.resolvePhone(
                request.getPhoneNumber(),
                request.getChannel(),
                twilioVerifyProperties.getDefaultChannel()
        );
        TwilioVerifyClient.TwilioVerificationResource verification = twilioVerifyClient.checkVerification(target.destination(), request.getCode().trim());
        log.info("[UserOtpService] OTP verificato phone={} status={} approved={}", maskDestination(target.destination()), verification.status(), isApproved(verification));
        return toResponse(null, verification);
    }

    public void sendOtpWhenConfigured(UserDto user) {
        if (user == null || user.getId() == null) {
            return;
        }

        if (!twilioVerifyProperties.isAutoSendOnOnboarding()) {
            log.info("[UserOtpService] Invio OTP onboarding disabilitato da configurazione per userId={}", user.getId());
            return;
        }

        if (!twilioVerifyClient.isEnabledAndConfigured()) {
            log.info("[UserOtpService] Twilio Verify non configurato: onboarding OTP saltato per userId={}", user.getId());
            return;
        }

        try {
            sendOtpForUser(user);
        } catch (ResponseStatusException exception) {
            log.warn("[UserOtpService] OTP onboarding non inviato per userId={} reason={}", user.getId(), exception.getReason());
        }
    }

    private OtpVerificationResultResponse toResponse(Long userId, TwilioVerifyClient.TwilioVerificationResource verification) {
        return OtpVerificationResultResponse.builder()
                .userId(userId)
                .destination(maskDestination(verification.to()))
                .channel(verification.channel())
                .status(verification.status())
                .approved(isApproved(verification))
                .verificationSid(verification.sid())
                .build();
    }

    private boolean isApproved(TwilioVerifyClient.TwilioVerificationResource verification) {
        return "approved".equalsIgnoreCase(verification.status()) || Boolean.TRUE.equals(verification.valid());
    }

    private String maskDestination(String destination) {
        if (destination == null || destination.isBlank()) {
            return "";
        }
        String trimmed = destination.trim();
        int atIndex = trimmed.indexOf('@');
        if (atIndex > 1) {
            return trimmed.charAt(0) + "***" + trimmed.substring(atIndex - 1);
        }
        if (trimmed.length() <= 4) {
            return "****";
        }
        return "***" + trimmed.substring(trimmed.length() - 4);
    }
}