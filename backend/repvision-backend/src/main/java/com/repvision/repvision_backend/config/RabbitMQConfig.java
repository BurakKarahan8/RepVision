package com.repvision.repvision_backend.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String QUEUE_NAME = "video_analysis_queue";

    @Bean
    public Queue videoAnalysisQueue() {
        return new Queue(QUEUE_NAME, false);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }

    @Bean
    ApplicationRunner forceRabbitConnection(RabbitTemplate rabbitTemplate) {
        return args -> {
            try {
                System.out.println("--- RABBITMQ BAĞLANTI TESTİ BAŞLIYOR ---");
                rabbitTemplate.execute(channel -> channel.queueDeclarePassive(QUEUE_NAME));
                System.out.println("--- RABBITMQ BAĞLANTI TESTİ BAŞARILI ---");
            } catch (Exception e) {
                System.err.println("--- RABBITMQ BAĞLANTI TESTİ BAŞARISIZ ---");
                System.err.println(e.getMessage());
            }
        };
    }
}