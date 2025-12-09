package com.shareline.controller;

import com.shareline.dto.ShareRequest;
import com.shareline.entity.File;
import com.shareline.entity.User;
import com.shareline.repository.UserRepository;
import com.shareline.service.FileService;
import com.shareline.service.ShareService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ShareController {

    private final ShareService shareService;
    private final FileService fileService;
    private final UserRepository userRepository;
    private final String baseUrl;

    public ShareController(
            ShareService shareService,
            FileService fileService,
            UserRepository userRepository,
            @Value("${shareline.base-url:http://localhost:8080}") String baseUrl) {
        this.shareService = shareService;
        this.fileService = fileService;
        this.userRepository = userRepository;
        this.baseUrl = baseUrl;
    }

    @PostMapping("/files/{id}/share")
    public ResponseEntity<Map<String, String>> createShareLink(
            @PathVariable Long id,
            @RequestBody(required = false) ShareRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        
        User user = getCurrentUser(principal);
        Integer expirationDays = request != null ? request.getExpirationDays() : null;
        String shareToken = shareService.createShareToken(id, user, expirationDays);
        
        Map<String, String> response = new HashMap<>();
        response.put("shareToken", shareToken);
        response.put("shareUrl", baseUrl + "/share/" + shareToken);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/files/{id}/share")
    public ResponseEntity<Map<String, String>> revokeShareLink(
            @PathVariable Long id,
            @AuthenticationPrincipal OAuth2User principal) {
        
        User user = getCurrentUser(principal);
        shareService.revokeShareToken(id, user);
        return ResponseEntity.ok(Map.of("message", "Share link revoked successfully"));
    }

    @GetMapping("/share/{token}")
    public ResponseEntity<Resource> downloadSharedFile(@PathVariable String token) throws IOException {
        File file = shareService.getFileByShareToken(token);
        Resource resource = fileService.loadFileAsResource(file);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.getMimeType() != null ? file.getMimeType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getOriginalFilename() + "\"")
                .body(resource);
    }

    @GetMapping("/share/{token}/info")
    public ResponseEntity<Map<String, Object>> getSharedFileInfo(@PathVariable String token) {
        File file = shareService.getFileByShareToken(token);
        
        Map<String, Object> info = new HashMap<>();
        info.put("originalFilename", file.getOriginalFilename());
        info.put("fileSize", file.getFileSize());
        info.put("mimeType", file.getMimeType());
        info.put("createdAt", file.getCreatedAt());
        info.put("shareExpiresAt", file.getShareExpiresAt());
        
        return ResponseEntity.ok(info);
    }

    private User getCurrentUser(OAuth2User principal) {
        if (principal == null) {
            throw new RuntimeException("User not authenticated");
        }
        String googleId = principal.getAttribute("sub");
        return userRepository.findByGoogleId(googleId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}

