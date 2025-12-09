package com.shareline.controller;

import com.shareline.entity.User;
import com.shareline.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/test")
    public Map<String, Object> test() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "API is accessible");
        return response;
    }

    @PostMapping("/logout")
    public Map<String, String> logout() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return response;
    }

    @GetMapping("/user")
    public Map<String, Object> getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
        Map<String, Object> response = new HashMap<>();
        
        // Try multiple ways to get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        OAuth2User oauth2User = principal;
        if (oauth2User == null && authentication != null && authentication.getPrincipal() instanceof OAuth2User) {
            oauth2User = (OAuth2User) authentication.getPrincipal();
        }
        
        // Check if user is actually authenticated (not anonymous)
        boolean isAnonymous = authentication != null && 
                              authentication.getAuthorities().stream()
                                  .anyMatch(a -> a.getAuthority().equals("ROLE_ANONYMOUS"));
        
        if (isAnonymous || oauth2User == null) {
            response.put("authenticated", false);
            response.put("message", "User not authenticated");
            return response;
        }
        
        // We have an OAuth2User, now get the database user
        String googleId = oauth2User.getAttribute("sub");
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        
        if (googleId != null) {
            Optional<User> userOpt = userRepository.findByGoogleId(googleId);
            
            User user;
            if (userOpt.isPresent()) {
                user = userOpt.get();
                // Update user info if changed
                boolean updated = false;
                if (email != null && !email.equals(user.getEmail())) {
                    user.setEmail(email);
                    updated = true;
                }
                if (name != null && !name.equals(user.getName())) {
                    user.setName(name);
                    updated = true;
                }
                if (updated) {
                    user = userRepository.save(user);
                }
            } else {
                // Create user if not exists (fallback in case CustomOAuth2UserService didn't create it)
                user = new User();
                user.setGoogleId(googleId);
                user.setEmail(email != null ? email : "");
                user.setName(name != null ? name : (email != null ? email : "User"));
                user = userRepository.save(user);
            }
            
            response.put("authenticated", true);
            response.put("id", user.getId());
            response.put("email", user.getEmail());
            response.put("name", user.getName());
            return response;
        } else {
            response.put("authenticated", false);
            response.put("message", "Google ID not found in OAuth2User attributes");
            return response;
        }
    }
}

