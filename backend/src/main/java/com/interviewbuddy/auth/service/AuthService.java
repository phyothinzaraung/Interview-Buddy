package com.interviewbuddy.auth.service;

import com.interviewbuddy.auth.dto.LoginRequest;
import com.interviewbuddy.auth.dto.RegisterRequest;
import com.interviewbuddy.auth.dto.UserProfileResponse;
import com.interviewbuddy.auth.exception.DuplicateEmailException;
import com.interviewbuddy.auth.exception.InvalidRefreshTokenException;
import com.interviewbuddy.auth.model.RefreshToken;
import com.interviewbuddy.auth.model.UserAccount;
import com.interviewbuddy.auth.repository.RefreshTokenRepository;
import com.interviewbuddy.auth.repository.UserAccountRepository;
import com.interviewbuddy.auth.security.AuthenticatedUser;
import com.interviewbuddy.auth.security.JwtTokenService;
import com.interviewbuddy.auth.security.SecurityProperties;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private final UserAccountRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenService jwtTokenService;
    private final SecurityProperties properties;

    public AuthService(
            UserAccountRepository users,
            RefreshTokenRepository refreshTokens,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtTokenService jwtTokenService,
            SecurityProperties properties) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenService = jwtTokenService;
        this.properties = properties;
    }

    @Transactional
    public AuthSession register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (users.existsByEmail(email)) throw new DuplicateEmailException();
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException("Password must be no more than 72 UTF-8 bytes.");
        }
        UserAccount user;
        try {
            user = users.saveAndFlush(new UserAccount(
                    request.name().strip(), email, passwordEncoder.encode(request.password())));
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateEmailException();
        }
        return issueSession(user);
    }

    @Transactional
    public AuthSession login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new BadCredentialsException("Invalid credentials");
        }
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(email, request.password()));
        AuthenticatedUser principal = (AuthenticatedUser) authentication.getPrincipal();
        UserAccount user = users.findById(principal.getId()).orElseThrow();
        return issueSession(user);
    }

    @Transactional
    public AuthSession refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) throw new InvalidRefreshTokenException();
        RefreshToken current = refreshTokens.findUsableForUpdate(hash(rawRefreshToken), Instant.now())
                .orElseThrow(InvalidRefreshTokenException::new);
        current.revoke();
        return issueSession(current.getUser());
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) return;
        refreshTokens.findByTokenHash(hash(rawRefreshToken)).ifPresent(RefreshToken::revoke);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {
        return users.findById(userId).map(UserProfileResponse::from)
                .orElseThrow(InvalidRefreshTokenException::new);
    }

    private AuthSession issueSession(UserAccount user) {
        String rawToken = createRefreshToken();
        Instant expiry = Instant.now().plus(properties.refreshTokenTtl());
        refreshTokens.save(new RefreshToken(user, hash(rawToken), expiry));
        return new AuthSession(
                jwtTokenService.createAccessToken(user),
                rawToken,
                properties.accessTokenTtl().toSeconds(),
                UserProfileResponse.from(user));
    }

    private String normalizeEmail(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }

    private String createRefreshToken() {
        byte[] bytes = new byte[48];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable.", exception);
        }
    }
}
