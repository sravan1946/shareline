package com.shareline.repository;

import com.shareline.entity.File;
import com.shareline.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileRepository extends JpaRepository<File, Long> {
    List<File> findByUserOrderByCreatedAtDesc(User user);
    Optional<File> findByShareToken(String shareToken);
    boolean existsByUserAndId(User user, Long id);
}

