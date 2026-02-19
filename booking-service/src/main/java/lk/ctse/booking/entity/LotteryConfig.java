package lk.ctse.booking.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "lottery_config")
@Data
public class LotteryConfig {

    @Id
    @Column(name = "config_id", length = 36)
    private String configId;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes = 10;

    @Column(name = "cooldown_minutes", nullable = false)
    private int cooldownMinutes = 2;

    @Column(name = "total_slots", nullable = false)
    private int totalSlots = 5;

    @Column(name = "prize_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal prizeAmount = new BigDecimal("500000.00");

    @Column(name = "ticket_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal ticketPrice = new BigDecimal("2500.00");

    @Column(name = "auto_generate", nullable = false)
    private boolean autoGenerate = true;

    // DB-managed via ON UPDATE CURRENT_TIMESTAMP — read-only in JPA
    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
