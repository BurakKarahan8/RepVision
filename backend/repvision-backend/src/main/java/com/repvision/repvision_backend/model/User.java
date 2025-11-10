package com.repvision.repvision_backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "app_users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "push_token", nullable = true, unique = true)
    private String pushToken;
}