package ExpenseClaim.service;

import ExpenseClaim.entity.ApprovalStep;
import ExpenseClaim.entity.Claim;
import ExpenseClaim.repository.ApprovalStepRepository;
import ExpenseClaim.repository.ClaimRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final ApprovalStepRepository approvalStepRepository;

    public ClaimService(
            ClaimRepository claimRepository,
            ApprovalStepRepository approvalStepRepository) {

        this.claimRepository = claimRepository;
        this.approvalStepRepository = approvalStepRepository;
    }

    // CREATE
    public Claim createClaim(Claim claim) {

        if (claim.getStatus() == null || claim.getStatus().isBlank()) {
            claim.setStatus("PENDING");
        }

        return claimRepository.save(claim);
    }

    // GET ALL
    public List<Claim> getAllClaims() {
        return claimRepository.findAll();
    }

    // GET BY ID
    public Claim getClaimById(Long id) {

        return claimRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Claim not found with ID: " + id));
    }

    // UPDATE
    public Claim updateClaim(Long id, Claim claim) {

        Claim existing = claimRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Claim not found with ID: " + id));

        existing.setEmployee(claim.getEmployee());
        existing.setTotalAmount(claim.getTotalAmount());
        existing.setStatus(claim.getStatus());

        return claimRepository.save(existing);
    }

    // APPROVE CLAIM
    @Transactional
    public Claim approveClaim(Long claimId) {

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Claim not found with ID: " + claimId));

        if ("APPROVED".equalsIgnoreCase(claim.getStatus())) {
            throw new RuntimeException(
                    "Claim is already approved");
        }

        if ("REJECTED".equalsIgnoreCase(claim.getStatus())) {
            throw new RuntimeException(
                    "Rejected claim cannot be approved");
        }

        ApprovalStep approvalStep =
                approvalStepRepository
                        .findFirstByClaim_ClaimIdAndStatus(
                                claimId,
                                "PENDING")
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "No pending approval found for claim ID: "
                                                + claimId));

        // Update approval step
        approvalStep.setStatus("APPROVED");
        approvalStep.setRemarks("Approved by manager");

        approvalStepRepository.save(approvalStep);

        // Update claim
        claim.setStatus("APPROVED");

        return claimRepository.save(claim);
    }

    // REJECT CLAIM
    @Transactional
    public Claim rejectClaim(Long claimId, String remarks) {

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Claim not found with ID: " + claimId));

        if ("APPROVED".equalsIgnoreCase(claim.getStatus())) {
            throw new RuntimeException(
                    "Approved claim cannot be rejected");
        }

        if ("REJECTED".equalsIgnoreCase(claim.getStatus())) {
            throw new RuntimeException(
                    "Claim is already rejected");
        }

        ApprovalStep approvalStep =
                approvalStepRepository
                        .findFirstByClaim_ClaimIdAndStatus(
                                claimId,
                                "PENDING")
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "No pending approval found for claim ID: "
                                                + claimId));

        // Update approval step
        approvalStep.setStatus("REJECTED");

        if (remarks == null || remarks.isBlank()) {
            approvalStep.setRemarks("Rejected by manager");
        } else {
            approvalStep.setRemarks(remarks);
        }

        approvalStepRepository.save(approvalStep);

        // Update claim
        claim.setStatus("REJECTED");

        return claimRepository.save(claim);
    }

    // DELETE
    @Transactional
    public void deleteClaim(Long id) {

        if (!claimRepository.existsById(id)) {
            throw new RuntimeException(
                    "Claim not found with ID: " + id);
        }

        // Delete approval steps linked to this claim
        approvalStepRepository.deleteByClaim_ClaimId(id);

        // Delete claim
        claimRepository.deleteById(id);
    }
}