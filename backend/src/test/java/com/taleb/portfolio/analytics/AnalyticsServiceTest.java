package com.taleb.portfolio.analytics;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class AnalyticsServiceTest {

	private static final String CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36";
	private static final String IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148";

	@Test
	void referrerKeepsOnlyExternalDomain() {
		assertEquals("linkedin.com", AnalyticsService.referrerHost("https://www.linkedin.com/in/someone?trk=x", "monsite.dev"));
		assertEquals("linkedin.com", AnalyticsService.referrerHost("https://lm.linkedin.com/l?u=abc", "monsite.dev"));
		assertNull(AnalyticsService.referrerHost("https://monsite.dev/projects/x", "monsite.dev"));
		assertNull(AnalyticsService.referrerHost("http://localhost:4200/", "localhost"));
		assertNull(AnalyticsService.referrerHost("pas une url", "monsite.dev"));
	}

	@Test
	void detectsBotsAndDevices() {
		assertTrue(AnalyticsService.isBot("Googlebot/2.1 (+http://www.google.com/bot.html)"));
		assertTrue(AnalyticsService.isBot(null));
		assertFalse(AnalyticsService.isBot(CHROME));
		assertEquals("mobile", AnalyticsService.device(IPHONE));
		assertEquals("desktop", AnalyticsService.device(CHROME));
	}

	@Test
	void visitorHashIsStableWithinADayAndHidesTheIp() {
		AnalyticsService service = new AnalyticsService(null);
		String a = service.visitorHash("41.226.10.1", CHROME);

		assertEquals(a, service.visitorHash("41.226.10.1", CHROME));
		assertNotEquals(a, service.visitorHash("41.226.10.2", CHROME));
		assertEquals(16, a.length());
		assertFalse(a.contains("41"), "le hachage ne doit pas laisser apparaître l'IP");
	}
}
