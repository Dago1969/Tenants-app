package com.qtm.tenants.otp.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Proprieta di configurazione per l'integrazione OTP con Twilio Verify.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "qtm.otp.twilio")
public class TwilioVerifyProperties {

    private boolean enabled;
    private boolean autoSendOnOnboarding = true;
    private String baseUrl = "https://verify.twilio.com/v2";
    private String serviceSid;
    private String accountSid;
    private String authToken;
    private String apiKey;
    private String apiSecret;
    private String defaultChannel = "sms";

    public boolean hasApiKeyCredentials() {
        return hasText(apiKey) && hasText(apiSecret);
    }

    public boolean hasAccountCredentials() {
        return hasText(accountSid) && hasText(authToken);
    }

    public boolean isReady() {
        return enabled && hasText(serviceSid) && (hasApiKeyCredentials() || hasAccountCredentials());
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}