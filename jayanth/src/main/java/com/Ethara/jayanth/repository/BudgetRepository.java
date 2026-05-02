package com.Ethara.jayanth.repository;

import com.Ethara.jayanth.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    Optional<Budget> findByUserIdAndMonthAndYear(Long userId, int month, int year);
    List<Budget> findByUserIdAndYear(Long userId, int year);
    Optional<Budget> findByIdAndUserId(Long id, Long userId);
}
