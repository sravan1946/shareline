package com.shareline.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path uploadDir;

    public FileStorageService(@Value("${shareline.upload-dir:./uploads}") String uploadDir) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    public String storeFile(MultipartFile file, Long userId) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("Filename cannot be empty");
        }

        // Create user-specific directory
        Path userDir = uploadDir.resolve(String.valueOf(userId));
        Files.createDirectories(userDir);

        String extension = "";
        int lastDot = originalFilename.lastIndexOf('.');
        if (lastDot > 0) {
            extension = originalFilename.substring(lastDot);
        }

        String uniqueFilename = UUID.randomUUID().toString() + extension;
        Path targetLocation = userDir.resolve(uniqueFilename);
        
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        
        // Return relative path: userId/filename
        return userId + "/" + uniqueFilename;
    }

    public Path loadFile(String filePath) {
        // filePath format: userId/filename
        return uploadDir.resolve(filePath).normalize();
    }

    public void deleteFile(String filePath) throws IOException {
        Path path = loadFile(filePath);
        if (Files.exists(path)) {
            Files.delete(path);
            
            // Try to remove user directory if empty
            Path userDir = path.getParent();
            if (userDir != null && Files.exists(userDir)) {
                try {
                    Files.delete(userDir); // Only succeeds if directory is empty
                } catch (IOException e) {
                    // Directory not empty, ignore
                }
            }
        }
    }

    public boolean fileExists(String filePath) {
        return Files.exists(loadFile(filePath));
    }
}

