package lk.ctse.booking.repository;

import lk.ctse.booking.entity.Slot;
import lk.ctse.booking.enums.SlotStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SlotRepository extends JpaRepository<Slot, String> {
    Optional<Slot> findBySlotIdAndStatus(String slotId, SlotStatus status);

    List<Slot> findByLotteryId(String lotteryId);

    List<Slot> findByLotteryIdAndStatus(String lotteryId, SlotStatus status);

    long countByLotteryIdAndStatus(String lotteryId, SlotStatus status);
}
