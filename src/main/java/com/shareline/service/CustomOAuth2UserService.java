package com.shareline.service;

import com.shareline.entity.User;
import com.shareline.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Map;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final Logger logger = LoggerFactory.getLogger(CustomOAuth2UserService.class);
    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        Map<String, Object> attributes = oAuth2User.getAttributes();
        String googleId = (String) attributes.get("sub");
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");

        logger.info("Loading OAuth2User for googleId: {}", googleId);

        User user = userRepository.findByGoogleId(googleId)
                .orElseGet(() -> {
                    logger.info("Creating new user for googleId: {}, email: {}", googleId, email);
                    User newUser = new User();
                    newUser.setGoogleId(googleId);
                    newUser.setEmail(email != null ? email : "");
                    newUser.setName(name != null ? name : (email != null ? email : "User"));
                    User saved = userRepository.save(newUser);
                    logger.info("Created user with ID: {}", saved.getId());
                    return saved;
                });

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
            logger.info("Updating user info for googleId: {}", googleId);
            userRepository.save(user);
        }

        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                "sub"
        );
    }
}

