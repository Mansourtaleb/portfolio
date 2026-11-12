package com.taleb.portfolio.content.language;

import com.taleb.portfolio.common.SectionEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "spoken_language")
public class SpokenLanguage extends SectionEntity {

	@Column(nullable = false, length = 60)
	private String name;

	@Column(nullable = false, length = 80)
	private String level;

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getLevel() {
		return level;
	}

	public void setLevel(String level) {
		this.level = level;
	}
}
