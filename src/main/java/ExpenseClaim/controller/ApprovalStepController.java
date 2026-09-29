package ExpenseClaim.controller;

import ExpenseClaim.entity.ApprovalStep;
import ExpenseClaim.service.ApprovalStepService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/approval-steps")
public class ApprovalStepController {

    private final ApprovalStepService service;

    public ApprovalStepController(ApprovalStepService service) {
        this.service = service;
    }

    @PostMapping
    public ApprovalStep createApproval(@RequestBody ApprovalStep approvalStep) {
        return service.createApproval(approvalStep);
    }

    @GetMapping
    public List<ApprovalStep> getAllApprovals() {
        return service.getAllApprovals();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApprovalStep> getApprovalById(@PathVariable Long id) {

        ApprovalStep step = service.getApprovalById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Approval step not found with ID: " + id));

        return ResponseEntity.ok(step);
    }

    @PutMapping("/{id}")
    public ApprovalStep updateApproval(
            @PathVariable Long id,
            @RequestBody ApprovalStep approvalStep) {

        return service.updateApproval(id, approvalStep);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApproval(@PathVariable Long id) {
        service.deleteApproval(id);
        return ResponseEntity.noContent().build();
    }
}