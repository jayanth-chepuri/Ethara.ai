package com.Ethara.jayanth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetResponse {
    private Long id;
    private BigDecimal amount;
    private Integer month;
    private Integer year;
    private BigDecimal spent;
    private BigDecimal remaining;
    private boolean exceeded;
}
