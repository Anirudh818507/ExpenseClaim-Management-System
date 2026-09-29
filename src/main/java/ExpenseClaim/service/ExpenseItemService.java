package ExpenseClaim.service;

import ExpenseClaim.entity.Claim;
import ExpenseClaim.entity.ExpenseItem;
import ExpenseClaim.repository.ClaimRepository;
import ExpenseClaim.repository.ExpenseItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExpenseItemService {

    private final ExpenseItemRepository expenseItemRepository;
    private final ClaimRepository claimRepository;

    public ExpenseItemService(
            ExpenseItemRepository expenseItemRepository,
            ClaimRepository claimRepository) {

        this.expenseItemRepository = expenseItemRepository;
        this.claimRepository = claimRepository;
    }

    // CREATE
    public ExpenseItem createExpenseItem(ExpenseItem expenseItem) {

        if (expenseItem.getClaim() == null ||
                expenseItem.getClaim().getClaimId() == null) {

            throw new RuntimeException("Claim ID is required");
        }

        Long claimId = expenseItem.getClaim().getClaimId();

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Claim not found with ID: " + claimId
                        ));

        expenseItem.setClaim(claim);

        return expenseItemRepository.save(expenseItem);
    }

    // GET ALL
    public List<ExpenseItem> getAllExpenseItems() {
        return expenseItemRepository.findAll();
    }

    // GET BY ID
    public ExpenseItem getExpenseItemById(Long id) {

        return expenseItemRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Expense item not found with ID: " + id
                        ));
    }

    // UPDATE
    public ExpenseItem updateExpenseItem(
            Long id,
            ExpenseItem expenseItem) {

        ExpenseItem existing = expenseItemRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Expense item not found with ID: " + id
                        ));

        existing.setCategory(expenseItem.getCategory());
        existing.setAmount(expenseItem.getAmount());
        existing.setDescription(expenseItem.getDescription());

        if (expenseItem.getClaim() != null &&
                expenseItem.getClaim().getClaimId() != null) {

            Long claimId = expenseItem.getClaim().getClaimId();

            Claim claim = claimRepository.findById(claimId)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Claim not found with ID: " + claimId
                            ));

            existing.setClaim(claim);
        }

        return expenseItemRepository.save(existing);
    }

    // DELETE
    public void deleteExpenseItem(Long id) {

        if (!expenseItemRepository.existsById(id)) {

            throw new RuntimeException(
                    "Expense item not found with ID: " + id
            );
        }

        expenseItemRepository.deleteById(id);
    }
}