package com.neobank.config;

import com.neobank.entity.User;
import com.neobank.enums.Role;
import com.neobank.repository.UserRepository;

import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    public void createAdminIfNotExists() {

        String adminEmail = "admin@neobank.in";
        String encodedPassword = passwordEncoder.encode("Admin@123");

        userRepository.findByEmail(adminEmail).ifPresentOrElse(admin -> {
            // Re-encode the password on every startup to fix any corrupt hash
            admin.setPasswordHash(encodedPassword);
            userRepository.save(admin);
            System.out.println("✅ Admin password re-encoded on startup");
        }, () -> {
            User admin = User.builder()
                    .email(adminEmail)
                    .fullName("System Admin")
                    .passwordHash(encodedPassword)
                    .role(Role.ADMIN)
                    .isActive(true)
                    .build();

            userRepository.save(admin);
            System.out.println("✅ Admin created successfully");
        });
    }
}
