package com.repvision.repvision_backend.dto;

import lombok.Data;

@Data
public class AnalysisResultRequest {
    private Long videoId;
    private int correctReps;
    private int wrongReps;
    private String feedback;
}