package com.caretriage.controller;

import com.caretriage.dto.ChatMessageDTO;
import com.caretriage.dto.request.AssignTriageTicketRequest;
import com.caretriage.dto.request.ReviewTriageTicketRequest;
import com.caretriage.dto.response.ApiResponse;
import com.caretriage.dto.response.PagedResponse;
import com.caretriage.dto.response.TriageTicketResponse;
import com.caretriage.entity.TriageTicket;
import com.caretriage.entity.User;
import com.caretriage.repository.UserRepository;
import com.caretriage.service.TriageTicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/triage/tickets")
@RequiredArgsConstructor
@Tag(name = "Triage Ticket", description = "APIs for triage ticket workflow")
public class TriageTicketController {

    private final TriageTicketService triageTicketService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    @Operation(summary = "List pending tickets", description = "Danh sách ticket chờ phân loại")
    public ResponseEntity<ApiResponse<PagedResponse<TriageTicketResponse>>> listPendingTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) TriageTicket.Priority priority
    ) {
        PagedResponse<TriageTicketResponse> response = triageTicketService.listPendingTickets(page, size, priority);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách ticket thành công", response));
    }

    @PostMapping("/assign")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    @Operation(summary = "Assign ticket", description = "Gán ticket cho nhân sự triage")
    public ResponseEntity<ApiResponse<TriageTicketResponse>> assignTicket(
            @Valid @RequestBody AssignTriageTicketRequest request,
            Authentication authentication
    ) {
        Long actorId = getUserId(authentication);
        TriageTicketResponse response = triageTicketService.assignTicket(request, actorId);
        return ResponseEntity.ok(ApiResponse.success("Gán ticket thành công", response));
    }

    @PostMapping("/review")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    @Operation(summary = "Review triage ticket", description = "Đánh giá và chốt kết quả triage")
    public ResponseEntity<ApiResponse<TriageTicketResponse>> reviewTicket(
            @Valid @RequestBody ReviewTriageTicketRequest request,
            Authentication authentication
    ) {
        Long actorId = getUserId(authentication);
        TriageTicketResponse response = triageTicketService.reviewTicket(request, actorId);
        return ResponseEntity.ok(ApiResponse.success("Đánh giá ticket thành công", response));
    }

    @GetMapping("/{ticketId}")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<TriageTicketResponse>> getTicketDetail(
            @PathVariable UUID ticketId,
            Authentication authentication
    ) {
        Long actorId = getUserId(authentication);
        TriageTicketResponse response = triageTicketService.getTicketDetail(ticketId, actorId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết ticket thành công", response));
    }

    @GetMapping("/{ticketId}/chat-history")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<ChatMessageDTO>>> getTicketChatHistory(
            @PathVariable UUID ticketId,
            Authentication authentication
    ) {
        Long actorId = getUserId(authentication);
        List<ChatMessageDTO> response = triageTicketService.getTicketChatHistory(ticketId, actorId);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử chat thành công", response));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<PagedResponse<TriageTicketResponse>>> listMyTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication
    ) {
        Long requesterId = getUserId(authentication);
        PagedResponse<TriageTicketResponse> response = triageTicketService.listMyTickets(requesterId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách ticket của bệnh nhân thành công", response));
    }

    @GetMapping("/me/{ticketId}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<TriageTicketResponse>> getMyTicketDetail(
            @PathVariable UUID ticketId,
            Authentication authentication
    ) {
        Long requesterId = getUserId(authentication);
        TriageTicketResponse response = triageTicketService.getMyTicketDetail(ticketId, requesterId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết ticket của bệnh nhân thành công", response));
    }

    @GetMapping("/me/{ticketId}/chat-history")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<List<ChatMessageDTO>>> getMyTicketChatHistory(
            @PathVariable UUID ticketId,
            Authentication authentication
    ) {
        Long requesterId = getUserId(authentication);
        List<ChatMessageDTO> response = triageTicketService.getMyTicketChatHistory(ticketId, requesterId);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử chat của bệnh nhân thành công", response));
    }

    private Long getUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        return user.getId();
    }
}
