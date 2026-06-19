package com.neobank.controller;

import com.neobank.entity.User;
import com.neobank.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // ✅ GET PROFILE
    @GetMapping("/me")
    public User getMyProfile(Authentication authentication) {

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ✅ UPDATE PROFILE
    @PutMapping("/me")
    public User updateMyProfile(
            Authentication authentication,
            @RequestBody User req) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Only allow safe updates
        user.setFullName(req.getFullName());

        return userRepository.save(user);
    }
}