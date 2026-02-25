package lk.ctse.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReservationRequest {
    @NotBlank(message = "Slot ID cannot be blank")
    private String slotId;

    @NotBlank(message = "Member ID cannot be blank")
    private String memberId;

    @NotNull(message = "Expiration time cannot be null")
    private LocalDateTime expiresAt;
}
