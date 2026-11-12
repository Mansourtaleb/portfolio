package com.taleb.portfolio.common;

/** Publié après chaque modification du contenu de la vitrine (sert à réindexer l'assistant IA). */
public record ContentChangedEvent(String section) {
}
