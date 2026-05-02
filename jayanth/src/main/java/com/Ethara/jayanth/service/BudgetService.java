package com.Ethara.jayanth.service;

import com.Ethara.jayanth.dto.BudgetRequest;
import com.Ethara.jayanth.dto.BudgetResponse;
import com.Ethara.jayanth.entity.Budget;
import com.Ethara.jayanth.entity.User;
import com.Ethara.jayanth.exception.BadRequestException;
import com.Ethara.jayanth.exception.ResourceNotFoundException;
import com.Ethara.jayanth.repository.BudgetRepository;
import com.Ethara.jayanth.repository.ExpenseRepository;
import com.Ethara.jayanth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional
    public BudgetResponse setOrUpdateBudget(BudgetRequest request) {
        User user = getCurrentUser();
        Optional<Budget> existing = budgetRepository.findByUserIdAndMonthAndYear(
                user.getId(), request.getMonth(), request.getYear());

        Budget budget;
        if (existing.isPresent()) {
            budget = existing.get();
            budget.setAmount(request.getAmount());
        } else {
            budget = Budget.builder()
                    .amount(request.getAmount())
                    .month(request.getMonth())
                    .year(request.getYear())
                    .user(user)
                    .build();
        }
        return toResponse(budgetRepository.save(budget), user.getId());
    }

    public BudgetResponse getBudget(int month, int year) {
        User user = getCurrentUser();
        Budget budget = budgetRepository.findByUserIdAndMonthAndYear(user.getId(), month, year)
                .orElseThrow(() -> new ResourceNotFoundException("No budget set for " + month + "/" + year));
        return toResponse(budget, user.getId());
    }

    public List<BudgetResponse> getBudgetsForYear(int year) {
        User user = getCurrentUser();
        return budgetRepository.findByUserIdAndYear(user.getId(), year)
                .stream()
                .map(b -> toResponse(b, user.getId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteBudget(Long id) {
        User user = getCurrentUser();
        Budget budget = budgetRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found"));
        budgetRepository.delete(budget);
    }

    private BudgetResponse toResponse(Budget budget, Long userId) {
        BigDecimal spent = expenseRepository.sumByUserIdAndMonthAndYear(
                userId, budget.getMonth(), budget.getYear());
        if (spent == null) spent = BigDecimal.ZERO;

        BigDecimal remaining = budget.getAmount().subtract(spent);
        boolean exceeded = spent.compareTo(budget.getAmount()) > 0;

        return BudgetResponse.builder()
                .id(budget.getId())
                .amount(budget.getAmount())
                .month(budget.getMonth())
                .year(budget.getYear())
                .spent(spent)
                .remaining(remaining)
                .exceeded(exceeded)
                .build();
    }
}
