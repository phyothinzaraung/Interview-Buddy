package com.interviewbuddy.auth.security;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
public record SecurityProperties(
        String jwtSecretBase64,
        String allowedOrigin,
        Duration accessTokenTtl,
        Duration refreshTokenTtl) {
}
