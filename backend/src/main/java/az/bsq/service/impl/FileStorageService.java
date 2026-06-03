package az.bsq.service.impl;

import az.bsq.property.MinioProperties;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final MinioClient minioClient;
    private final MinioProperties props;

    public String upload(MultipartFile file) throws Exception {
        String ext = getExtension(file.getOriginalFilename());
        String objectName = UUID.randomUUID() + ext;

        minioClient.putObject(PutObjectArgs.builder()
                .bucket(props.getBucket())
                .object(objectName)
                .stream(file.getInputStream(), file.getSize(), -1)
                .contentType(file.getContentType())
                .build());

        return props.getPublicUrl() + "/" + props.getBucket() + "/" + objectName;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return "." + filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
