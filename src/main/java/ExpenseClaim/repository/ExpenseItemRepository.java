package ExpenseClaim.repository;

import ExpenseClaim.entity.ExpenseItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseItemRepository
        extends JpaRepository<ExpenseItem, Long> {
}