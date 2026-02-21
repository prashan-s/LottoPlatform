package lk.ctse.booking.repository;

import lk.ctse.booking.entity.Lottery;
import lk.ctse.booking.enums.LotteryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LotteryRepository extends JpaRepository<Lottery, String> {

    List<Lottery> findByStatus(LotteryStatus status);

    List<Lottery> findByStatusAndClosesAtBefore(LotteryStatus status, LocalDateTime time);

    // SCHEDULED lotteries whose opensAt has passed — ready to activate
    List<Lottery> findByStatusAndOpensAtLessThanEqual(LotteryStatus status, LocalDateTime time);

    long countByStatus(LotteryStatus status);

    Optional<Lottery> findFirstByOrderByCreatedAtDesc();

    // Admin: last 20 lotteries across all statuses
    List<Lottery> findTop20ByOrderByCreatedAtDesc();
}
