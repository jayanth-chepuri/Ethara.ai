package com.Ethara.jayanth.service;

import com.Ethara.jayanth.entity.Expense;
import com.Ethara.jayanth.entity.User;
import com.Ethara.jayanth.exception.ResourceNotFoundException;
import com.Ethara.jayanth.repository.ExpenseRepository;
import com.Ethara.jayanth.repository.UserRepository;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public byte[] exportToExcel(int month, int year) throws IOException {
        User user = getCurrentUser();
        List<Expense> expenses = expenseRepository.findByUserIdAndMonthAndYear(user.getId(), month, year);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Expenses " + month + "/" + year);

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 12);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"#", "Title", "Description", "Amount", "Category", "Date"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 1;
            for (Expense expense : expenses) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(expense.getId());
                row.createCell(1).setCellValue(expense.getTitle());
                row.createCell(2).setCellValue(expense.getDescription() != null ? expense.getDescription() : "");
                row.createCell(3).setCellValue(expense.getAmount().doubleValue());
                row.createCell(4).setCellValue(expense.getCategory().name());
                row.createCell(5).setCellValue(expense.getDate().toString());
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportToPdf(int month, int year) throws DocumentException {
        User user = getCurrentUser();
        List<Expense> expenses = expenseRepository.findByUserIdAndMonthAndYear(user.getId(), month, year);

        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);
        document.open();

        // Title
        com.itextpdf.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.DARK_GRAY);
        Paragraph title = new Paragraph("Expense Report - " +
                java.time.Month.of(month).name() + " " + year, titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(20);
        document.add(title);

        // User info
        com.itextpdf.text.Font infoFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
        document.add(new Paragraph("Name: " + user.getName(), infoFont));
        document.add(new Paragraph("Email: " + user.getEmail(), infoFont));
        document.add(new Paragraph("Generated: " + LocalDate.now(), infoFont));
        document.add(Chunk.NEWLINE);

        // Table
        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1f, 3f, 2f, 2f, 2f});

        // Table headers
        com.itextpdf.text.Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, BaseColor.WHITE);
        String[] headers = {"#", "Title", "Amount", "Category", "Date"};
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
            cell.setBackgroundColor(new BaseColor(63, 81, 181));
            cell.setPadding(8);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }

        // Table data
        com.itextpdf.text.Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
        int i = 1;
        double total = 0;
        for (Expense expense : expenses) {
            table.addCell(new PdfPCell(new Phrase(String.valueOf(i++), dataFont)));
            table.addCell(new PdfPCell(new Phrase(expense.getTitle(), dataFont)));
            table.addCell(new PdfPCell(new Phrase("₹" + expense.getAmount(), dataFont)));
            table.addCell(new PdfPCell(new Phrase(expense.getCategory().name(), dataFont)));
            table.addCell(new PdfPCell(new Phrase(expense.getDate().toString(), dataFont)));
            total += expense.getAmount().doubleValue();
        }
        document.add(table);

        // Total
        document.add(Chunk.NEWLINE);
        com.itextpdf.text.Font totalFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13);
        document.add(new Paragraph("Total: ₹" + String.format("%.2f", total), totalFont));

        document.close();
        return out.toByteArray();
    }
}
