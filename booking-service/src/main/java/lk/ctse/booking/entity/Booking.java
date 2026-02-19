package lk.ctse.booking.entity;

import jakarta.persistence.*;
import lk.ctse.booking.enums.BookingStatus;
import lombok.Data;
import org.hibernate.annotations.GenericGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@EntityListeners(AuditingEntityListener.class)
public class Booking {
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "booking_id", columnDefinition = "VARCHAR(36)")
    private String bookingId;

    @ManyToOne(fetch = FetchType.LAZY, cascade = {})
    @JoinColumn(name = "slot_id", nullable = false)
    private Slot slot;

    @Column(name = "member_id", columnDefinition = "VARCHAR(36)", nullable = false)
    private String memberId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private BookingStatus status;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
