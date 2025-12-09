package com.shareline.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileInfo {
    private Long id;
    private String filename;
    private String originalFilename;
    private Long fileSize;
    private String mimeType;
    private String shareToken;
    private LocalDateTime shareExpiresAt;
    private LocalDateTime createdAt;
    private boolean shareable;
}

