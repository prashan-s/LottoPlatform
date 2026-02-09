package lk.ctse.gateway.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class GatewayController {

    @GetMapping("/")
    public Map<String, Object> home() {
        Map<String, Object> response = new HashMap<>();
        response.put("service", "Lottery Platform Gateway");
        response.put("status", "running");
        response.put("version", "v1.0");
        response.put("routes", new String[]{
            "/booking/** -> booking-service:8084",
            "/payments/** -> payment-service:8082",
            "/members/** -> identity-service:8081",
            "/profiles/** -> identity-service:8081",
            "/notifications/** -> notification-service:8083"
        });
        return response;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "gateway");
        return response;
    }
}
