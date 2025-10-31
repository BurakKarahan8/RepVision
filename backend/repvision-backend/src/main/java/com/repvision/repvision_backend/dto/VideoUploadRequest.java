package com.repvision.repvision_backend.dto;

import lombok.Data;

@Data
public class VideoUploadRequest {
    private String videoUrl;
    private String exerciseName;
}