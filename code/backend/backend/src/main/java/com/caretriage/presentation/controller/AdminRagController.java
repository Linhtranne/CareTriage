package com.caretriage.presentation.controller;

import com.caretriage.application.ai.service.MedicalCorpusIngestionService;
import com.caretriage.application.dto.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/rag")
@RequiredArgsConstructor
@Tag(name = "Admin RAG", description = "Endpoints for Medical RAG management")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
public class AdminRagController {

    private final MedicalCorpusIngestionService ingestionService;

    @PostMapping("/ingest")
    @Operation(summary = "Ingest clinical guidelines from corpus folder into vector store")
    public ResponseEntity<ApiResponse<Void>> ingestCorpus() {
        ingestionService.ingestCorpus();
        return ResponseEntity.ok(ApiResponse.success("Medical RAG corpus ingestion completed successfully.", null));
    }
}
