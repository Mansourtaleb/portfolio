package com.taleb.portfolio.analytics;

import java.time.Duration;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.taleb.portfolio.analytics.AnalyticsService.EventType;
import com.taleb.portfolio.common.ClientIp;
import com.taleb.portfolio.common.RateLimiter;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Tag(name = "Statistiques", description = "Mesure d'audience anonyme sans cookie")
@RestController
class AnalyticsController {

	private final AnalyticsService analytics;
	private final RateLimiter limiter = new RateLimiter(60, Duration.ofMinutes(1));

	AnalyticsController(AnalyticsService analytics) {
		this.analytics = analytics;
	}

	/** Événement envoyé par la vitrine (page vue, projet consulté). Réponse vide, toujours 204. */
	@PostMapping("/api/public/events")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void event(@Valid @RequestBody EventRequest body, HttpServletRequest request) {
		if (body.type() != EventType.PAGE_VIEW && body.type() != EventType.PROJECT_VIEW) {
			return; // les autres événements sont enregistrés uniquement côté serveur
		}
		try {
			limiter.check(ClientIp.of(request), "");
		}
		catch (RuntimeException tooMany) {
			return;
		}
		analytics.record(body.type(), request, body.path(), body.projectSlug(), body.referrer());
	}

	@GetMapping("/api/admin/analytics")
	AnalyticsService.Report report(@RequestParam(defaultValue = "30") int days) {
		return analytics.report(Math.max(1, Math.min(days, 365)));
	}

	record EventRequest(@NotNull EventType type, @Size(max = 200) String path, @Size(max = 80) String projectSlug,
			@Size(max = 500) String referrer) {
	}
}
