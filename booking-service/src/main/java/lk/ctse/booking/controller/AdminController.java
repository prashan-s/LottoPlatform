package lk.ctse.booking.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lk.ctse.booking.dto.AdminStatsDto;
import lk.ctse.booking.dto.LotteryConfigDto;
import lk.ctse.booking.dto.LotterySummaryDto;
import lk.ctse.booking.entity.Lottery;
import lk.ctse.booking.enums.LotteryStatus;
import lk.ctse.booking.exception.LotteryNotFoundException;
import lk.ctse.booking.repository.LotteryRepository;
import lk.ctse.booking.service.DrawService;
import lk.ctse.booking.service.LotteryConfigService;
import lk.ctse.booking.service.LotteryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/booking/admin")
public class AdminController {

    private final LotteryService lotteryService;
    private final LotteryConfigService configService;
    private final DrawService drawService;
    private final LotteryRepository lotteryRepository;

    public AdminController(LotteryService lotteryService,
                           LotteryConfigService configService,
                           DrawService drawService,
                           LotteryRepository lotteryRepository) {
        this.lotteryService = lotteryService;
        this.configService = configService;
        this.drawService = drawService;
        this.lotteryRepository = lotteryRepository;
    }

    @Tag(name = "Admin")
    @Operation(summary = "Get admin dashboard stats", description = "Returns counts of lotteries by status, the current draw configuration, and the 20 most recent lottery campaigns.")
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        return ResponseEntity.ok(lotteryService.getAdminStats());
    }

    @Tag(name = "Admin")
    @Operation(summary = "Get draw configuration", description = "Returns the current global lottery configuration (duration, cooldown, slots, prices, auto-generate flag).")
    @GetMapping("/config")
    public ResponseEntity<LotteryConfigDto> getConfig() {
        return ResponseEntity.ok(configService.getConfigDto());
    }

    @Tag(name = "Admin")
    @Operation(summary = "Update draw configuration", description = "Saves new draw configuration. Changes apply to all future campaigns; existing ones are unaffected.")
    @PutMapping("/config")
    public ResponseEntity<LotteryConfigDto> updateConfig(@RequestBody LotteryConfigDto dto) {
        return ResponseEntity.ok(configService.updateConfig(dto));
    }

    @Tag(name = "Admin")
    @Operation(summary = "Generate next lottery campaign", description = "Immediately creates the next lottery campaign using the current configuration. If cooldown > 0, the campaign starts SCHEDULED and opens automatically.")
    @PostMapping("/generate")
    public ResponseEntity<LotterySummaryDto> manualGenerate() {
        Lottery previous = lotteryRepository.findFirstByOrderByCreatedAtDesc().orElse(null);
        Lottery next = lotteryService.generateNext(previous);
        return ResponseEntity.ok(lotteryService.getLotteryById(next.getLotteryId()));
    }

    @Tag(name = "Admin")
    @Operation(summary = "Execute draw for a lottery", description = "Triggers the draw for an OPEN lottery. Selects a random winner from CONFIRMED bookings and closes the lottery.")
    @PostMapping("/lotteries/{lotteryId}/draw")
    public ResponseEntity<LotterySummaryDto> manualDraw(@PathVariable String lotteryId) {
        Lottery lottery = lotteryRepository.findById(lotteryId)
                .orElseThrow(() -> new LotteryNotFoundException("Lottery not found: " + lotteryId));
        drawService.executeDraw(lottery);
        return ResponseEntity.ok(lotteryService.getLotteryById(lotteryId));
    }

    @Tag(name = "Admin")
    @Operation(summary = "Activate a scheduled lottery", description = "Skips the remaining cooldown and immediately opens a SCHEDULED lottery.")
    @PostMapping("/lotteries/{lotteryId}/activate")
    public ResponseEntity<LotterySummaryDto> activateLottery(@PathVariable String lotteryId) {
        Lottery lottery = lotteryRepository.findById(lotteryId)
                .orElseThrow(() -> new LotteryNotFoundException("Lottery not found: " + lotteryId));
        if (lottery.getStatus() == LotteryStatus.SCHEDULED) {
            lottery.setStatus(LotteryStatus.OPEN);
            lottery.setOpensAt(null);
            lotteryRepository.save(lottery);
        }
        return ResponseEntity.ok(lotteryService.getLotteryById(lotteryId));
    }
}
