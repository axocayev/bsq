package az.bsq.property;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "anthropic")
public class AnthropicProperties {
    private String apiKey;
    private String model;
    private int maxTokens;
    private String baseUrl;
}
