package ExpenseClaim.repository;

import ExpenseClaim.entity.ApprovalStep;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ApprovalStepRepository extends JpaRepository<ApprovalStep, Long> {

    void deleteByClaim_ClaimId(Long claimId);

    Optional<ApprovalStep> findFirstByClaim_ClaimIdAndStatus(
            Long claimId,
            String status
    );
}