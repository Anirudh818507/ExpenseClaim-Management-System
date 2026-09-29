package ExpenseClaim.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ----------------------------------------------------------------
    // Helper: builds the standard error response body
    // ----------------------------------------------------------------
    private Map<String, Object> buildBody(
            HttpStatus status,
            String error,
            String message,
            String path) {

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status",    status.value());
        body.put("error",     error);
        body.put("message",   message);
        body.put("path",      path);
        return body;
    }

    // ----------------------------------------------------------------
    // 404 – Resource not found
    // All services throw RuntimeException("... not found ...")
    // ----------------------------------------------------------------
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(
            RuntimeException ex,
            HttpServletRequest request) {

        String msg = ex.getMessage() != null ? ex.getMessage() : "Resource not found";

        // Distinguish "not found" vs "bad business rule" by message content
        if (msg.toLowerCase().contains("not found")) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(buildBody(
                            HttpStatus.NOT_FOUND,
                            "Not Found",
                            msg,
                            request.getRequestURI()));
        }

        // Other RuntimeExceptions (e.g. "already approved", "claim ID is required")
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildBody(
                        HttpStatus.BAD_REQUEST,
                        "Bad Request",
                        msg,
                        request.getRequestURI()));
    }

    // ----------------------------------------------------------------
    // 400 – Malformed JSON body
    // ----------------------------------------------------------------
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleNotReadable(
            HttpMessageNotReadableException ex,
            HttpServletRequest request) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildBody(
                        HttpStatus.BAD_REQUEST,
                        "Bad Request",
                        "Malformed or missing request body",
                        request.getRequestURI()));
    }

    // ----------------------------------------------------------------
    // 400 – @Valid / @Validated bean validation failures
    // ----------------------------------------------------------------
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        String errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildBody(
                        HttpStatus.BAD_REQUEST,
                        "Validation Failed",
                        errors,
                        request.getRequestURI()));
    }

    // ----------------------------------------------------------------
    // 400 – Path variable type mismatch (e.g. /api/employees/abc)
    // ----------------------------------------------------------------
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request) {

        String msg = "Invalid value '" + ex.getValue()
                + "' for parameter '" + ex.getName() + "'";

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildBody(
                        HttpStatus.BAD_REQUEST,
                        "Bad Request",
                        msg,
                        request.getRequestURI()));
    }

    // ----------------------------------------------------------------
    // 500 – Catch-all for anything unexpected
    // ----------------------------------------------------------------
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(
            Exception ex,
            HttpServletRequest request) {

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildBody(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Internal Server Error",
                        "An unexpected error occurred",
                        request.getRequestURI()));
    }
}