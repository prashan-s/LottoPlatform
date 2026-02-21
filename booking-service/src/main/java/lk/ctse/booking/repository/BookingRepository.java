package lk.ctse.booking.repository;

import lk.ctse.booking.entity.Booking;
import lk.ctse.booking.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {

    List<Booking> findByMemberId(String memberId);

    long countBySlot_LotteryIdAndStatusIn(String lotteryId, List<BookingStatus> statuses);
}
