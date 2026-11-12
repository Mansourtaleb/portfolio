package com.taleb.portfolio.content.certification;

import com.taleb.portfolio.common.SectionEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "certification")
public class Certification extends SectionEntity {

	@Column(nullable = false, length = 200)
	private String name;

	@Column(nullable = false, length = 120)
	private String issuer;

	@Column(name = "issued_on", length = 40)
	private String issuedOn;

	@Column(name = "credential_url", length = 300)
	private String credentialUrl;

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getIssuer() {
		return issuer;
	}

	public void setIssuer(String issuer) {
		this.issuer = issuer;
	}

	public String getIssuedOn() {
		return issuedOn;
	}

	public void setIssuedOn(String issuedOn) {
		this.issuedOn = issuedOn;
	}

	public String getCredentialUrl() {
		return credentialUrl;
	}

	public void setCredentialUrl(String credentialUrl) {
		this.credentialUrl = credentialUrl;
	}
}
