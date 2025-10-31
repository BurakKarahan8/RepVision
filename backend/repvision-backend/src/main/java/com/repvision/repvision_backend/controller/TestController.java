package com.repvision.repvision_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/hello")
    public ResponseEntity<String> getProtectedGreeting() {
        return ResponseEntity.ok("Merhaba! JWT ile korunan alana başarıyla girdiniz.");
    }
}
