package com.taleb.portfolio.common;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Adresse IP du client. Derrière un proxy, {@code server.forward-headers-strategy=framework}
 * fait déjà correspondre {@code getRemoteAddr()} à l'en-tête X-Forwarded-For de confiance.
 */
public final class ClientIp {

	private ClientIp() {
	}

	public static String of(HttpServletRequest request) {
		return request.getRemoteAddr();
	}
}
