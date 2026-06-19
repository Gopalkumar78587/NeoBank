package com.neobank.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Jackson customization using Jackson2ObjectMapperBuilderCustomizer.
 * This works with Spring Boot 4.x and plays nicely with devtools restart.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jacksonCustomizer() {
        return builder -> {
            // Java 8 date/time support (LocalDate, LocalDateTime, etc.)
            builder.modules(new JavaTimeModule());

            // Write dates as ISO strings ("2026-07-01"), not epoch numbers
            builder.featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

            // null → false for boolean, null → 0 for int (instead of failing)
            builder.featuresToDisable(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES);

            // Ignore unknown JSON fields the entity doesn't have
            builder.featuresToDisable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        };
    }
}
