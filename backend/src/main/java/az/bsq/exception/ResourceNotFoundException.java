package az.bsq.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends BsqException {

    public ResourceNotFoundException(String resource, Long id) {
        super(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", resource + " not found with id: " + id);
    }

    public ResourceNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", message);
    }
}
