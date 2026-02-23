package lk.ctse.booking.service;

import lk.ctse.booking.dto.LotteryConfigDto;
import lk.ctse.booking.entity.LotteryConfig;
import lk.ctse.booking.repository.LotteryConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LotteryConfigService {

    private static final String DEFAULT_CONFIG_ID = "default";

    private final LotteryConfigRepository configRepository;

    public LotteryConfigService(LotteryConfigRepository configRepository) {
        this.configRepository = configRepository;
    }

    /**
     * Returns the current config, creating a default row if one does not exist
     * (cold-start / first-boot safety).
     */
    public LotteryConfig getOrCreateDefault() {
        return configRepository.findById(DEFAULT_CONFIG_ID)
                .orElseGet(() -> {
                    LotteryConfig config = new LotteryConfig();
                    config.setConfigId(DEFAULT_CONFIG_ID);
                    return configRepository.save(config);
                });
    }

    @Transactional(readOnly = true)
    public LotteryConfigDto getConfigDto() {
        return toDto(getOrCreateDefault());
    }

    @Transactional
    public LotteryConfigDto updateConfig(LotteryConfigDto dto) {
        LotteryConfig config = getOrCreateDefault();
        config.setDurationMinutes(dto.getDurationMinutes());
        config.setCooldownMinutes(dto.getCooldownMinutes());
        config.setTotalSlots(dto.getTotalSlots());
        config.setPrizeAmount(dto.getPrizeAmount());
        config.setTicketPrice(dto.getTicketPrice());
        config.setAutoGenerate(dto.isAutoGenerate());
        return toDto(configRepository.save(config));
    }

    private LotteryConfigDto toDto(LotteryConfig c) {
        return new LotteryConfigDto(
                c.getDurationMinutes(),
                c.getCooldownMinutes(),
                c.getTotalSlots(),
                c.getPrizeAmount(),
                c.getTicketPrice(),
                c.isAutoGenerate(),
                c.getUpdatedAt()
        );
    }
}
