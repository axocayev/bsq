package az.bsq.service.impl;

import az.bsq.exception.BsqException;
import az.bsq.property.AnthropicProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiQuestionImportService {

    private final AnthropicProperties props;
    private final ObjectMapper objectMapper;
    private final RestClient.Builder restClientBuilder;

    private static final long MAX_FILE_BYTES = 10 * 1024 * 1024;
    private static final int MAX_TEXT_LENGTH = 50_000;
    private static final String ANTHROPIC_VERSION = "2023-06-01";
    private static final String PROMPT_TEMPLATE = """
            You are an exam question parser. Extract all exam questions from the text below and return ONLY a JSON array with no other text or markdown.

            Each object must have:
            - "text": question body (string, required)
            - "type": one of SINGLE_SELECT, MULTI_SELECT, TRUE_FALSE, OPEN (required)
            - "options": array of {text: string, correct: boolean} — empty [] for OPEN type
            - "explanation": optional string or null

            Rules: SINGLE_SELECT=exactly 1 correct; MULTI_SELECT=2+ correct; TRUE_FALSE=["True","False"]; OPEN=[]. If unsure, set correct=false. Return [] if no questions found.

            Text:
            ---
            {EXTRACTED_TEXT}
            ---
            """;

    public List<ParsedQuestionDto> importFromFile(MultipartFile file) {
        validateFile(file);
        String text = extractText(file);
        if (!StringUtils.hasText(text)) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "EMPTY_DOCUMENT",
                    "No readable text found in the uploaded file");
        }
        return callClaude(text);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BsqException(HttpStatus.BAD_REQUEST, "FILE_REQUIRED", "No file uploaded");
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new BsqException(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE",
                    "File exceeds the 10 MB limit");
        }
        String name = Objects.requireNonNullElse(file.getOriginalFilename(), "").toLowerCase();
        if (!name.endsWith(".pdf") && !name.endsWith(".docx") && !name.endsWith(".txt")) {
            throw new BsqException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_FILE_TYPE",
                    "Only PDF, DOCX, and TXT files are supported");
        }
    }

    private String extractText(MultipartFile file) {
        String name = Objects.requireNonNullElse(file.getOriginalFilename(), "").toLowerCase();
        try {
            if (name.endsWith(".txt")) {
                return new String(file.getBytes(), StandardCharsets.UTF_8);
            } else if (name.endsWith(".pdf")) {
                try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
                    return new PDFTextStripper().getText(doc);
                }
            } else { // .docx
                try (XWPFDocument doc = new XWPFDocument(file.getInputStream())) {
                    return new XWPFWordExtractor(doc).getText();
                }
            }
        } catch (Exception e) {
            log.error("Text extraction failed", e);
            throw new BsqException(HttpStatus.UNPROCESSABLE_ENTITY, "EXTRACTION_FAILED",
                    "Failed to extract text from the file: " + e.getMessage());
        }
    }

    private List<ParsedQuestionDto> callClaude(String extractedText) {
        if (!StringUtils.hasText(props.getApiKey())) {
            throw new BsqException(HttpStatus.SERVICE_UNAVAILABLE, "AI_NOT_CONFIGURED",
                    "AI import is not configured. Please contact your administrator.");
        }

        String truncatedText = extractedText.length() > MAX_TEXT_LENGTH
                ? extractedText.substring(0, MAX_TEXT_LENGTH)
                : extractedText;
        if (truncatedText.length() < extractedText.length()) {
            log.warn("Text truncated from {} to {} characters", extractedText.length(), MAX_TEXT_LENGTH);
        }

        String prompt = buildPrompt(truncatedText);

        Map<String, Object> requestBody = Map.of(
            "model", props.getModel(),
            "max_tokens", props.getMaxTokens(),
            "messages", List.of(Map.of("role", "user", "content", prompt))
        );

        RestClient client = restClientBuilder.build();
        String responseBody;
        try {
            responseBody = client.post()
                .uri(props.getBaseUrl() + "/v1/messages")
                .header("x-api-key", props.getApiKey())
                .header("anthropic-version", ANTHROPIC_VERSION)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);
        } catch (Exception e) {
            log.error("Claude API call failed", e);
            throw new BsqException(HttpStatus.BAD_GATEWAY, "AI_API_ERROR",
                    "Failed to reach the AI service: " + e.getMessage());
        }

        return parseClaudeResponse(responseBody);
    }

    private String buildPrompt(String text) {
        return PROMPT_TEMPLATE.replace("{EXTRACTED_TEXT}", text);
    }

    private List<ParsedQuestionDto> parseClaudeResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String jsonText = root.at("/content/0/text").asText();
            return objectMapper.readValue(jsonText,
                objectMapper.getTypeFactory().constructCollectionType(List.class, ParsedQuestionDto.class));
        } catch (Exception e) {
            log.error("Failed to parse Claude response: {}", responseBody, e);
            throw new BsqException(HttpStatus.UNPROCESSABLE_ENTITY, "AI_PARSE_ERROR",
                    "AI returned an unexpected response format. Please try again.");
        }
    }

    @Data
    public static class ParsedOptionDto {
        private String text;
        private boolean correct;
    }

    @Data
    public static class ParsedQuestionDto {
        private String text;
        private String type;
        private List<ParsedOptionDto> options;
        private String explanation;
    }
}
