package az.bsq.model.dto.request.exam_attempt;

import lombok.Data;

@Data
public class StartExamRequest {
    private String otpCode; // required only for NOT_STARTED; blank allowed on resume
}
