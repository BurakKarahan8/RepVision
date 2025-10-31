package com.repvision.repvision_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AnalysisCategoryDto {
    private String exerciseName;
    private Long count;
}