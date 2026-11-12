package com.taleb.portfolio.auth;

import java.security.SecureRandom;
import java.util.Base64;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.taleb.portfolio.config.AppProperties;

/**
 * Crée le compte administrateur au premier démarrage, à partir de ADMIN_USERNAME / ADMIN_PASSWORD.
 * Sans mot de passe fourni, un mot de passe aléatoire est généré et affiché une seule fois.
 */
@Component
class AdminBootstrap implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);
	static final int MIN_PASSWORD_LENGTH = 10;

	private final AdminUserRepository repository;
	private final PasswordEncoder passwordEncoder;
	private final AppProperties.Security security;

	AdminBootstrap(AdminUserRepository repository, PasswordEncoder passwordEncoder, AppProperties properties) {
		this.repository = repository;
		this.passwordEncoder = passwordEncoder;
		this.security = properties.security();
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (repository.count() > 0) {
			return;
		}
		String username = security.adminUsername() == null || security.adminUsername().isBlank() ? "admin"
				: security.adminUsername().strip();
		String password = security.adminPassword();
		boolean generated = password == null || password.isBlank();
		if (generated) {
			byte[] bytes = new byte[18];
			new SecureRandom().nextBytes(bytes);
			password = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
		}
		else if (password.length() < MIN_PASSWORD_LENGTH) {
			throw new IllegalStateException("ADMIN_PASSWORD doit contenir au moins " + MIN_PASSWORD_LENGTH + " caractères");
		}
		repository.save(new AdminUser(username, passwordEncoder.encode(password)));
		if (generated) {
			log.warn("Compte admin « {} » créé avec un mot de passe généré : {}  (à changer depuis l'espace admin)",
					username, password);
		}
		else {
			log.info("Compte admin « {} » créé.", username);
		}
	}
}
