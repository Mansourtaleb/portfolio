package com.taleb.portfolio.auth;

import java.time.Instant;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import com.taleb.portfolio.config.AppProperties;

/** Émet les jetons JWT (HS256) de l'espace admin. */
@Service
class TokenService {

	static final String ISSUER = "portfolio-api";

	private final JwtEncoder encoder;
	private final AppProperties.Security security;

	TokenService(JwtEncoder encoder, AppProperties properties) {
		this.encoder = encoder;
		this.security = properties.security();
	}

	IssuedToken issue(String username) {
		Instant now = Instant.now();
		Instant expiresAt = now.plus(security.jwtTtl());
		JwtClaimsSet claims = JwtClaimsSet.builder()
				.issuer(ISSUER)
				.subject(username)
				.issuedAt(now)
				.expiresAt(expiresAt)
				.claim("scope", "admin")
				.build();
		JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
		String token = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
		return new IssuedToken(token, expiresAt, username);
	}

	record IssuedToken(String token, Instant expiresAt, String username) {
	}
}
