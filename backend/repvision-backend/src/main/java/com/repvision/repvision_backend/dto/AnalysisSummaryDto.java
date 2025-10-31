package com.repvision.repvision_backend.dto;

import lombok.Data;

@Data
public class AnalysisSummaryDto {
    private long totalCompletedVideos;
    private long totalCorrectReps;
    private long totalWrongReps;
    private double overallAccuracy;
    private String mostCommonMistake;
}