package com.repvision.repvision_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Bu bildirim kime ait?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title; // Örn: "Squat Analiziniz Hazır!"

    @Column(nullable = false)
    private String message; // Örn: "6 doğru, 0 yanlış tekrar."

    // Bu bildirime tıklandığında hangi videoya gidecek?
    @Column(nullable = true)
    private Long relatedVideoId;

    @Column(nullable = false)
    private boolean isRead = false; // 'Okundu' olarak işaretlendi mi?

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}