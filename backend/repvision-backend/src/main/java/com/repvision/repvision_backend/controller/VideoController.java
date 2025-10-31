package com.repvision.repvision_backend.controller;

import com.repvision.repvision_backend.dto.AnalysisResultRequest;
import com.repvision.repvision_backend.dto.VideoUploadRequest;
import com.repvision.repvision_backend.model.VideoAnalysis;
import com.repvision.repvision_backend.service.VideoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.repvision.repvision_backend.dto.AnalysisCategoryDto;
import com.repvision.repvision_backend.dto.AnalysisSummaryDto;
import java.util.List;

@RestController
@RequestMapping("/api/videos")
public class VideoController {

    @Autowired
    private VideoService videoService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadVideo(
            @RequestBody VideoUploadRequest videoRequest,
            Authentication authentication) {

        try {
            String userEmail = authentication.getName();
            VideoAnalysis savedAnalysis = videoService.createAnalysisRequest(videoRequest, userEmail);
            return ResponseEntity.status(201).body(savedAnalysis);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Sunucu hatası: " + e.getMessage());
        }
    }

    @PostMapping("/results")
    public ResponseEntity<?> receiveAnalysisResults(
            @RequestBody AnalysisResultRequest resultRequest) {

        try {
            videoService.updateAnalysisResults(resultRequest);
            return ResponseEntity.ok().body("Sonuçlar başarıyla alındı.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @GetMapping("/my-analysis-categories")
    public ResponseEntity<?> getMyAnalysisCategories(Authentication authentication) {
        try {
            String userEmail = authentication.getName(); // JWT'den kullanıcıyı al
            List<AnalysisCategoryDto> categories = videoService.getAnalysisCategories(userEmail);
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    @GetMapping("/my-videos-by-category")
    public ResponseEntity<?> getMyVideosByCategory(
            Authentication authentication,
            @RequestParam String exerciseName) {

        try {
            String userEmail = authentication.getName(); // JWT'den kullanıcıyı al
            List<VideoAnalysis> videos = videoService.getVideosByUserAndExercise(userEmail, exerciseName);
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    @GetMapping("/my-summary")
    public ResponseEntity<?> getMyAnalysisSummary(Authentication authentication) {
        try {
            String userEmail = authentication.getName(); // JWT'den kullanıcıyı al
            AnalysisSummaryDto summary = videoService.getAnalysisSummary(userEmail);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }
}