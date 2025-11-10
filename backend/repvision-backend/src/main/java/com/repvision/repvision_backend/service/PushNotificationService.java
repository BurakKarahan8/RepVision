package com.repvision.repvision_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class PushNotificationService {

    private final String EXPO_PUSH_ENDPOINT = "https://api.expo.dev/v2/push/send";

    public void sendPushNotification(String userPushToken, String title, String message, Long videoId) {
        if (userPushToken == null || userPushToken.isEmpty()) {
            System.out.println("Push token bulunamadı, bildirim gönderilemiyor.");
            return;
        }

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
        headers.set(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        // (Expo Access Token kullanmıyoruz, public API)

        // Expo'nun istediği JSON formatı
        Map<String, Object> body = new HashMap<>();
        body.put("to", userPushToken);
        body.put("title", title);
        body.put("body", message);

        // Bildirime tıklandığında hangi veriyi göndereceği
        Map<String, Object> data = new HashMap<>();
        data.put("relatedVideoId", videoId);
        body.put("data", data);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            System.out.println("Expo Push API'sine bildirim gönderiliyor: " + userPushToken);
            ResponseEntity<String> response = restTemplate.postForEntity(EXPO_PUSH_ENDPOINT, entity, String.class);
            System.out.println("Expo yanıtı: " + response.getBody());
        } catch (Exception e) {
            System.err.println("Push notification gönderilirken HATA oluştu: " + e.getMessage());
        }
    }
}