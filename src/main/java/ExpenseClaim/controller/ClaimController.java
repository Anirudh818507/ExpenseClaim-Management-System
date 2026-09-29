package ExpenseClaim.controller;

import ExpenseClaim.entity.Claim;
import ExpenseClaim.service.ClaimService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/claims")
public class ClaimController {

    private final ClaimService service;

    public ClaimController(ClaimService service) {
        this.service = service;
    }

    // CREATE
    @PostMapping
    public Claim createClaim(@RequestBody Claim claim) {
        return service.createClaim(claim);
    }

    // GET ALL
    @GetMapping
    public List<Claim> getAllClaims() {
        return service.getAllClaims();
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Claim> getClaimById(
            @PathVariable Long id) {

        return ResponseEntity.ok(service.getClaimById(id));
    }

    // UPDATE
    @PutMapping("/{id}")
    public Claim updateClaim(
            @PathVariable Long id,
            @RequestBody Claim claim) {

        return service.updateClaim(id, claim);
    }

    // APPROVE CLAIM
    @PutMapping("/{id}/approve")
    public ResponseEntity<Claim> approveClaim(
            @PathVariable Long id) {

        return ResponseEntity.ok(service.approveClaim(id));
    }

    // REJECT CLAIM
    @PutMapping("/{id}/reject")
    public ResponseEntity<Claim> rejectClaim(
            @PathVariable Long id,
            @RequestBody(required = false) RejectRequest request) {

        String remarks = (request != null) ? request.getRemarks() : null;
        return ResponseEntity.ok(service.rejectClaim(id, remarks));
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteClaim(
            @PathVariable Long id) {

        service.deleteClaim(id);

        return ResponseEntity.ok(
                "Claim deleted successfully"
        );
    }

    // Request body for rejection
    public static class RejectRequest {

        private String remarks;

        public RejectRequest() {
        }

        public String getRemarks() {
            return remarks;
        }

        public void setRemarks(String remarks) {
            this.remarks = remarks;
        }
    }
}