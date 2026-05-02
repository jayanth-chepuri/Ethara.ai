package com.Ethara.jayanth.controller;

import com.Ethara.jayanth.dto.ApiResponse;
import com.Ethara.jayanth.dto.BudgetRequest;
import com.Ethara.jayanth.dto.BudgetResponse;
import com.Ethara.jayanth.service.BudgetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
@Tag(name = "Budgets", description = "Budget management")
@SecurityRequirement(name = "Bearer Authentication")
public class BudgetController {

    private final BudgetService budgetService;

    @PostMapping
    @Operation(summary = "Set or update monthly budget")
    public ResponseEntity<ApiResponse<BudgetResponse>> setOrUpdateBudget(
            @Valid @RequestBody BudgetRequest request) {
        BudgetResponse response = budgetService.setOrUpdateBudget(request);
        return ResponseEntity.ok(ApiResponse.success("Budget saved successfully", response));
    }

    @GetMapping("/{month}/{year}")
    @Operation(summary = "Get budget for a specific month and year")
    public ResponseEntity<ApiResponse<BudgetResponse>> getBudget(
            @PathVariable int month,
            @PathVariable int year) {
        return ResponseEntity.ok(ApiResponse.success(budgetService.getBudget(month, year)));
    }

    @GetMapping("/year/{year}")
    @Operation(summary = "Get all budgets for a year")
    public ResponseEntity<ApiResponse<List<BudgetResponse>>> getBudgetsForYear(@PathVariable int year) {
        return ResponseEntity.ok(ApiResponse.success(budgetService.getBudgetsForYear(year)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a budget")
    public ResponseEntity<ApiResponse<Void>> deleteBudget(@PathVariable Long id) {
        budgetService.deleteBudget(id);
        return ResponseEntity.ok(ApiResponse.success("Budget deleted", null));
    }
}
