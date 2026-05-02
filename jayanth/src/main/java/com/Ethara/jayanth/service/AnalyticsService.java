package com.Ethara.jayanth.service;

import com.Ethara.jayanth.dto.CategoryAnalyticsResponse;
import com.Ethara.jayanth.dto.MonthlyAnalyticsResponse;
import com.Ethara.jayanth.dto.TrendsResponse;
import com.Ethara.jayanth.entity.Budget;
import com.Ethara.jayanth.entity.User;
import com.Ethara.jayanth.exception.ResourceNotFoundException;
import com.Ethara.jayanth.repository.BudgetRepository;
import com.Ethara.jayanth.repository.ExpenseRepository;
import com.Ethara.jayanth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public MonthlyAnalyticsResponse getMonthlyAnalytics(int month, int year) {
        User user = getCurrentUser();
        Long userId = user.getId();

        BigDecimal totalSpent = expenseRepository.sumByUserIdAndMonthAndYear(userId, month, year);
        if (totalSpent == null) totalSpent = BigDecimal.ZERO;

        Optional<Budget> budgetOpt = budgetRepository.findByUserIdAndMonthAndYear(userId, month, year);
        BigDecimal budget = budgetOpt.map(Budget::getAmount).orElse(BigDecimal.ZERO);
        BigDecimal remaining = budget.subtract(totalSpent);
        boolean exceeded = totalSpent.compareTo(budget) > 0;

        // Monthly data for the year
        List<Object[]> monthlyRaw = expenseRepository.sumByMonthForYear(userId, year);
        List<MonthlyAnalyticsResponse.MonthlyData> monthlyData = new ArrayList<>();
        Map<Integer, BigDecimal> monthMap = new HashMap<>();
        for (Object[] row : monthlyRaw) {
            monthMap.put(((Number) row[0]).intValue(), (BigDecimal) row[1]);
        }
        for (int m = 1; m <= 12; m++) {
            String monthName = Month.of(m).getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            monthlyData.add(MonthlyAnalyticsResponse.MonthlyData.builder()
                    .month(monthName)
                    .amount(monthMap.getOrDefault(m, BigDecimal.ZERO))
                    .build());
        }

        // Insights
        List<String> insights = generateMonthlyInsights(userId, month, year, totalSpent, budget);

        return MonthlyAnalyticsResponse.builder()
                .month(month)
                .year(year)
                .totalSpent(totalSpent)
                .budget(budget)
                .remaining(remaining)
                .budgetExceeded(exceeded)
                .monthlyData(monthlyData)
                .insights(insights)
                .build();
    }

    public CategoryAnalyticsResponse getCategoryAnalytics(int month, int year) {
        User user = getCurrentUser();
        List<Object[]> raw = expenseRepository.sumByCategoryForMonth(user.getId(), month, year);

        BigDecimal total = raw.stream()
                .map(r -> (BigDecimal) r[1])
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<CategoryAnalyticsResponse.CategoryData> categories = raw.stream()
                .map(r -> {
                    BigDecimal amount = (BigDecimal) r[1];
                    double pct = total.compareTo(BigDecimal.ZERO) == 0 ? 0 :
                            amount.divide(total, 4, RoundingMode.HALF_UP)
                                    .multiply(BigDecimal.valueOf(100))
                                    .doubleValue();
                    return CategoryAnalyticsResponse.CategoryData.builder()
                            .category(r[0].toString())
                            .amount(amount)
                            .percentage(Math.round(pct * 100.0) / 100.0)
                            .build();
                })
                .sorted(Comparator.comparing(CategoryAnalyticsResponse.CategoryData::getAmount).reversed())
                .collect(Collectors.toList());

        String highest = categories.isEmpty() ? "N/A" : categories.get(0).getCategory();

        return CategoryAnalyticsResponse.builder()
                .categories(categories)
                .highestCategory(highest)
                .totalAmount(total)
                .build();
    }

    public TrendsResponse getTrends(int month, int year) {
        User user = getCurrentUser();
        Long userId = user.getId();

        // Daily trends for the month
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        List<Object[]> dailyRaw = expenseRepository.sumByDateRange(userId, start, end);

        List<TrendsResponse.TrendData> dailyTrends = dailyRaw.stream()
                .map(r -> TrendsResponse.TrendData.builder()
                        .label(r[0].toString())
                        .amount((BigDecimal) r[1])
                        .build())
                .collect(Collectors.toList());

        // Weekly trends (group daily into weeks)
        List<TrendsResponse.TrendData> weeklyTrends = buildWeeklyTrends(dailyRaw, start);

        // Prediction for next month
        BigDecimal predicted = predictNextMonth(userId, month, year);

        // Insights
        List<String> insights = generateTrendInsights(userId, month, year);

        return TrendsResponse.builder()
                .dailyTrends(dailyTrends)
                .weeklyTrends(weeklyTrends)
                .predictedNextMonth(predicted)
                .insights(insights)
                .build();
    }

    private List<TrendsResponse.TrendData> buildWeeklyTrends(List<Object[]> dailyRaw, LocalDate monthStart) {
        Map<Integer, BigDecimal> weekMap = new TreeMap<>();
        for (Object[] row : dailyRaw) {
            LocalDate date = LocalDate.parse(row[0].toString());
            int week = ((date.getDayOfMonth() - 1) / 7) + 1;
            weekMap.merge(week, (BigDecimal) row[1], BigDecimal::add);
        }
        List<TrendsResponse.TrendData> weekly = new ArrayList<>();
        for (Map.Entry<Integer, BigDecimal> entry : weekMap.entrySet()) {
            weekly.add(TrendsResponse.TrendData.builder()
                    .label("Week " + entry.getKey())
                    .amount(entry.getValue())
                    .build());
        }
        return weekly;
    }

    private BigDecimal predictNextMonth(Long userId, int month, int year) {
        // Simple average of last 3 months
        List<BigDecimal> amounts = new ArrayList<>();
        for (int i = 1; i <= 3; i++) {
            int m = month - i;
            int y = year;
            if (m <= 0) { m += 12; y--; }
            BigDecimal amt = expenseRepository.sumByUserIdAndMonthAndYear(userId, m, y);
            if (amt != null && amt.compareTo(BigDecimal.ZERO) > 0) {
                amounts.add(amt);
            }
        }
        if (amounts.isEmpty()) return BigDecimal.ZERO;
        BigDecimal sum = amounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(amounts.size()), 2, RoundingMode.HALF_UP);
    }

    private List<String> generateMonthlyInsights(Long userId, int month, int year,
                                                   BigDecimal currentSpent, BigDecimal budget) {
        List<String> insights = new ArrayList<>();

        // Compare with last month
        int lastMonth = month - 1;
        int lastYear = year;
        if (lastMonth <= 0) { lastMonth = 12; lastYear--; }

        BigDecimal lastMonthSpent = expenseRepository.sumByUserIdAndMonthAndYear(userId, lastMonth, lastYear);
        if (lastMonthSpent != null && lastMonthSpent.compareTo(BigDecimal.ZERO) > 0
                && currentSpent.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal diff = currentSpent.subtract(lastMonthSpent);
            BigDecimal pct = diff.divide(lastMonthSpent, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP);
            if (diff.compareTo(BigDecimal.ZERO) > 0) {
                insights.add("You spent " + pct.abs() + "% more this month compared to last month");
            } else if (diff.compareTo(BigDecimal.ZERO) < 0) {
                insights.add("Great job! You spent " + pct.abs() + "% less this month compared to last month");
            } else {
                insights.add("Your spending is the same as last month");
            }
        }

        // Budget alert
        if (budget.compareTo(BigDecimal.ZERO) > 0) {
            if (currentSpent.compareTo(budget) > 0) {
                BigDecimal over = currentSpent.subtract(budget);
                insights.add("⚠️ You have exceeded your budget by ₹" + over.setScale(2, RoundingMode.HALF_UP));
            } else {
                BigDecimal usedPct = currentSpent.divide(budget, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(1, RoundingMode.HALF_UP);
                insights.add("You have used " + usedPct + "% of your monthly budget");
            }
        }

        return insights;
    }

    private List<String> generateTrendInsights(Long userId, int month, int year) {
        List<String> insights = new ArrayList<>();

        // Highest spending category
        List<Object[]> catData = expenseRepository.sumByCategoryForMonth(userId, month, year);
        if (!catData.isEmpty()) {
            Object[] top = catData.stream()
                    .max(Comparator.comparing(r -> (BigDecimal) r[1]))
                    .orElse(null);
            if (top != null) {
                insights.add("Highest spending category is " + top[0].toString());
            }
        }

        // Prediction insight
        BigDecimal predicted = predictNextMonth(userId, month, year);
        if (predicted.compareTo(BigDecimal.ZERO) > 0) {
            insights.add("Based on your spending pattern, predicted next month's expense is ₹" +
                    predicted.setScale(2, RoundingMode.HALF_UP));
        }

        return insights;
    }
}
