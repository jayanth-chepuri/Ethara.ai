package com.Ethara.jayanth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendsResponse {
    private List<TrendData> dailyTrends;
    private List<TrendData> weeklyTrends;
    private BigDecimal predictedNextMonth;
    private List<String> insights;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendData {
        private String label;
        private BigDecimal amount;
    }
}
