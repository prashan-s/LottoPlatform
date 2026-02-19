package lk.ctse.booking.entity;

import jakarta.persistence.*;
import lk.ctse.booking.enums.LotteryStatus;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "lotteries")
@Data
@EntityListeners(AuditingEntityListener.class)
public class Lottery {

    @Id
    @Column(name = "lottery_id", columnDefinition = "VARCHAR(36)")
    private String lotteryId;

    @Column(name = "name", nullable = false, length = 255)
    private String name = "Lottery Draw";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private LotteryStatus status = LotteryStatus.OPEN;

    @Column(name = "opens_at")
    private LocalDateTime opensAt;

    @Column(name = "closes_at", nullable = false)
    private LocalDateTime closesAt;

    @Column(name = "winner_id", columnDefinition = "VARCHAR(36)")
    private String winnerId;

    @Column(name = "winner_booking_id", columnDefinition = "VARCHAR(36)")
    private String winnerBookingId;

    @Column(name = "prize_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal prizeAmount = new BigDecimal("500000.00");

    @Column(name = "ticket_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal ticketPrice = new BigDecimal("2500.00");

    @Column(name = "total_slots", nullable = false)
    private int totalSlots = 5;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
