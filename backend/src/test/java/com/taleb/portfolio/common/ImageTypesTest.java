package com.taleb.portfolio.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;


class ImageTypesTest {

	@Test
	void detectsRealImageFormatsFromSignature() {
		byte[] webp = "RIFF\0\0\0\0WEBPVP8 ".getBytes(StandardCharsets.ISO_8859_1);
		byte[] png = { (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A };
		byte[] jpeg = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0 };

		assertEquals("image/webp", ImageTypes.detect(webp).orElseThrow());
		assertEquals("image/png", ImageTypes.detect(png).orElseThrow());
		assertEquals("image/jpeg", ImageTypes.detect(jpeg).orElseThrow());
	}

	@Test
	void rejectsNonImages() {
		assertTrue(ImageTypes.detect("<svg onload=alert(1)>".getBytes(StandardCharsets.UTF_8)).isEmpty());
		assertTrue(ImageTypes.detect("%PDF-1.4".getBytes(StandardCharsets.UTF_8)).isEmpty());
	}
}
