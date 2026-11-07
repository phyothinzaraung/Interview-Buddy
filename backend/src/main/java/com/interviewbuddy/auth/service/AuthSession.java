package com.interviewbuddy.auth.service;

import com.interviewbuddy.auth.dto.UserProfileResponse;

public record AuthSession(
        String accessToken,
        String refreshToken,
        long expiresInSeconds,
        UserProfileResponse user) {
}
