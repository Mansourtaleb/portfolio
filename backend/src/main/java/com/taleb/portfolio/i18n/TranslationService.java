package com.taleb.portfolio.i18n;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taleb.portfolio.common.ContentChangedEvent;

/**
 * Traductions anglaises saisies à la main dans l'admin. Seuls les champs listés ici sont traduisibles ;
 * un champ non traduit retombe sur la version française.
 */
@Service
public class TranslationService {

	public static final String LANG = "en";

	/** Champs traduisibles par type de contenu (les noms propres, URL et technologies ne se traduisent pas). */
	public static final Map<String, Set<String>> FIELDS = Map.of(
			"profile", Set.of("headline", "tagline", "summary", "location", "availability", "qualities", "extras"),
			"settings", Set.of("siteTitle", "metaDescription", "assistantGreeting", "assistantSuggestions"),
			"skills", Set.of("name", "items"),
			"experiences", Set.of("role", "location", "period", "kind", "summary", "highlights"),
			"projects", Set.of("title", "tagline", "context", "period", "summary", "description", "role", "highlights",
					"architecture", "confidentialNote"),
			"education", Set.of("degree", "field", "location", "period", "mention", "description"),
			"certifications", Set.of("name", "issuedOn"),
			"languages", Set.of("name", "level"));

	private final JdbcClient jdbc;
	private final ApplicationEventPublisher events;

	TranslationService(JdbcClient jdbc, ApplicationEventPublisher events) {
		this.jdbc = jdbc;
		this.events = events;
	}

	/** Traductions d'un élément : champ → texte (String) ou liste (List&lt;String&gt;). */
	@Transactional(readOnly = true)
	public Map<String, Object> get(String entity, long id) {
		check(entity);
		Map<String, Object> result = new TreeMap<>();
		jdbc.sql("select field, text_value, list_value from translation where entity = :e and entity_id = :id and lang = :lang")
				.param("e", entity).param("id", id).param("lang", LANG)
				.query(rs -> {
					java.sql.Array list = rs.getArray("list_value");
					result.put(rs.getString("field"),
							list != null ? List.of((String[]) list.getArray()) : rs.getString("text_value"));
				});
		return result;
	}

	/** Toutes les traductions d'un type de contenu : id → (champ → valeur). */
	@Transactional(readOnly = true)
	public Map<Long, Map<String, Object>> all(String entity) {
		Map<Long, Map<String, Object>> result = new TreeMap<>();
		jdbc.sql("select entity_id, field, text_value, list_value from translation where entity = :e and lang = :lang")
				.param("e", entity).param("lang", LANG)
				.query(rs -> {
					java.sql.Array list = rs.getArray("list_value");
					result.computeIfAbsent(rs.getLong("entity_id"), k -> new TreeMap<>()).put(rs.getString("field"),
							list != null ? List.of((String[]) list.getArray()) : rs.getString("text_value"));
				});
		return result;
	}

	/** Remplace les traductions d'un élément (une valeur vide supprime la traduction de ce champ). */
	@Transactional
	public Map<String, Object> save(String entity, long id, Map<String, Object> values) {
		Set<String> allowed = check(entity);
		jdbc.sql("delete from translation where entity = :e and entity_id = :id and lang = :lang")
				.param("e", entity).param("id", id).param("lang", LANG).update();
		values.forEach((field, raw) -> {
			if (!allowed.contains(field) || raw == null) {
				return;
			}
			if (raw instanceof List<?> list) {
				String[] items = list.stream().map(String::valueOf).map(String::strip).filter(s -> !s.isEmpty())
						.toArray(String[]::new);
				if (items.length > 0) {
					insert(entity, id, field, null, items);
				}
			}
			else {
				String text = String.valueOf(raw).strip();
				if (!text.isEmpty()) {
					insert(entity, id, field, text.length() > 10_000 ? text.substring(0, 10_000) : text, null);
				}
			}
		});
		events.publishEvent(new ContentChangedEvent(entity));
		return get(entity, id);
	}

	/** Supprime les traductions orphelines d'un élément supprimé. */
	@Transactional
	public void deleteFor(String entity, long id) {
		jdbc.sql("delete from translation where entity = :e and entity_id = :id").param("e", entity).param("id", id).update();
	}

	private void insert(String entity, long id, String field, String text, String[] list) {
		jdbc.sql("""
				insert into translation (entity, entity_id, field, lang, text_value, list_value)
				values (:e, :id, :field, :lang, :text, :list)""")
				.param("e", entity).param("id", id).param("field", field).param("lang", LANG)
				.param("text", text).param("list", list).update();
	}

	private static Set<String> check(String entity) {
		Set<String> fields = FIELDS.get(entity);
		if (fields == null) {
			throw new IllegalArgumentException("Type de contenu non traduisible : " + entity);
		}
		return fields;
	}
}
