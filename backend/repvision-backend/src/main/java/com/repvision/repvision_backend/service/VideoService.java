package com.repvision.repvision_backend.service;

import com.repvision.repvision_backend.config.RabbitMQConfig;
import com.repvision.repvision_backend.dto.AnalysisCategoryDto;
import com.repvision.repvision_backend.dto.AnalysisSummaryDto;
import com.repvision.repvision_backend.dto.AnalysisRequestMessage;
import com.repvision.repvision_backend.dto.AnalysisResultRequest;
import com.repvision.repvision_backend.dto.VideoUploadRequest;
import com.repvision.repvision_backend.model.User;
import com.repvision.repvision_backend.model.VideoAnalysis;
import com.repvision.repvision_backend.model.enums.AnalysisStatus;
import com.repvision.repvision_backend.repository.UserRepository;
import com.repvision.repvision_backend.repository.VideoAnalysisRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;


import java.time.LocalDateTime;

@Service
public class VideoService {

    @Autowired
    private VideoAnalysisRepository videoAnalysisRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Transactional
    public VideoAnalysis createAnalysisRequest(VideoUploadRequest videoRequest, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Kullanıcı bulunamadı: " + userEmail));
        VideoAnalysis analysis = new VideoAnalysis();
        analysis.setUser(user);
        analysis.setVideoUrl(videoRequest.getVideoUrl());
        analysis.setExerciseName(videoRequest.getExerciseName());
        VideoAnalysis savedAnalysis = videoAnalysisRepository.save(analysis);
        AnalysisRequestMessage message = new AnalysisRequestMessage(
                savedAnalysis.getId(),
                savedAnalysis.getVideoUrl(),
                savedAnalysis.getExerciseName()
        );
        rabbitTemplate.convertAndSend(RabbitMQConfig.QUEUE_NAME, message);

        return savedAnalysis;
    }

    @Transactional
    public void updateAnalysisResults(AnalysisResultRequest resultRequest) {
        VideoAnalysis analysis = videoAnalysisRepository.findById(resultRequest.getVideoId())
                .orElseThrow(() -> new RuntimeException("Video analizi kaydı bulunamadı: " + resultRequest.getVideoId()));
        analysis.setCorrectReps(resultRequest.getCorrectReps());
        analysis.setWrongReps(resultRequest.getWrongReps());
        analysis.setFeedback(resultRequest.getFeedback());
        analysis.setStatus(AnalysisStatus.COMPLETED);
        analysis.setCompletedAt(LocalDateTime.now());
        videoAnalysisRepository.save(analysis);
        System.out.println("Video ID " + resultRequest.getVideoId() + " için analiz sonuçları veritabanına kaydedildi.");
    }

    public List<AnalysisCategoryDto> getAnalysisCategories(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Kullanıcı bulunamadı: " + userEmail));

        return videoAnalysisRepository.findCategoryCountsByUserId(user.getId());
    }

    public AnalysisSummaryDto getAnalysisSummary(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Kullanıcı bulunamadı: " + userEmail));
        List<VideoAnalysis> completedAnalyses = videoAnalysisRepository.findByUserIdAndStatus(
                user.getId(),
                AnalysisStatus.COMPLETED
        );

        long totalVideos = completedAnalyses.size();
        long totalCorrect = completedAnalyses.stream()
                .mapToLong(VideoAnalysis::getCorrectReps)
                .sum();
        long totalWrong = completedAnalyses.stream()
                .mapToLong(VideoAnalysis::getWrongReps)
                .sum();
        double accuracy = 0.0;
        if (totalCorrect + totalWrong > 0) {
            accuracy = ((double) totalCorrect / (totalCorrect + totalWrong)) * 100.0;
        }
        AnalysisSummaryDto summary = new AnalysisSummaryDto();
        summary.setTotalCompletedVideos(totalVideos);
        summary.setTotalCorrectReps(totalCorrect);
        summary.setTotalWrongReps(totalWrong);
        summary.setOverallAccuracy(accuracy);

        summary.setMostCommonMistake("Knee Valgus");

        return summary;
    }

    public List<VideoAnalysis> getVideosByUserAndExercise(String userEmail, String exerciseName) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Kullanıcı bulunamadı: " + userEmail));

        return videoAnalysisRepository.findByUserAndExerciseNameAndStatusOrderByCreatedAtDesc(
                user,
                exerciseName,
                AnalysisStatus.COMPLETED
        );
    }
}