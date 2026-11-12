package com.taleb.portfolio.config;

import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

/**
 * Documentation OpenAPI 3 (springdoc) : /v3/api-docs et Swagger UI sur /swagger-ui.html.
 * Deux groupes : l'API publique de la vitrine et l'API d'administration (JWT « Bearer »).
 * Désactivable en production avec SWAGGER_ENABLED=false.
 */
@Configuration(proxyBeanMethods = false)
class OpenApiConfig {

	static final String BEARER = "bearerAuth";

	@Bean
	OpenAPI portfolioOpenApi() {
		return new OpenAPI()
				.info(new Info()
						.title("Portfolio API")
						.version("1.0")
						.description("""
								API du portfolio de Mohamed Mansour TALEB.

								- **Public** : contenu de la vitrine, contact, assistant IA (RAG, réponses en Server-Sent Events).
								- **Admin** : CRUD des sections, médias, statistiques. Se connecter via `POST /api/auth/login`, \
								puis cliquer sur **Authorize** et coller le jeton JWT.""")
						.contact(new Contact().name("Mohamed Mansour TALEB").url("https://github.com/Mansourtaleb")))
				.components(new Components().addSecuritySchemes(BEARER, new SecurityScheme()
						.type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")
						.description("Jeton obtenu via POST /api/auth/login")))
				.addSecurityItem(new SecurityRequirement().addList(BEARER));
	}

	@Bean
	GroupedOpenApi publicApi() {
		return GroupedOpenApi.builder().group("1-public").displayName("API publique (vitrine)")
				.pathsToMatch("/api/public/**", "/api/auth/login").build();
	}

	@Bean
	GroupedOpenApi adminApi() {
		return GroupedOpenApi.builder().group("2-admin").displayName("API d'administration (JWT)")
				.pathsToMatch("/api/admin/**", "/api/auth/**").build();
	}
}
