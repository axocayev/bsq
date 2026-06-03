package az.bsq.property;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "jwt")
@Getter
@Setter
public class JwtProperties {
    private String secret;
    private long accessTokenExpiryMinutes = 60;
    private long refreshTokenExpiryDays = 7;
    private String issuer = "bsq-exam-portal";
}
