package com.taleb.portfolio.common;

import java.util.Optional;

/** Détection du vrai format d'une image par ses premiers octets (on ne fait confiance ni au nom ni au Content-Type). */
public final class ImageTypes {

	private ImageTypes() {
	}

	public static Optional<String> detect(byte[] b) {
		if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E'
				&& b[10] == 'B' && b[11] == 'P') {
			return Optional.of("image/webp");
		}
		if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') {
			return Optional.of("image/png");
		}
		if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
			return Optional.of("image/jpeg");
		}
		return Optional.empty();
	}
}
