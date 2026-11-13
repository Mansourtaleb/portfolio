package com.taleb.portfolio.backup;

import java.sql.Array;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taleb.portfolio.common.ContentChangedEvent;

/**
 * Sauvegarde / restauration du contenu éditorial en JSON (profil, réglages, sections, traductions).
 * Les fichiers (photo, CV, captures), les messages et les statistiques ne sont pas concernés.
 * À la restauration, les noms de colonnes viennent du schéma de la base (jamais du fichier) :
 * un fichier piégé ne peut pas injecter de SQL.
 */
@Service
public class BackupService {

	static final String APP = "portfolio-mmt";
	static final int VERSION = 1;
	/** Ordre d'export / import (les tables sont indépendantes entre elles). */
	static final List<String> TABLES = List.of("profile", "site_settings", "skill_group", "experience", "project",
			"education", "certification", "spoken_language", "testimonial", "knowledge_entry", "translation");
	private static final Set<String> SKIPPED_COLUMNS = Set.of("created_at", "updated_at");

	private final JdbcClient jdbc;
	private final ApplicationEventPublisher events;

	BackupService(JdbcClient jdbc, ApplicationEventPublisher events) {
		this.jdbc = jdbc;
		this.events = events;
	}

	@Transactional(readOnly = true)
	public Map<String, Object> export() {
		Map<String, Object> tables = new LinkedHashMap<>();
		for (String table : TABLES) {
			List<Map<String, Object>> rows = jdbc.sql("select * from " + table + " order by id").query().listOfRows();
			tables.put(table, rows.stream().map(BackupService::toJson).toList());
		}
		Map<String, Object> backup = new LinkedHashMap<>();
		backup.put("app", APP);
		backup.put("version", VERSION);
		backup.put("exportedAt", Instant.now().toString());
		backup.put("tables", tables);
		return backup;
	}

	/** Remplace le contenu par celui de la sauvegarde ; renvoie le nombre de lignes par table. */
	@Transactional
	@SuppressWarnings("unchecked")
	public Map<String, Integer> restore(Map<String, Object> backup) {
		if (!APP.equals(backup.get("app")) || !(backup.get("tables") instanceof Map<?, ?> rawTables)) {
			throw new IllegalArgumentException("Ce fichier n'est pas une sauvegarde de ce portfolio.");
		}
		Map<String, Integer> counts = new LinkedHashMap<>();
		for (String table : TABLES) {
			Object raw = rawTables.get(table);
			if (raw == null) {
				continue;
			}
			if (!(raw instanceof List<?> list)) {
				throw new IllegalArgumentException("Format invalide pour la table " + table);
			}
			Map<String, String> columns = columns(table);
			List<Map<String, Object>> rows = new ArrayList<>();
			for (Object row : list) {
				if (!(row instanceof Map<?, ?> m) || !(m.get("id") instanceof Number)) {
					throw new IllegalArgumentException("Ligne invalide dans " + table);
				}
				rows.add((Map<String, Object>) m);
			}
			if ((table.equals("profile") || table.equals("site_settings")) && rows.isEmpty()) {
				throw new IllegalArgumentException("La sauvegarde ne contient pas de " + table + ".");
			}
			Set<Long> ids = rows.stream().map(r -> ((Number) r.get("id")).longValue()).collect(Collectors.toSet());
			// Supprime ce qui n'existe plus, puis insère / met à jour (les captures des projets conservés restent).
			if (ids.isEmpty()) {
				jdbc.sql("delete from " + table).update();
			}
			else {
				jdbc.sql("delete from " + table + " where not (id = any(:ids))")
						.param("ids", ids.toArray(Long[]::new)).update();
			}
			for (Map<String, Object> row : rows) {
				upsert(table, columns, row);
			}
			if (columns.get("id").contains("int") && !table.equals("profile") && !table.equals("site_settings")) {
				jdbc.sql("select setval(pg_get_serial_sequence('" + table + "', 'id'), (select coalesce(max(id), 0) + 1 from "
						+ table + "), false)").query().singleRow();
			}
			counts.put(table, rows.size());
		}
		events.publishEvent(new ContentChangedEvent("backup"));
		return counts;
	}

	private void upsert(String table, Map<String, String> columns, Map<String, Object> row) {
		List<String> cols = row.keySet().stream()
				.filter(columns::containsKey)
				.filter(c -> !SKIPPED_COLUMNS.contains(c))
				.toList();
		String names = String.join(", ", cols);
		String values = cols.stream().map(c -> ":" + c).collect(Collectors.joining(", "));
		String updates = cols.stream().filter(c -> !c.equals("id")).map(c -> c + " = excluded." + c)
				.collect(Collectors.joining(", "));
		updates = updates.isEmpty() ? "updated_at = now()" : updates + ", updated_at = now()";
		var sql = jdbc.sql("insert into " + table + " (" + names + ") values (" + values + ") on conflict (id) do update set "
				+ updates);
		for (String c : cols) {
			Object value = row.get(c);
			if (value instanceof List<?> list) {
				value = list.stream().map(String::valueOf).toArray(String[]::new);
			}
			else if (value instanceof Number n && columns.get(c).equals("smallint")) {
				value = n.shortValue();
			}
			else if (value instanceof Number n && columns.get(c).equals("bigint")) {
				value = n.longValue();
			}
			else if (value instanceof Number n && columns.get(c).equals("integer")) {
				value = n.intValue();
			}
			sql = sql.param(c, value);
		}
		sql.update();
	}

	/** Colonnes réelles de la table (nom → type), lues dans le schéma. */
	private Map<String, String> columns(String table) {
		Map<String, String> result = new LinkedHashMap<>();
		jdbc.sql("select column_name, data_type from information_schema.columns where table_name = :t and table_schema = 'public'")
				.param("t", table)
				.query(rs -> {
					result.put(rs.getString(1), rs.getString(2));
				});
		return result;
	}

	private static Map<String, Object> toJson(Map<String, Object> row) {
		Map<String, Object> out = new LinkedHashMap<>();
		new TreeSet<>(row.keySet()).forEach(key -> {
			Object v = row.get(key);
			try {
				if (v instanceof Array array) {
					v = List.of((Object[]) array.getArray());
				}
				else if (v instanceof Timestamp ts) {
					v = ts.toInstant().toString();
				}
			}
			catch (java.sql.SQLException e) {
				throw new IllegalStateException(e);
			}
			out.put(key, v);
		});
		return out;
	}
}
