package com.taleb.portfolio.content.project;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.taleb.portfolio.common.SectionEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "project")
public class Project extends SectionEntity {

	public enum Status {
		DONE, IN_PROGRESS
	}

	@Column(nullable = false, unique = true, length = 80)
	private String slug;

	@Column(nullable = false, length = 120)
	private String title;

	@Column(length = 300)
	private String tagline;

	@Column(length = 200)
	private String context;

	@Column(length = 80)
	private String period;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private Status status = Status.DONE;

	@Column(columnDefinition = "text")
	private String summary;

	@Column(columnDefinition = "text")
	private String description;

	@Column(columnDefinition = "text")
	private String role;

	@JdbcTypeCode(SqlTypes.ARRAY)
	@Column(nullable = false, columnDefinition = "text[]")
	private List<String> highlights = new ArrayList<>();

	@JdbcTypeCode(SqlTypes.ARRAY)
	@Column(nullable = false, columnDefinition = "text[]")
	private List<String> stack = new ArrayList<>();

	/** Couches de l'architecture, une par ligne au format « Nom | description ». */
	@JdbcTypeCode(SqlTypes.ARRAY)
	@Column(nullable = false, columnDefinition = "text[]")
	private List<String> architecture = new ArrayList<>();

	@Column(name = "repo_url", length = 300)
	private String repoUrl;

	@Column(name = "demo_url", length = 300)
	private String demoUrl;

	@Column(nullable = false)
	private boolean confidential;

	@Column(name = "confidential_note", length = 300)
	private String confidentialNote;

	@Column(nullable = false)
	private boolean featured;

	public String getSlug() {
		return slug;
	}

	public void setSlug(String slug) {
		this.slug = slug;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getTagline() {
		return tagline;
	}

	public void setTagline(String tagline) {
		this.tagline = tagline;
	}

	public String getContext() {
		return context;
	}

	public void setContext(String context) {
		this.context = context;
	}

	public String getPeriod() {
		return period;
	}

	public void setPeriod(String period) {
		this.period = period;
	}

	public Status getStatus() {
		return status;
	}

	public void setStatus(Status status) {
		this.status = status;
	}

	public String getSummary() {
		return summary;
	}

	public void setSummary(String summary) {
		this.summary = summary;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

	public List<String> getHighlights() {
		return highlights;
	}

	public void setHighlights(List<String> highlights) {
		this.highlights = highlights;
	}

	public List<String> getStack() {
		return stack;
	}

	public void setStack(List<String> stack) {
		this.stack = stack;
	}

	public List<String> getArchitecture() {
		return architecture;
	}

	public void setArchitecture(List<String> architecture) {
		this.architecture = architecture;
	}

	public String getRepoUrl() {
		return repoUrl;
	}

	public void setRepoUrl(String repoUrl) {
		this.repoUrl = repoUrl;
	}

	public String getDemoUrl() {
		return demoUrl;
	}

	public void setDemoUrl(String demoUrl) {
		this.demoUrl = demoUrl;
	}

	public boolean isConfidential() {
		return confidential;
	}

	public void setConfidential(boolean confidential) {
		this.confidential = confidential;
	}

	public String getConfidentialNote() {
		return confidentialNote;
	}

	public void setConfidentialNote(String confidentialNote) {
		this.confidentialNote = confidentialNote;
	}

	public boolean isFeatured() {
		return featured;
	}

	public void setFeatured(boolean featured) {
		this.featured = featured;
	}
}
