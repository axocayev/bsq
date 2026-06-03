package az.bsq.config;

import az.bsq.property.MinioProperties;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.SetBucketPolicyArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class MinioConfig {

    private final MinioProperties props;

    @Bean
    public MinioClient minioClient() throws Exception {
        MinioClient client = MinioClient.builder()
                .endpoint(props.getEndpoint())
                .credentials(props.getAccessKey(), props.getSecretKey())
                .build();

        boolean exists = client.bucketExists(BucketExistsArgs.builder().bucket(props.getBucket()).build());
        if (!exists) {
            client.makeBucket(MakeBucketArgs.builder().bucket(props.getBucket()).build());
            log.info("Created MinIO bucket: {}", props.getBucket());
        }

        String policy = """
                {
                  "Version":"2012-10-17",
                  "Statement":[{
                    "Effect":"Allow",
                    "Principal":{"AWS":["*"]},
                    "Action":["s3:GetObject"],
                    "Resource":["arn:aws:s3:::%s/*"]
                  }]
                }""".formatted(props.getBucket());

        client.setBucketPolicy(SetBucketPolicyArgs.builder()
                .bucket(props.getBucket())
                .config(policy)
                .build());

        return client;
    }
}
