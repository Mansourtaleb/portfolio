package com.taleb.portfolio.content.education;

import com.taleb.portfolio.common.SectionEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "education")
public class Education extends SectionEntity {

	@Column(nullable = false, length = 200)
	private String degree;

	@Column(length = 200)
	private String field;

	@Column(nullable = false, length = 160)
	private String school;

	@Column(length = 120)
	private String location;

	@Column(length = 80)
	private String period;

	@Column(length = 80)
	private String mention;

	@Column(columnDefinition = "text")
	private String description;

	public String getDegree() {
		return degree;
	}

	public void setDegree(String degree) {
		this.degree = degree;
	}

	public String getField() {
		return field;
	}

	public void setField(String field) {
		this.field = field;
	}

	public String getSchool() {
		return school;
	}

	public void setSchool(String school) {
		this.school = school;
	}

	public String getLocation() {
		return location;
	}

	public void setLocation(String location) {
		this.location = location;
	}

	public String getPeriod() {
		return period;
	}

	public void setPeriod(String period) {
		this.period = period;
	}

	public String getMention() {
		return mention;
	}

	public void setMention(String mention) {
		this.mention = mention;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}
}
