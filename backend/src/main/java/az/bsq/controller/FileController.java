package az.bsq.controller;

import az.bsq.service.impl.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('TEACHER','SCHOOL_ADMIN','ADMIN')")
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file) throws Exception {
        String url = fileStorageService.upload(file);
        return ResponseEntity.ok(Map.of("url", url));
    }
}
