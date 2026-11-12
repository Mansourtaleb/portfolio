package com.taleb.portfolio.contact;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.taleb.portfolio.contact.ContactService.ContactMessageView;

@RestController
@RequestMapping("/api/admin/messages")
class ContactAdminController {

	private final ContactService service;

	ContactAdminController(ContactService service) {
		this.service = service;
	}

	@GetMapping
	List<ContactMessageView> list() {
		return service.list();
	}

	@GetMapping("/unread-count")
	Map<String, Long> unreadCount() {
		return Map.of("count", service.unreadCount());
	}

	@PutMapping("/{id}/read")
	ContactMessageView markRead(@PathVariable Long id, @RequestParam(defaultValue = "true") boolean value) {
		return service.markRead(id, value);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@PathVariable Long id) {
		service.delete(id);
	}
}
