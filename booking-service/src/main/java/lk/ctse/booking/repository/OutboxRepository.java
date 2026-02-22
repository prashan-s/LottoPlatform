package lk.ctse.booking.repository;

import lk.ctse.booking.entity.Outbox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OutboxRepository extends JpaRepository<Outbox, Long> {
    List<Outbox> findByStatusOrderByCreatedAtAsc(String status);
}
