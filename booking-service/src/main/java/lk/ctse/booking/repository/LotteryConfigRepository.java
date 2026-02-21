package lk.ctse.booking.repository;

import lk.ctse.booking.entity.LotteryConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LotteryConfigRepository extends JpaRepository<LotteryConfig, String> {
}
