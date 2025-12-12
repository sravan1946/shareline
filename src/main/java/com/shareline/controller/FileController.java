package com.shareline.controller;

import com.shareline.dto.FileInfo;
import com.shareline.dto.FileUploadResponse;
import com.shareline.entity.File;
import com.shareline.entity.User;
import com.shareline.repository.UserRepository;
import com.shareline.service.FileService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;
    private final UserRepository userRepository;

    public FileController(FileService fileService, UserRepository userRepository) {
        this.fileService = fileService;
        this.userRepository = userRepository;
    }

    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal OAuth2User principal) throws IOException {
        
        User user = getCurrentUser(principal);
        FileUploadResponse response = fileService.uploadFile(file, user);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<FileInfo>> getUserFiles(@AuthenticationPrincipal OAuth2User principal) {
        User user = getCurrentUser(principal);
        List<FileInfo> files = fileService.getUserFiles(user);
        return ResponseEntity.ok(files);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Long id,
            @AuthenticationPrincipal OAuth2User principal) throws IOException {
        
        User user = getCurrentUser(principal);
        File file = fileService.getFileByIdAndUser(id, user);
        Resource resource = fileService.loadFileAsResource(file);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.getMimeType() != null ? file.getMimeType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getOriginalFilename() + "\"")
                .body(resource);
    }

    @GetMapping("/{id}/preview")
    public ResponseEntity<Resource> previewFile(
            @PathVariable Long id,
            @AuthenticationPrincipal OAuth2User principal) throws IOException {
        
        User user = getCurrentUser(principal);
        File file = fileService.getFileByIdAndUser(id, user);
        Resource resource = fileService.loadFileAsResource(file);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.getMimeType() != null ? file.getMimeType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getOriginalFilename() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteFile(
            @PathVariable Long id,
            @AuthenticationPrincipal OAuth2User principal) throws IOException {
        
        User user = getCurrentUser(principal);
        fileService.deleteFile(id, user);
        return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
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

