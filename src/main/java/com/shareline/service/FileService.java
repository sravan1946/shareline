package com.shareline.service;

import com.shareline.dto.FileInfo;
import com.shareline.dto.FileUploadResponse;
import com.shareline.entity.File;
import com.shareline.entity.User;
import com.shareline.repository.FileRepository;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FileService {

    private final FileRepository fileRepository;
    private final FileStorageService fileStorageService;

    public FileService(FileRepository fileRepository, FileStorageService fileStorageService) {
        this.fileRepository = fileRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public FileUploadResponse uploadFile(MultipartFile multipartFile, User user) throws IOException {
        String storedFilePath = fileStorageService.storeFile(multipartFile, user.getId());
        Path filePath = fileStorageService.loadFile(storedFilePath);

        File file = new File();
        file.setFilename(storedFilePath); // Now stores: userId/filename
        file.setOriginalFilename(multipartFile.getOriginalFilename());
        file.setFilePath(filePath.toString());
        file.setFileSize(multipartFile.getSize());
        file.setMimeType(multipartFile.getContentType());
        file.setUser(user);

        File savedFile = fileRepository.save(file);

        return new FileUploadResponse(
                savedFile.getId(),
                savedFile.getFilename(),
                savedFile.getOriginalFilename(),
                savedFile.getFileSize(),
                "File uploaded successfully"
        );
    }

    public List<FileInfo> getUserFiles(User user) {
        return fileRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toFileInfo)
                .collect(Collectors.toList());
    }

    public File getFileById(Long id) {
        return fileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found"));
    }

    public File getFileByIdAndUser(Long id, User user) {
        File file = getFileById(id);
        if (!file.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("File not found or access denied");
        }
        return file;
    }

    @Transactional
    public void deleteFile(Long id, User user) throws IOException {
        File file = getFileByIdAndUser(id, user);
        fileStorageService.deleteFile(file.getFilename());
        fileRepository.delete(file);
    }

    public Resource loadFileAsResource(File file) throws MalformedURLException {
        Path filePath = fileStorageService.loadFile(file.getFilename());
        Resource resource = new UrlResource(filePath.toUri());
        if (resource.exists() && resource.isReadable()) {
            return resource;
        } else {
            throw new RuntimeException("File not found or not readable");
        }
    }

    private FileInfo toFileInfo(File file) {
        return new FileInfo(
                file.getId(),
                file.getFilename(),
                file.getOriginalFilename(),
                file.getFileSize(),
                file.getMimeType(),
                file.getShareToken(),
                file.getShareExpiresAt(),
                file.getCreatedAt(),
                file.isShareable()
        );
    }
}

