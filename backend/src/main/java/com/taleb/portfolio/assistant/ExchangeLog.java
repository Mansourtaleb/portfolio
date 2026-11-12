package com.taleb.portfolio.assistant;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * Journal des échanges avec l'assistant (question, réponse, sources) et avis des visiteurs.
 * Aucune donnée d'identification n'est conservée : seulement le texte de la question.
 */
@Repository
public class ExchangeLog {

	/** Délai pendant lequel un visiteur peut donner son avis sur une réponse. */
	static final Duration FEEDBACK_WINDOW = Duration.ofHours(24);

	private final JdbcClient jdbc;

	ExchangeLog(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	/** Enregistre l'échange et renvoie l'identifiant + le jeton secret permettant de voter. */
	Saved save(String question, String answer, List<String> sources, String status, String model, long durationMs) {
		String token = UUID.randomUUID().toString();
		Long id = jdbc.sql("""
				insert into assistant_exchange (question, answer, sources, status, feedback_token, model, duration_ms)
				values (:question, :answer, :sources, :status, :token, :model, :duration) returning id""")
				.param("question", question.length() > 500 ? question.substring(0, 500) : question)
				.param("answer", answer)
				.param("sources", sources.toArray(String[]::new))
				.param("status", status)
				.param("token", token)
				.param("model", model)
				.param("duration", (int) Math.min(durationMs, Integer.MAX_VALUE))
				.query(Long.class).single();
		return new Saved(id, token);
	}

	/** Enregistre l'avis si le jeton correspond et que la réponse est récente ; renvoie false sinon. */
	boolean feedback(long id, String token, int value) {
		return jdbc.sql("""
				update assistant_exchange set feedback = :value
				where id = :id and feedback_token = :token and created_at > :limit""")
				.param("value", (short) value).param("id", id).param("token", token)
				.param("limit", Timestamp.from(Instant.now().minus(FEEDBACK_WINDOW)))
				.update() == 1;
	}

	Page page(int page, int size, String filter) {
		String where = switch (filter == null ? "" : filter) {
			case "up" -> "where feedback = 1";
			case "down" -> "where feedback = -1";
			case "errors" -> "where status <> 'ANSWERED'";
			default -> "";
		};
		List<Exchange> items = jdbc.sql("""
				select id, question, answer, sources, status, feedback, model, duration_ms, created_at
				from assistant_exchange %s order by created_at desc limit :size offset :offset""".formatted(where))
				.param("size", size).param("offset", page * size)
				.query((rs, i) -> new Exchange(rs.getLong("id"), rs.getString("question"), rs.getString("answer"),
						List.of((String[]) rs.getArray("sources").getArray()), rs.getString("status"),
						(Integer) rs.getObject("feedback", Integer.class), rs.getString("model"),
						(Integer) rs.getObject("duration_ms", Integer.class),
						rs.getTimestamp("created_at").toInstant()))
				.list();
		Stats stats = jdbc.sql("""
				select count(*) as total,
				       count(*) filter (where feedback = 1)  as up,
				       count(*) filter (where feedback = -1) as down,
				       count(*) filter (where status <> 'ANSWERED') as errors,
				       coalesce(avg(duration_ms) filter (where status = 'ANSWERED'), 0) as avg_ms
				from assistant_exchange""")
				.query((rs, i) -> new Stats(rs.getLong("total"), rs.getLong("up"), rs.getLong("down"),
						rs.getLong("errors"), Math.round(rs.getDouble("avg_ms"))))
				.single();
		long filtered = jdbc.sql("select count(*) from assistant_exchange " + where).query(Long.class).single();
		return new Page(items, stats, page, size, filtered);
	}

	void delete(long id) {
		jdbc.sql("delete from assistant_exchange where id = :id").param("id", id).update();
	}

	record Saved(long id, String token) {
	}

	record Exchange(long id, String question, String answer, List<String> sources, String status, Integer feedback,
			String model, Integer durationMs, Instant createdAt) {
	}

	record Stats(long total, long up, long down, long errors, long avgDurationMs) {
	}

	record Page(List<Exchange> items, Stats stats, int page, int size, long totalItems) {
	}
}
