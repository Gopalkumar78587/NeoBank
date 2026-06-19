package com.neobank;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Smoke test — does NOT load Spring context to avoid needing DB credentials
 * in CI/offline environments.
 */
class NeoBank360AppApplicationTests {

    @Test
    void applicationClassExists() {
        // Verifies the application entry-point class is on the classpath
        assertTrue(
            NeoBank360AppApplication.class.isAnnotationPresent(
                org.springframework.boot.autoconfigure.SpringBootApplication.class
            )
        );
    }
}
