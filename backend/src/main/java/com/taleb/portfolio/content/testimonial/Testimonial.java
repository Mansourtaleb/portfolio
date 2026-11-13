package com.taleb.portfolio.content.testimonial;

import com.taleb.portfolio.common.SectionEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/** Recommandation d'un tuteur, encadrant ou collègue (contenu réel saisi par l'admin). */
@Entity
@Table(name = "testimonial")
public class Testimonial extends SectionEntity {

	@Column(nullable = false, length = 120)
	private String author;

	@Column(length = 160)
	private String role;

	@Column(length = 160)
	private String company;

	@Column(length = 160)
	private String relationship;

	@Column(nullable = false, columnDefinition = "text")
	private String quote;

	@Column(name = "linkedin_url", length = 300)
	private String linkedinUrl;

	public String getAuthor() {
		return author;
	}

	public void setAuthor(String author) {
		this.author = author;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

	public String getCompany() {
		return company;
	}

	public void setCompany(String company) {
		this.company = company;
	}

	public String getRelationship() {
		return relationship;
	}

	public void setRelationship(String relationship) {
		this.relationship = relationship;
	}

	public String getQuote() {
		return quote;
	}

	public void setQuote(String quote) {
		this.quote = quote;
	}

	public String getLinkedinUrl() {
		return linkedinUrl;
	}

	public void setLinkedinUrl(String linkedinUrl) {
		this.linkedinUrl = linkedinUrl;
	}
}
