package com.taleb.portfolio.contact;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.taleb.portfolio.config.AppProperties;

/**
 * Envoie un e-mail au propriétaire du portfolio à chaque nouveau message de contact.
 * Asynchrone (le visiteur n'attend pas le serveur SMTP) et inactif tant que SMTP / NOTIFY_EMAIL
 * ne sont pas configurés. « Répondre » dans la messagerie répond directement au visiteur.
 */
@Component
class ContactNotifier {

	private static final Logger log = LoggerFactory.getLogger(ContactNotifier.class);

	private final ObjectProvider<JavaMailSender> mailSender;
	private final AppProperties.Notifications config;

	ContactNotifier(ObjectProvider<JavaMailSender> mailSender, AppProperties properties) {
		this.mailSender = mailSender;
		this.config = properties.notifications();
	}

	@Async
	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
	void onContactReceived(ContactReceivedEvent event) {
		JavaMailSender sender = mailSender.getIfAvailable();
		if (sender == null || !config.enabled()) {
			log.debug("Notification e-mail non configurée : message #{} enregistré sans e-mail", event.id());
			return;
		}
		try {
			sender.send(buildMessage(event, config));
			log.info("Notification e-mail envoyée pour le message #{}", event.id());
		}
		catch (MailException e) {
			log.warn("Échec de l'envoi de la notification e-mail (message #{} bien enregistré) : {}", event.id(),
					e.getMessage());
		}
	}

	static SimpleMailMessage buildMessage(ContactReceivedEvent event, AppProperties.Notifications config) {
		SimpleMailMessage mail = new SimpleMailMessage();
		mail.setTo(config.emailTo());
		mail.setFrom(config.emailFrom());
		mail.setReplyTo(event.email());
		String subject = event.subject() == null ? "(sans objet)" : event.subject();
		mail.setSubject(oneLine("[Portfolio] Nouveau message de " + event.name() + " : " + subject));
		mail.setText("""
				Nouveau message reçu via le formulaire de contact du portfolio.

				De      : %s <%s>
				Objet   : %s

				%s

				—
				Répondez directement à cet e-mail pour écrire à %s.
				Tous les messages : %s/admin/messages
				""".formatted(event.name(), event.email(), subject, event.message(), event.name(),
				config.siteUrl()));
		return mail;
	}

	/** Empêche l'injection d'en-têtes : un sujet ne doit jamais contenir de retour à la ligne. */
	private static String oneLine(String value) {
		String flat = value.replaceAll("[\\r\\n]+", " ").strip();
		return flat.length() > 180 ? flat.substring(0, 180) + "…" : flat;
	}

	record ContactReceivedEvent(long id, String name, String email, String subject, String message) {
	}
}
