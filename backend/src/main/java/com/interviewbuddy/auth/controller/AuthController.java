package com.interviewbuddy.auth.controller;

import com.interviewbuddy.auth.dto.AuthResponse;
import com.interviewbuddy.auth.dto.LoginRequest;
import com.interviewbuddy.auth.dto.RegisterRequest;
import com.interviewbuddy.auth.dto.UserProfileResponse;
import com.interviewbuddy.auth.security.SecurityProperties;
import com.interviewbuddy.auth.service.AuthService;
import com.interviewbuddy.auth.service.AuthSession;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.time.Duration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String REFRESH_COOKIE = "refresh_token";
    private final AuthService authService;
    private final SecurityProperties properties;
    private final CsrfTokenRepository csrfTokenRepository;

    public AuthController(
            AuthService authService,
            SecurityProperties properties,
            CsrfTokenRepository csrfTokenRepository) {
        this.authService = authService;
        this.properties = properties;
        this.csrfTokenRepository = csrfTokenRepository;
    }

    @GetMapping("/csrf")
    public CsrfTokenResponse csrf(HttpServletRequest request, HttpServletResponse response) {
        CsrfToken token = csrfTokenRepository.generateToken(request);
        csrfTokenRepository.saveToken(token, request, response);
        return new CsrfTokenResponse(token.getToken());
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        return writeSession(authService.register(request), response);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        return writeSession(authService.login(request), response);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken,
            HttpServletResponse response) {
        return writeSession(authService.refresh(refreshToken), response);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken,
            HttpServletResponse response) {
        authService.logout(refreshToken);
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie("", Duration.ZERO).toString());
    }

    @GetMapping("/me")
    public UserProfileResponse me(Authentication authentication) {
        return authService.getProfile(Long.parseLong(authentication.getName()));
    }

    private AuthResponse writeSession(AuthSession session, HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE,
                refreshCookie(session.refreshToken(), properties.refreshTokenTtl()).toString());
        return new AuthResponse(session.accessToken(), "Bearer", session.expiresInSeconds(), session.user());
    }

    private ResponseCookie refreshCookie(String value, Duration maxAge) {
        return ResponseCookie.from(REFRESH_COOKIE, value)
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(maxAge)
                .build();
    }

    public record CsrfTokenResponse(String token) { }
}
