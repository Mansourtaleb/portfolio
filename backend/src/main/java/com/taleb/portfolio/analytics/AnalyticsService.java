package com.taleb.portfolio.analytics;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicReference;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Statistiques de visite respectueuses de la vie privée (dans l'esprit de Plausible) :
 * pas de cookie, pas d'IP stockée, identifiant visiteur haché avec un sel qui change chaque jour
 * (impossible de suivre quelqu'un d'un jour à l'autre). Les robots et les demandes « Do Not Track » sont ignorés.
 */
@Service
public class AnalyticsService {
	private static final SecureRandom RANDOM = new SecureRandom();

	public enum EventType {
		PAGE_VIEW, PROJECT_VIEW, CV_DOWNLOAD, ASSISTANT_QUESTION, CONTACT_MESSAGE
	}

	private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);
	static final ZoneId ZONE = ZoneId.of("Africa/Tunis");
	private static final int RETENTION_DAYS = 400;

	private final JdbcClient jdbc;
	private final AtomicReference<DailySalt> salt = new AtomicReference<>(DailySalt.forToday());

	AnalyticsService(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	/** Enregistre un événement ; ne lève jamais d'exception (les statistiques ne doivent rien casser). */
	public void record(EventType type, HttpServletRequest request, String path, String projectSlug, String referrer) {
		try {
			String userAgent = request.getHeader("User-Agent");
			if (isBot(userAgent) || doesNotWantTracking(request)) {
				return;
			}
			jdbc.sql("""
					insert into analytics_event (type, path, project_slug, referrer_host, device, visitor_hash)
					values (:type, :path, :slug, :referrer, :device, :visitor)""")
					.param("type", type.name())
					.param("path", truncate(path, 200))
					.param("slug", truncate(projectSlug, 80))
					.param("referrer", referrerHost(referrer, request.getServerName()))
					.param("device", device(userAgent))
					.param("visitor", visitorHash(request.getRemoteAddr(), userAgent))
					.update();
		}
		catch (RuntimeException e) {
			log.debug("Statistique non enregistrée : {}", e.toString());
		}
	}

	/** Tableau de bord des statistiques sur les {@code days} derniers jours (comparé à la période précédente). */
	public Report report(int days) {
		Instant to = Instant.now();
		Instant from = to.minus(days, ChronoUnit.DAYS);
		Instant previousFrom = from.minus(days, ChronoUnit.DAYS);
		return new Report(days, totals(from, to), totals(previousFrom, from), daily(from, days), topProjects(from),
				topReferrers(from), devices(from), topPages(from));
	}

	/** Purge quotidienne des événements trop anciens (minimisation des données). */
	@Scheduled(cron = "0 15 3 * * *", zone = "Africa/Tunis")
	void purge() {
		int deleted = jdbc.sql("delete from analytics_event where created_at < :limit")
				.param("limit", Timestamp.from(Instant.now().minus(RETENTION_DAYS, ChronoUnit.DAYS))).update();
		if (deleted > 0) {
			log.info("Statistiques : {} événements anciens supprimés", deleted);
		}
	}

	private Totals totals(Instant from, Instant to) {
		return jdbc.sql("""
				select count(*) filter (where type = 'PAGE_VIEW')          as page_views,
				       count(distinct visitor_hash || to_char(created_at at time zone 'Africa/Tunis', 'YYYYMMDD'))
				                                                            as visitors,
				       count(*) filter (where type = 'PROJECT_VIEW')       as project_views,
				       count(*) filter (where type = 'CV_DOWNLOAD')        as cv_downloads,
				       count(*) filter (where type = 'ASSISTANT_QUESTION') as assistant_questions,
				       count(*) filter (where type = 'CONTACT_MESSAGE')    as contact_messages
				from analytics_event where created_at >= :from and created_at < :to""")
				.param("from", Timestamp.from(from)).param("to", Timestamp.from(to))
				.query((rs, i) -> new Totals(rs.getLong("page_views"), rs.getLong("visitors"),
						rs.getLong("project_views"), rs.getLong("cv_downloads"), rs.getLong("assistant_questions"),
						rs.getLong("contact_messages")))
				.single();
	}

	/** Une ligne par jour, y compris les jours sans visite (generate_series). */
	private List<DayPoint> daily(Instant from, int days) {
		LocalDate start = LocalDate.ofInstant(from, ZONE).plusDays(1);
		return jdbc.sql("""
				select d::date as day,
				       count(e.id) filter (where e.type = 'PAGE_VIEW') as views,
				       count(distinct e.visitor_hash)                 as visitors
				from generate_series(cast(:start as date), cast(:start as date) + (:days - 1), interval '1 day') d
				left join analytics_event e on (e.created_at at time zone 'Africa/Tunis')::date = d::date
				group by d order by d""")
				.param("start", start).param("days", days)
				.query((rs, i) -> new DayPoint(rs.getObject("day", LocalDate.class), rs.getLong("views"),
						rs.getLong("visitors")))
				.list();
	}

	private List<Count> topProjects(Instant from) {
		return jdbc.sql("""
				select coalesce(p.title, e.project_slug) as label, count(*) as total
				from analytics_event e left join project p on p.slug = e.project_slug
				where e.type = 'PROJECT_VIEW' and e.created_at >= :from
				group by 1 order by total desc limit 5""")
				.param("from", Timestamp.from(from)).query(Count.class).list();
	}

	private List<Count> topReferrers(Instant from) {
		return jdbc.sql("""
				select coalesce(referrer_host, 'Accès direct') as label, count(*) as total
				from analytics_event where type = 'PAGE_VIEW' and created_at >= :from
				group by 1 order by total desc limit 6""")
				.param("from", Timestamp.from(from)).query(Count.class).list();
	}

	private List<Count> devices(Instant from) {
		return jdbc.sql("""
				select device as label, count(distinct visitor_hash) as total
				from analytics_event where created_at >= :from group by 1 order by total desc""")
				.param("from", Timestamp.from(from)).query(Count.class).list();
	}

	private List<Count> topPages(Instant from) {
		return jdbc.sql("""
				select path as label, count(*) as total
				from analytics_event where type = 'PAGE_VIEW' and created_at >= :from and path is not null
				group by 1 order by total desc limit 6""")
				.param("from", Timestamp.from(from)).query(Count.class).list();
	}

	String visitorHash(String ip, String userAgent) {
		DailySalt current = salt.updateAndGet(s -> s.day().equals(LocalDate.now(ZONE)) ? s : DailySalt.forToday());
		try {
			MessageDigest sha = MessageDigest.getInstance("SHA-256");
			sha.update(current.value());
			sha.update(String.valueOf(ip).getBytes(StandardCharsets.UTF_8));
			sha.update(String.valueOf(userAgent).getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(sha.digest(), 0, 8);
		}
		catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException(e);
		}
	}

	static boolean isBot(String userAgent) {
		if (userAgent == null || userAgent.isBlank()) {
			return true;
		}
		String ua = userAgent.toLowerCase(Locale.ROOT);
		return ua.contains("bot") || ua.contains("crawl") || ua.contains("spider") || ua.contains("headless")
				|| ua.contains("lighthouse") || ua.contains("curl") || ua.contains("python-requests")
				|| ua.contains("preview");
	}

	static String device(String userAgent) {
		String ua = userAgent == null ? "" : userAgent.toLowerCase(Locale.ROOT);
		if (ua.contains("ipad") || ua.contains("tablet")) {
			return "tablet";
		}
		return ua.contains("mobi") || ua.contains("android") || ua.contains("iphone") ? "mobile" : "desktop";
	}

	/** Domaine du site d'origine (linkedin.com, google.com…), sans le chemin ; null si accès direct ou interne. */
	static String referrerHost(String referrer, String ownHost) {
		if (referrer == null || referrer.isBlank()) {
			return null;
		}
		try {
			String host = URI.create(referrer.strip()).getHost();
			if (host == null) {
				return null;
			}
			host = host.toLowerCase(Locale.ROOT).replaceFirst("^www\\.", "").replaceFirst("^(m|l|lm)\\.", "");
			if (host.equals(ownHost) || host.equals("localhost") || host.startsWith("127.") || host.startsWith("192.168.")) {
				return null;
			}
			return truncate(host, 120);
		}
		catch (IllegalArgumentException e) {
			return null;
		}
	}

	private static boolean doesNotWantTracking(HttpServletRequest request) {
		return "1".equals(request.getHeader("DNT")) || "1".equals(request.getHeader("Sec-GPC"));
	}

	private static String truncate(String value, int max) {
		if (value == null || value.isBlank()) {
			return null;
		}
		String v = value.strip();
		return v.length() > max ? v.substring(0, max) : v;
	}

	private record DailySalt(LocalDate day, byte[] value) {

		static DailySalt forToday() {
			byte[] bytes = new byte[32];
			RANDOM.nextBytes(bytes);
			return new DailySalt(LocalDate.now(ZONE), bytes);
		}
	}

	public record Totals(long pageViews, long visitors, long projectViews, long cvDownloads, long assistantQuestions,
			long contactMessages) {
	}

	public record DayPoint(LocalDate day, long views, long visitors) {
	}

	public record Count(String label, long total) {
	}

	public record Report(int days, Totals totals, Totals previous, List<DayPoint> daily, List<Count> topProjects,
			List<Count> referrers, List<Count> devices, List<Count> topPages) {
	}
}
