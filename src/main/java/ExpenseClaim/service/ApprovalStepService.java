package ExpenseClaim.service;

import ExpenseClaim.entity.ApprovalStep;
import ExpenseClaim.entity.Claim;
import ExpenseClaim.repository.ApprovalStepRepository;
import ExpenseClaim.repository.ClaimRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ApprovalStepService {

    private final ApprovalStepRepository repository;
    private final ClaimRepository claimRepository;

    public ApprovalStepService(
            ApprovalStepRepository repository,
            ClaimRepository claimRepository) {

        this.repository = repository;
        this.claimRepository = claimRepository;
    }

    // CREATE
    public ApprovalStep createApproval(ApprovalStep approvalStep) {
        return repository.save(approvalStep);
    }

    // GET ALL
    public List<ApprovalStep> getAllApprovals() {
        return repository.findAll();
    }

    // GET BY ID
    public Optional<ApprovalStep> getApprovalById(Long id) {
        return repository.findById(id);
    }

    // UPDATE
    public ApprovalStep updateApproval(
            Long id,
            ApprovalStep approvalStep) {

        ApprovalStep existing = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Approval not found"));

        existing.setStatus(approvalStep.getStatus());
        existing.setRemarks(approvalStep.getRemarks());

        // Update Claim status based on approval status
        if (existing.getClaim() != null &&
                existing.getClaim().getClaimId() != null) {

            Long claimId = existing.getClaim().getClaimId();

            Claim claim = claimRepository.findById(claimId)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Claim not found with ID: " + claimId
                            ));

            if ("APPROVED".equalsIgnoreCase(
                    approvalStep.getStatus())) {

                claim.setStatus("APPROVED");

            } else if ("REJECTED".equalsIgnoreCase(
                    approvalStep.getStatus())) {

                claim.setStatus("REJECTED");
            }

            claimRepository.save(claim);
        }

        return repository.save(existing);
    }

    // DELETE
    public void deleteApproval(Long id) {

        if (!repository.existsById(id)) {
            throw new RuntimeException(
                    "Approval not found with ID: " + id
            );
        }

        repository.deleteById(id);
    }
}