package com.Ethara.jayanth.controller;

import com.Ethara.jayanth.service.ExportService;
import com.itextpdf.text.DocumentException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
@Tag(name = "Export", description = "Export expense reports")
@SecurityRequirement(name = "Bearer Authentication")
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/excel")
    @Operation(summary = "Export expenses to Excel")
    public ResponseEntity<byte[]> exportToExcel(
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) throws IOException {
        if (month == 0) month = LocalDate.now().getMonthValue();
        if (year == 0) year = LocalDate.now().getYear();

        byte[] data = exportService.exportToExcel(month, year);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=expenses_" + month + "_" + year + ".xlsx")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/pdf")
    @Operation(summary = "Export expenses to PDF")
    public ResponseEntity<byte[]> exportToPdf(
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) throws DocumentException {
        if (month == 0) month = LocalDate.now().getMonthValue();
        if (year == 0) year = LocalDate.now().getYear();

        byte[] data = exportService.exportToPdf(month, year);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=expenses_" + month + "_" + year + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
}
