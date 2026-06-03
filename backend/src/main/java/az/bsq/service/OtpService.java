package az.bsq.service;

import org.springframework.stereotype.Service;

@Service
public class OtpService {

    public String generateOtp() {
        int otpValue = (int) (Math.random() * 1_000_000);
        return String.format("%06d", otpValue);
    }
}
