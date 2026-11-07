package com.interviewbuddy.auth.repository;

import com.interviewbuddy.auth.model.RefreshToken;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select token from RefreshToken token join fetch token.user "
            + "where token.tokenHash = :hash and token.revokedAt is null and token.expiresAt > :now")
    Optional<RefreshToken> findUsableForUpdate(@Param("hash") String hash, @Param("now") Instant now);

    Optional<RefreshToken> findByTokenHash(String hash);
}
