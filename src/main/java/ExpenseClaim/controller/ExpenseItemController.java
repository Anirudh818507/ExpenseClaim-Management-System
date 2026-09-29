package ExpenseClaim.controller;

import ExpenseClaim.entity.ExpenseItem;
import ExpenseClaim.service.ExpenseItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expense-items")
public class ExpenseItemController {

    private final ExpenseItemService expenseItemService;

    public ExpenseItemController(ExpenseItemService expenseItemService) {
        this.expenseItemService = expenseItemService;
    }

    // CREATE
    @PostMapping
    public ResponseEntity<ExpenseItem> createExpenseItem(
            @RequestBody ExpenseItem expenseItem) {

        return ResponseEntity.ok(
                expenseItemService.createExpenseItem(expenseItem)
        );
    }

    // GET ALL
    @GetMapping
    public ResponseEntity<List<ExpenseItem>> getAllExpenseItems() {

        return ResponseEntity.ok(
                expenseItemService.getAllExpenseItems()
        );
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<ExpenseItem> getExpenseItemById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                expenseItemService.getExpenseItemById(id));
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<ExpenseItem> updateExpenseItem(
            @PathVariable Long id,
            @RequestBody ExpenseItem expenseItem) {

        return ResponseEntity.ok(
                expenseItemService.updateExpenseItem(id, expenseItem)
        );
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteExpenseItem(
            @PathVariable Long id) {

        expenseItemService.deleteExpenseItem(id);

        return ResponseEntity.ok("Expense item deleted successfully");
    }
}