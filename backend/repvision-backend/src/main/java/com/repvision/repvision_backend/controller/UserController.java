package com.repvision.repvision_backend.controller;

import com.repvision.repvision_backend.model.User;
import com.repvision.repvision_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register-push-token")
    public ResponseEntity<?> registerPushToken(
            @RequestBody Map<String, String> payload,
            Authentication authentication) {

        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Kullanıcı bulunamadı"));

        String pushToken = payload.get("pushToken");
        if (pushToken == null || pushToken.isEmpty()) {
            return ResponseEntity.badRequest().body("pushToken eksik.");
        }

        user.setPushToken(pushToken);
        userRepository.save(user);

        return ResponseEntity.ok().body("Push token başarıyla kaydedildi.");
    }
}