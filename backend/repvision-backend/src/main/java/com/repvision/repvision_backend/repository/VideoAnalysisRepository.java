package com.repvision.repvision_backend.repository;

import com.repvision.repvision_backend.dto.AnalysisCategoryDto;
import com.repvision.repvision_backend.model.VideoAnalysis;
import com.repvision.repvision_backend.model.enums.AnalysisStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.repvision.repvision_backend.model.User;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

@Repository
public interface VideoAnalysisRepository extends JpaRepository<VideoAnalysis, Long> {

    List<VideoAnalysis> findByUserId(Long userId);

    @Query("SELECT new com.repvision.repvision_backend.dto.AnalysisCategoryDto(v.exerciseName, COUNT(v)) " +
            "FROM VideoAnalysis v " +
            "WHERE v.user.id = :userId AND v.status = com.repvision.repvision_backend.model.enums.AnalysisStatus.COMPLETED " +
            "GROUP BY v.exerciseName")
    List<AnalysisCategoryDto> findCategoryCountsByUserId(@Param("userId") Long userId);

    List<VideoAnalysis> findByUserIdAndStatus(Long userId, AnalysisStatus status);

    List<VideoAnalysis> findByUserAndExerciseNameAndStatusOrderByCreatedAtDesc(
            User user,
            String exerciseName,
            AnalysisStatus status
    );

}
