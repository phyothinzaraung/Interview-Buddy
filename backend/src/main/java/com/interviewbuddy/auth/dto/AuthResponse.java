package com.interviewbuddy.auth.dto;

public record AuthResponse(String accessToken, String tokenType, long expiresInSeconds, UserProfileResponse user) {
}
