package com.repvision.repvision_backend.controller;

import com.repvision.repvision_backend.model.Notification;
import com.repvision.repvision_backend.model.User;
import com.repvision.repvision_backend.repository.NotificationRepository;
import com.repvision.repvision_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/my-unread")
    public ResponseEntity<List<Notification>> getMyUnreadNotifications(Authentication authentication) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Kullanıcı bulunamadı"));

        List<Notification> notifications = notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(user.getId(), false);
        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/mark-read/{id}")
    public ResponseEntity<?> markNotificationAsRead(
            @PathVariable Long id,
            Authentication authentication) {

        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Kullanıcı bulunamadı"));

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bildirim bulunamadı"));

        // Güvenlik: Kullanıcı sadece kendi bildirimini okuyabilsin
        if (!notification.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body("Bu bildirime erişim yetkiniz yok.");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
        return ResponseEntity.ok().body("Bildirim okundu olarak işaretlendi.");
    }

    @GetMapping("/my-unread-count")
    public ResponseEntity<Long> getMyUnreadCount(Authentication authentication) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Kullanıcı bulunamadı"));

        long count = notificationRepository.countByUserIdAndIsRead(user.getId(), false);
        return ResponseEntity.ok(count);
    }
}