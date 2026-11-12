package com.taleb.portfolio.auth;

import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.taleb.portfolio.common.ClientIp;
import com.taleb.portfolio.common.RateLimiter;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Tag(name = "Authentification", description = "Connexion admin (JWT), session et mot de passe")
@RestController
@RequestMapping("/api/auth")
class AuthController {

	private final AdminUserRepository users;
	private final PasswordEncoder passwordEncoder;
	private final TokenService tokens;
	private final RateLimiter loginLimiter = new RateLimiter(5, Duration.ofMinutes(5));
	/** Hash factice : la vérification prend le même temps que l'utilisateur existe ou non. */
	private final String dummyHash;

	AuthController(AdminUserRepository users, PasswordEncoder passwordEncoder, TokenService tokens) {
		this.users = users;
		this.passwordEncoder = passwordEncoder;
		this.tokens = tokens;
		this.dummyHash = passwordEncoder.encode(UUID.randomUUID().toString());
	}

	@PostMapping("/login")
	LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
		loginLimiter.check(ClientIp.of(http), "Trop de tentatives de connexion. Réessayez dans quelques minutes.");
		AdminUser user = users.findByUsername(request.username().strip()).orElse(null);
		String hash = user != null ? user.getPasswordHash() : dummyHash;
		boolean matches = passwordEncoder.matches(request.password(), hash);
		if (user == null || !matches) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Identifiants incorrects");
		}
		TokenService.IssuedToken issued = tokens.issue(user.getUsername());
		return new LoginResponse(issued.token(), issued.expiresAt(), issued.username());
	}

	@GetMapping("/me")
	MeResponse me(@AuthenticationPrincipal Jwt jwt) {
		return new MeResponse(jwt.getSubject(), jwt.getExpiresAt());
	}

	@PutMapping("/password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Transactional
	void changePassword(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ChangePasswordRequest request) {
		AdminUser user = users.findByUsername(jwt.getSubject())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
		if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mot de passe actuel incorrect");
		}
		user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
	}

	record LoginRequest(@NotBlank @Size(max = 60) String username, @NotBlank @Size(max = 200) String password) {
	}

	record LoginResponse(String token, Instant expiresAt, String username) {
	}

	record MeResponse(String username, Instant expiresAt) {
	}

	record ChangePasswordRequest(
			@NotBlank String currentPassword,
			@NotBlank @Size(min = AdminBootstrap.MIN_PASSWORD_LENGTH, max = 200,
					message = "10 caractères minimum") String newPassword) {
	}
}
