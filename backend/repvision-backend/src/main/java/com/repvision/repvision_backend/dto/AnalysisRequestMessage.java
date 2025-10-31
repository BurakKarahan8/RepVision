package com.repvision.repvision_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisRequestMessage {
    private Long videoId;
    private String videoUrl;
    private String exerciseName;
}
