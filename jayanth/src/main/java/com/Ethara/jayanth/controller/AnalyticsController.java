package com.Ethara.jayanth.controller;

import com.Ethara.jayanth.dto.ApiResponse;
import com.Ethara.jayanth.dto.CategoryAnalyticsResponse;
import com.Ethara.jayanth.dto.MonthlyAnalyticsResponse;
import com.Ethara.jayanth.dto.TrendsResponse;
import com.Ethara.jayanth.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Expense analytics and insights")
@SecurityRequirement(name = "Bearer Authentication")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/monthly")
    @Operation(summary = "Get monthly expense analytics")
    public ResponseEntity<ApiResponse<MonthlyAnalyticsResponse>> getMonthlyAnalytics(
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {
        if (month == 0) month = LocalDate.now().getMonthValue();
        if (year == 0) year = LocalDate.now().getYear();
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getMonthlyAnalytics(month, year)));
    }

    @GetMapping("/category")
    @Operation(summary = "Get category-wise expense breakdown")
    public ResponseEntity<ApiResponse<CategoryAnalyticsResponse>> getCategoryAnalytics(
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {
        if (month == 0) month = LocalDate.now().getMonthValue();
        if (year == 0) year = LocalDate.now().getYear();
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getCategoryAnalytics(month, year)));
    }

    @GetMapping("/trends")
    @Operation(summary = "Get daily/weekly trends and predictions")
    public ResponseEntity<ApiResponse<TrendsResponse>> getTrends(
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {
        if (month == 0) month = LocalDate.now().getMonthValue();
        if (year == 0) year = LocalDate.now().getYear();
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getTrends(month, year)));
    }
}
