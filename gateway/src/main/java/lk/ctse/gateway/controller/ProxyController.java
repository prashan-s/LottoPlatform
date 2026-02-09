package lk.ctse.gateway.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.net.URI;
import java.util.Enumeration;
import java.util.Set;

@RestController
public class ProxyController {

    private final RestClient restClient = RestClient.create();

    private static final Set<String> HOP_BY_HOP = Set.of(
            "host", "connection", "content-length", "transfer-encoding",
            "te", "trailer", "upgrade", "proxy-authorization", "proxy-authenticate"
    );

    @RequestMapping("/booking/**")
    public ResponseEntity<byte[]> proxyBooking(HttpServletRequest req) {
        return proxy("http://booking-service:8084", req);
    }

    @RequestMapping("/payments/**")
    public ResponseEntity<byte[]> proxyPayments(HttpServletRequest req) {
        return proxy("http://payment-service:8082", req);
    }

    @RequestMapping("/members/**")
    public ResponseEntity<byte[]> proxyMembers(HttpServletRequest req) {
        return proxy("http://identity-service:8081", req);
    }

    @RequestMapping("/profiles/**")
    public ResponseEntity<byte[]> proxyProfiles(HttpServletRequest req) {
        return proxy("http://identity-service:8081", req);
    }

    @RequestMapping("/notifications/**")
    public ResponseEntity<byte[]> proxyNotifications(HttpServletRequest req) {
        return proxy("http://notification-service:8083", req);
    }

    private ResponseEntity<byte[]> proxy(String targetBase, HttpServletRequest req) {
        String path = req.getRequestURI();
        String query = req.getQueryString();
        String url = targetBase + path + (query != null ? "?" + query : "");

        byte[] body = readBody(req);

        HttpHeaders forwardHeaders = new HttpHeaders();
        Enumeration<String> headerNames = req.getHeaderNames();
        if (headerNames != null) {
            while (headerNames.hasMoreElements()) {
                String name = headerNames.nextElement();
                if (!HOP_BY_HOP.contains(name.toLowerCase())) {
                    forwardHeaders.set(name, req.getHeader(name));
                }
            }
        }
        forwardHeaders.set("X-Gateway-Routed", "true");

        HttpMethod method = HttpMethod.valueOf(req.getMethod());

        try {
            RestClient.RequestBodySpec spec = restClient
                    .method(method)
                    .uri(URI.create(url))
                    .headers(h -> h.addAll(forwardHeaders));

            if (body != null && body.length > 0) {
                spec = spec.body(body);
            }

            return spec.exchange((request, response) -> {
                byte[] responseBody = response.getBody().readAllBytes();
                return ResponseEntity
                        .status(response.getStatusCode())
                        .headers(response.getHeaders())
                        .body(responseBody);
            });
        } catch (ResourceAccessException e) {
            String msg = "{\"error\":\"Bad Gateway\",\"message\":\"Service unreachable: " + targetBase + "\"}";
            return ResponseEntity.status(502).body(msg.getBytes());
        } catch (Exception e) {
            String msg = "{\"error\":\"Bad Gateway\",\"message\":\"" + e.getMessage() + "\"}";
            return ResponseEntity.status(502).body(msg.getBytes());
        }
    }

    /**
     * Read the request body for proxying.
     *
     * For application/x-www-form-urlencoded:
     *  1. Try the InputStream first (populated by CachedBodyFilter).
     *  2. Fall back to getParameterMap() — Spring Cloud Gateway's FormFilter reads
     *     the cached bytes and exposes them via getParameterMap() in its own wrapper.
     *
     * For all other content types: read directly from the InputStream.
     */
    /**
     * Read the request body for proxying.
     *
     * For application/x-www-form-urlencoded:
     *   CachedBodyFilter stores the raw bytes in the "_rawFormBody" request attribute
     *   BEFORE Spring Cloud Gateway's FormFilter can wrap/consume the InputStream.
     *   We read from the attribute to bypass all wrapper layers.
     *
     * For all other content types: read directly from the InputStream.
     */
    private byte[] readBody(HttpServletRequest req) {
        String contentType = req.getContentType();
        if (contentType != null && contentType.toLowerCase().contains("application/x-www-form-urlencoded")) {
            Object cached = req.getAttribute("_rawFormBody");
            if (cached instanceof byte[] bytes && bytes.length > 0) {
                return bytes;
            }
            return new byte[0];
        }
        try {
            return req.getInputStream().readAllBytes();
        } catch (IOException e) {
            return new byte[0];
        }
    }
}
