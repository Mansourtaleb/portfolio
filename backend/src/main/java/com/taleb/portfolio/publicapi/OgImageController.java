package com.taleb.portfolio.publicapi;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.GradientPaint;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.Ellipse2D;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.imageio.ImageIO;

import org.springframework.context.event.EventListener;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.taleb.portfolio.common.PublishedEvent;

import io.swagger.v3.oas.annotations.tags.Tag;
import tools.jackson.databind.JsonNode;

/**
 * Image d'aperçu 1200×630 pour les partages (LinkedIn, WhatsApp, X…), dessinée côté serveur
 * avec Java2D à partir du contenu publié : nom, titre, compétences clés, initiales.
 * Mise en cache et régénérée à chaque publication.
 */
@Tag(name = "Référencement", description = "sitemap.xml, robots.txt et image d'aperçu de partage")
@RestController
class OgImageController {

	private static final int W = 1200;
	private static final int H = 630;
	private static final Color BG = new Color(0x0B0F19);
	private static final Color INDIGO = new Color(0x6366F1);
	private static final Color CYAN = new Color(0x38BDF8);
	private static final Color TEXT = new Color(0xE2E8F0);
	private static final Color MUTED = new Color(0x94A3B8);

	private final PublicationService publication;
	private final Map<String, byte[]> cache = new ConcurrentHashMap<>();

	OgImageController(PublicationService publication) {
		this.publication = publication;
	}

	@GetMapping(path = "/api/public/og.png", produces = MediaType.IMAGE_PNG_VALUE)
	ResponseEntity<byte[]> image(@RequestParam(defaultValue = "fr") String lang) {
		String key = PublicationService.normalize(lang);
		byte[] png = cache.computeIfAbsent(key, k -> render(publication.published(k)));
		return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG)
				.cacheControl(CacheControl.maxAge(Duration.ofHours(6)).cachePublic()).body(png);
	}

	@EventListener(PublishedEvent.class)
	void onPublished() {
		cache.clear();
	}

	static byte[] render(JsonNode view) {
		JsonNode p = view.get("profile");
		String name = text(p, "fullName", "Portfolio");
		String headline = text(p, "headline", "");
		String location = text(p, "location", "");
		List<String> skills = new ArrayList<>();
		for (JsonNode group : view.withArray("skills")) {
			for (JsonNode item : group.withArray("items")) {
				String s = item.asString().replaceAll("\\s*\\(.*\\)$", "");
				if (skills.size() < 6 && s.length() <= 18) {
					skills.add(s);
				}
			}
		}

		BufferedImage img = new BufferedImage(W, H, BufferedImage.TYPE_INT_RGB);
		Graphics2D g = img.createGraphics();
		g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
		g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
		g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

		// Fond : nuit profonde + halos indigo / cyan + grille légère
		g.setColor(BG);
		g.fillRect(0, 0, W, H);
		g.setPaint(new java.awt.RadialGradientPaint(220, 140, 520, new float[] { 0f, 1f },
				new Color[] { new Color(99, 102, 241, 70), new Color(99, 102, 241, 0) }));
		g.fillRect(0, 0, W, H);
		g.setPaint(new java.awt.RadialGradientPaint(1050, 560, 480, new float[] { 0f, 1f },
				new Color[] { new Color(56, 189, 248, 55), new Color(56, 189, 248, 0) }));
		g.fillRect(0, 0, W, H);
		g.setColor(new Color(99, 102, 241, 18));
		for (int x = 0; x < W; x += 40) {
			g.drawLine(x, 0, x, H);
		}
		for (int y = 0; y < H; y += 40) {
			g.drawLine(0, y, W, y);
		}

		// Pastille initiales avec anneau dégradé
		int cx = 960;
		int cy = 250;
		int r = 120;
		g.setPaint(new GradientPaint(cx - r, cy - r, INDIGO, cx + r, cy + r, CYAN));
		g.fill(new Ellipse2D.Double(cx - r - 8, cy - r - 8, (r + 8) * 2, (r + 8) * 2));
		g.setColor(BG);
		g.fill(new Ellipse2D.Double(cx - r - 2, cy - r - 2, (r + 2) * 2, (r + 2) * 2));
		g.setPaint(new GradientPaint(cx - r, cy - r, INDIGO, cx + r, cy + r, CYAN));
		g.fill(new Ellipse2D.Double(cx - r + 6, cy - r + 6, (r - 6) * 2, (r - 6) * 2));
		g.setColor(Color.WHITE);
		g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 96));
		String initials = initials(name);
		FontMetrics fm = g.getFontMetrics();
		g.drawString(initials, cx - fm.stringWidth(initials) / 2, cy + fm.getAscent() / 2 - 12);

		// Textes
		int x = 80;
		g.setColor(CYAN);
		g.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 24));
		g.drawString("> portfolio", x, 120);
		g.setColor(TEXT);
		g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 64));
		int y = 210;
		for (String line : wrap(g, name, 700)) {
			g.drawString(line, x, y);
			y += 74;
		}
		g.setColor(new Color(0x818CF8));
		g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 30));
		y += 6;
		for (String line : wrap(g, headline, 720)) {
			g.drawString(line, x, y);
			y += 40;
		}

		// Compétences en pastilles
		g.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 22));
		fm = g.getFontMetrics();
		int px = x;
		int py = 500;
		for (String skill : skills) {
			int w = fm.stringWidth(skill) + 28;
			if (px + w > 1120) {
				break;
			}
			g.setColor(new Color(19, 28, 51));
			g.fill(new RoundRectangle2D.Double(px, py, w, 42, 42, 42));
			g.setColor(new Color(51, 65, 85));
			g.setStroke(new BasicStroke(1.5f));
			g.draw(new RoundRectangle2D.Double(px, py, w, 42, 42, 42));
			g.setColor(TEXT);
			g.drawString(skill, px + 14, py + 29);
			px += w + 12;
		}
		if (!location.isEmpty()) {
			g.setColor(MUTED);
			g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 22));
			g.drawString(location, x, 585);
		}
		g.setPaint(new GradientPaint(0, 0, INDIGO, W, 0, CYAN));
		g.fillRect(0, H - 8, W, 8);
		g.dispose();

		try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			ImageIO.write(img, "png", out);
			return out.toByteArray();
		}
		catch (IOException e) {
			throw new UncheckedIOException(e);
		}
	}

	private static List<String> wrap(Graphics2D g, String text, int maxWidth) {
		FontMetrics fm = g.getFontMetrics();
		List<String> lines = new ArrayList<>();
		StringBuilder current = new StringBuilder();
		for (String word : text.split("\\s+")) {
			String candidate = current.isEmpty() ? word : current + " " + word;
			if (fm.stringWidth(candidate) > maxWidth && !current.isEmpty()) {
				lines.add(current.toString());
				current = new StringBuilder(word);
			}
			else {
				current = new StringBuilder(candidate);
			}
		}
		if (!current.isEmpty()) {
			lines.add(current.toString());
		}
		return lines.size() > 2 ? List.of(lines.get(0), lines.get(1) + "…") : lines;
	}

	private static String initials(String name) {
		String[] words = name.trim().split("\\s+");
		String last = words[words.length - 1];
		for (String w : words) {
			if (w.length() > 1 && w.equals(w.toUpperCase())) {
				last = w;
			}
		}
		return (words[0].substring(0, 1) + (last.equals(words[0]) ? "" : last.substring(0, 1))).toUpperCase();
	}

	private static String text(JsonNode node, String field, String fallback) {
		JsonNode v = node == null ? null : node.get(field);
		return v == null || v.isNull() ? fallback : v.asString();
	}
}
