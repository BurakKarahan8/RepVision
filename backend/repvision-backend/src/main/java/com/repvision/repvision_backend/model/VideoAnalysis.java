package com.repvision.repvision_backend.model;

import com.repvision.repvision_backend.model.enums.AnalysisStatus;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "video_analysis")
@Data
public class VideoAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String exerciseName;

    @Column(nullable = false, length = 512)
    private String videoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AnalysisStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime completedAt;

    // --- Analiz Sonuçları (Python bunları dolduracak) ---
    private Integer correctReps;
    private Integer wrongReps;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        status = AnalysisStatus.PENDING;
    }
}