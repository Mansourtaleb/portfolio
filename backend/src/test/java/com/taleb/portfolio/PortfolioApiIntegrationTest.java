package com.taleb.portfolio;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Tests d'intégration de bout en bout : vraie base PostgreSQL 17 (Testcontainers), migrations Flyway,
 * sécurité JWT, CRUD, validation, contact et statistiques. Docker doit être lancé.
 */
@SpringBootTest(properties = {
		"app.security.admin-username=admin",
		"app.security.admin-password=motdepasse-de-test",
		"app.assistant.embeddings.enabled=false",
		"app.assistant.api-key=",
		"spring.config.import=" })
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class PortfolioApiIntegrationTest {

	@Container
	@ServiceConnection
	static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");

	private static final String BROWSER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140";

	@Autowired
	private WebApplicationContext context;

	@Autowired
	private JdbcClient jdbc;

	private MockMvc mvc;

	/** Jeton partagé : la connexion est limitée à 5 tentatives / 5 min par IP (anti force brute). */
	private static String token;

	@BeforeEach
	void setUp() {
		mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
	}

	@Test
	@DisplayName("Le contenu du CV est servi dès le premier démarrage, sans téléphone ni projet masqué")
	void publicPortfolioIsSeeded() throws Exception {
		mvc.perform(get("/api/public/portfolio"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.profile.fullName").value("Mohamed Mansour TALEB"))
				.andExpect(jsonPath("$.profile.phone").value(nullValue()))
				.andExpect(jsonPath("$.projects[*].slug").value(hasItem("financauto")))
				.andExpect(jsonPath("$.projects[*].slug").value(not(hasItem("shopflow"))))
				.andExpect(jsonPath("$.settings.assistantEnabled").value(false));

		mvc.perform(get("/api/public/projects/financauto"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.confidential").value(true))
				.andExpect(jsonPath("$.repoUrl").value(nullValue()));
		mvc.perform(get("/api/public/projects/shopflow")).andExpect(status().isNotFound());
	}

	@Test
	@DisplayName("L'admin est protégé par JWT : 401 sans jeton ou avec un mauvais mot de passe")
	void adminRequiresJwt() throws Exception {
		mvc.perform(get("/api/admin/projects")).andExpect(status().isUnauthorized());
		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"admin\",\"password\":\"faux\"}"))
				.andExpect(status().isUnauthorized());

		mvc.perform(admin(get("/api/admin/projects")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(4));
	}

	@Test
	@Order(Integer.MAX_VALUE) // en dernier : épuise le quota de connexions
	@DisplayName("Anti force brute : après 5 tentatives, la connexion est bloquée (429)")
	void loginIsRateLimited() throws Exception {
		admin(get("/")); // s'assure que le jeton partagé est déjà obtenu
		int status = 0;
		for (int i = 0; i < 6 && status != 429; i++) {
			status = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
					.content("{\"username\":\"admin\",\"password\":\"essai\"}"))
					.andReturn().getResponse().getStatus();
		}
		assertThat(status).isEqualTo(429);
	}

	@Test
	@DisplayName("CRUD d'une section : créer, masquer (disparaît de la vitrine), supprimer")
	void sectionCrudLifecycle() throws Exception {
		String body = mvc.perform(admin(post("/api/admin/languages")).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Italien\",\"level\":\"A2\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.visible").value(true))
				.andReturn().getResponse().getContentAsString();
		long id = Long.parseLong(extract(body, "\"id\":(\\d+)"));
		// Brouillon : invisible pour les visiteurs tant que ce n'est pas publié.
		mvc.perform(get("/api/public/portfolio")).andExpect(jsonPath("$.languages[*].name").value(not(hasItem("Italien"))));
		publish();

		mvc.perform(get("/api/public/portfolio")).andExpect(jsonPath("$.languages[*].name").value(hasItem("Italien")));

		mvc.perform(admin(put("/api/admin/languages/" + id)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Italien\",\"level\":\"A2\",\"visible\":false}"))
				.andExpect(status().isOk());
		publish();
		mvc.perform(get("/api/public/portfolio"))
				.andExpect(jsonPath("$.languages[*].name").value(not(hasItem("Italien"))));

		mvc.perform(admin(delete("/api/admin/languages/" + id))).andExpect(status().isNoContent());
		mvc.perform(admin(get("/api/admin/languages/" + id))).andExpect(status().isNotFound());
	}

	@Test
	@DisplayName("Brouillon / publication + traduction anglaise avec repli sur le français")
	void draftPublicationAndEnglish() throws Exception {
		publish();
		mvc.perform(admin(put("/api/admin/translations/profile/1")).contentType(MediaType.APPLICATION_JSON)
				.content("{\"headline\":\"Full-Stack Engineer\",\"qualities\":[\"Autonomy\",\"Rigor\"],\"fullName\":\"ignoré\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.headline").value("Full-Stack Engineer"))
				.andExpect(jsonPath("$.fullName").doesNotExist());

		// Brouillon : la vitrine publiée ne change pas, l'aperçu admin si.
		mvc.perform(admin(get("/api/admin/publication"))).andExpect(jsonPath("$.pendingChanges").value(true));
		mvc.perform(get("/api/public/portfolio?lang=en"))
				.andExpect(jsonPath("$.profile.headline").value(not("Full-Stack Engineer")));
		mvc.perform(admin(get("/api/admin/preview/portfolio?lang=en")))
				.andExpect(jsonPath("$.profile.headline").value("Full-Stack Engineer"));

		publish();
		mvc.perform(admin(get("/api/admin/publication"))).andExpect(jsonPath("$.pendingChanges").value(false));
		mvc.perform(get("/api/public/portfolio?lang=en"))
				.andExpect(jsonPath("$.lang").value("en"))
				.andExpect(jsonPath("$.profile.headline").value("Full-Stack Engineer"))
				.andExpect(jsonPath("$.profile.qualities[0]").value("Autonomy"))
				// non traduit : repli sur le français
				.andExpect(jsonPath("$.profile.location").value("Bizerte, Tunisie"));
		mvc.perform(get("/api/public/portfolio"))
				.andExpect(jsonPath("$.profile.headline").value(not("Full-Stack Engineer")));
	}

	@Test
	@DisplayName("Validation : erreurs par champ au format Problem Details")
	void validationErrors() throws Exception {
		mvc.perform(admin(post("/api/admin/projects")).contentType(MediaType.APPLICATION_JSON)
				.content("{\"slug\":\"Mauvais Slug\",\"title\":\"\",\"status\":\"DONE\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.slug").exists())
				.andExpect(jsonPath("$.errors.title").value("Le titre est obligatoire"));

		mvc.perform(admin(post("/api/admin/projects")).contentType(MediaType.APPLICATION_JSON)
				.content("{\"slug\":\"financauto\",\"title\":\"Doublon\",\"status\":\"DONE\"}"))
				.andExpect(status().isConflict());
	}

	@Test
	@DisplayName("Contact : le piège à robots n'enregistre rien, un vrai message est enregistré")
	void contactForm() throws Exception {
		long before = countMessages();
		mvc.perform(post("/api/public/contact").contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Bot\",\"email\":\"bot@spam.io\",\"message\":\"Achetez maintenant !!!\",\"website\":\"x\"}"))
				.andExpect(status().isAccepted());
		assertThat(countMessages()).isEqualTo(before);

		mvc.perform(post("/api/public/contact").contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Recruteuse\",\"email\":\"rh@exemple.tn\",\"subject\":\"Entretien\","
						+ "\"message\":\"Bonjour, êtes-vous disponible pour un entretien ?\"}"))
				.andExpect(status().isAccepted());
		assertThat(countMessages()).isEqualTo(before + 1);
	}

	@Test
	@DisplayName("Statistiques : visite comptée, robots ignorés, rapport admin agrégé")
	void analytics() throws Exception {
		jdbc.sql("delete from analytics_event").update();
		String event = "{\"type\":\"PAGE_VIEW\",\"path\":\"/\",\"referrer\":\"https://www.linkedin.com/feed/\"}";
		mvc.perform(post("/api/public/events").header("User-Agent", BROWSER).contentType(MediaType.APPLICATION_JSON)
				.content(event)).andExpect(status().isNoContent());
		mvc.perform(post("/api/public/events").header("User-Agent", "Googlebot/2.1").contentType(MediaType.APPLICATION_JSON)
				.content(event)).andExpect(status().isNoContent());

		mvc.perform(admin(get("/api/admin/analytics?days=7")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totals.pageViews").value(1))
				.andExpect(jsonPath("$.referrers[0].label").value("linkedin.com"))
				.andExpect(jsonPath("$.daily.length()").value(7));
	}

	@Test
	@DisplayName("Avis sur une réponse de l'assistant : refusé sans le bon jeton")
	void feedbackNeedsValidToken() throws Exception {
		long id = jdbc.sql("""
				insert into assistant_exchange (question, answer, status, feedback_token)
				values ('Test ?', 'Réponse', 'ANSWERED', 'bon-jeton') returning id""").query(Long.class).single();

		mvc.perform(post("/api/public/assistant/feedback").contentType(MediaType.APPLICATION_JSON)
				.content("{\"id\":" + id + ",\"token\":\"mauvais-jeton\",\"value\":1}"))
				.andExpect(status().isNotFound());
		mvc.perform(post("/api/public/assistant/feedback").contentType(MediaType.APPLICATION_JSON)
				.content("{\"id\":" + id + ",\"token\":\"bon-jeton\",\"value\":-1}"))
				.andExpect(status().isNoContent());

		mvc.perform(admin(get("/api/admin/assistant/exchanges?filter=down")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items[0].question").value("Test ?"))
				.andExpect(jsonPath("$.stats.down").value(1));
	}

	private MockHttpServletRequestBuilder admin(MockHttpServletRequestBuilder request) throws Exception {
		if (token == null) {
			token = login();
		}
		return request.header("Authorization", "Bearer " + token);
	}

	private String login() throws Exception {
		String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"admin\",\"password\":\"motdepasse-de-test\"}"))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		return extract(body, "\"token\":\"([^\"]+)\"");
	}

	private void publish() throws Exception {
		mvc.perform(admin(post("/api/admin/publication/publish"))).andExpect(status().isOk());
	}

	private long countMessages() {
		return jdbc.sql("select count(*) from contact_message").query(Long.class).single();
	}

	private static String extract(String json, String regex) {
		Matcher m = Pattern.compile(regex).matcher(json);
		assertThat(m.find()).as("motif %s dans %s", regex, json).isTrue();
		return m.group(1);
	}
}
