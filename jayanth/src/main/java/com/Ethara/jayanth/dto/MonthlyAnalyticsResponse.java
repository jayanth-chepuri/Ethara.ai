package com.Ethara.jayanth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyAnalyticsResponse {
    private int month;
    private int year;
    private BigDecimal totalSpent;
    private BigDecimal budget;
    private BigDecimal remaining;
    private boolean budgetExceeded;
    private List<MonthlyData> monthlyData;
    private List<String> insights;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyData {
        private String month;
        private BigDecimal amount;
    }
}
