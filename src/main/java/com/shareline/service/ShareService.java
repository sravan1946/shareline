package com.shareline.service;

import com.shareline.entity.File;
import com.shareline.entity.User;
import com.shareline.repository.FileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ShareService {

    private final FileRepository fileRepository;

    public ShareService(FileRepository fileRepository) {
        this.fileRepository = fileRepository;
    }

    @Transactional
    public String createShareToken(Long fileId, User user, Integer expirationDays) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("File not found or access denied");
        }

        String shareToken = UUID.randomUUID().toString();
        file.setShareToken(shareToken);

        if (expirationDays != null && expirationDays > 0) {
            file.setShareExpiresAt(LocalDateTime.now().plusDays(expirationDays));
        } else {
            file.setShareExpiresAt(null);
        }

        fileRepository.save(file);
        return shareToken;
    }

    @Transactional
    public void revokeShareToken(Long fileId, User user) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("File not found or access denied");
        }

        file.setShareToken(null);
        file.setShareExpiresAt(null);
        fileRepository.save(file);
    }

    public File getFileByShareToken(String shareToken) {
        return fileRepository.findByShareToken(shareToken)
                .filter(file -> !file.isShareExpired())
                .orElseThrow(() -> new RuntimeException("Share link not found or expired"));
    }
}

