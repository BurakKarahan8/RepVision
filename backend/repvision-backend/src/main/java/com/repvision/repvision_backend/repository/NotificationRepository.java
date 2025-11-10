package com.repvision.repvision_backend.repository;

import com.repvision.repvision_backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Bir kullanıcının okunmamış tüm bildirimlerini en yeniden eskiye doğru getir
    List<Notification> findByUserIdAndIsReadOrderByCreatedAtDesc(Long userId, boolean isRead);

    long countByUserIdAndIsRead(Long userId, boolean isRead);

}