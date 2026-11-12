package com.taleb.portfolio.contact;

import java.time.Instant;
import java.util.List;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taleb.portfolio.common.NotFoundException;
import com.taleb.portfolio.common.Texts;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Service
public class ContactService {

	private final ContactMessageRepository repository;
	private final ApplicationEventPublisher events;

	ContactService(ContactMessageRepository repository, ApplicationEventPublisher events) {
		this.repository = repository;
		this.events = events;
	}

	@Transactional
	public void submit(ContactRequest request) {
		ContactMessage saved = repository.save(new ContactMessage(Texts.clean(request.name()),
				Texts.clean(request.email()), Texts.clean(request.subject()), request.message().strip()));
		events.publishEvent(new ContactNotifier.ContactReceivedEvent(saved.getId(), saved.getName(), saved.getEmail(),
				saved.getSubject(), saved.getMessage()));
	}

	@Transactional(readOnly = true)
	public List<ContactMessageView> list() {
		return repository.findAllByOrderByCreatedAtDesc().stream().map(ContactMessageView::from).toList();
	}

	@Transactional(readOnly = true)
	public long unreadCount() {
		return repository.countByReadAtIsNull();
	}

	@Transactional
	public ContactMessageView markRead(Long id, boolean read) {
		ContactMessage message = load(id);
		message.setReadAt(read ? Instant.now() : null);
		return ContactMessageView.from(message);
	}

	@Transactional
	public void delete(Long id) {
		repository.delete(load(id));
	}

	private ContactMessage load(Long id) {
		return repository.findById(id).orElseThrow(() -> new NotFoundException("Message introuvable"));
	}

	/** Formulaire public. {@code website} est un piège à robots : il doit rester vide. */
	public record ContactRequest(
			@NotBlank(message = "Votre nom est obligatoire") @Size(max = 120) String name,
			@NotBlank(message = "Votre e-mail est obligatoire") @Email(message = "E-mail invalide") @Size(max = 160) String email,
			@Size(max = 200) String subject,
			@NotBlank(message = "Le message est obligatoire") @Size(min = 10, max = 5000,
					message = "Entre 10 et 5000 caractères") String message,
			String website) {
	}

	public record ContactMessageView(Long id, String name, String email, String subject, String message,
			Instant createdAt, Instant readAt) {

		static ContactMessageView from(ContactMessage m) {
			return new ContactMessageView(m.getId(), m.getName(), m.getEmail(), m.getSubject(), m.getMessage(),
					m.getCreatedAt(), m.getReadAt());
		}
	}
}
