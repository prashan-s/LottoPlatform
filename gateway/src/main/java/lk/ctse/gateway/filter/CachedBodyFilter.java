package lk.ctse.gateway.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.*;

/**
 * Runs at the highest filter priority so it reads the raw request body
 * before any Spring or Tomcat processing can consume the InputStream.
 *
 * Without this, Tomcat's lazy form-parameter parsing races with Spring's
 * @RequestBody reading: whichever reads the InputStream first wins, leaving
 * the other empty. For application/x-www-form-urlencoded bodies (e.g. PayHere
 * notify webhooks) this meant the proxy forwarded an empty body downstream.
 *
 * By caching the bytes here and wrapping the request, both getInputStream()
 * and getParameterMap() continue to work for all downstream code.
 */
@Component
@Order(Integer.MIN_VALUE)
public class CachedBodyFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (request instanceof HttpServletRequest httpReq) {
            String contentType = httpReq.getContentType();
            if (contentType != null && contentType.toLowerCase().contains("application/x-www-form-urlencoded")) {
                byte[] body = httpReq.getInputStream().readAllBytes();
                // Store in attribute — survives the FormFilter wrapper chain downstream
                httpReq.setAttribute("_rawFormBody", body);
                chain.doFilter(new CachedBodyRequestWrapper(httpReq, body), response);
                return;
            }
        }
        chain.doFilter(request, response);
    }

    /** Wraps the request so getInputStream() always returns the cached bytes. */
    private static class CachedBodyRequestWrapper extends HttpServletRequestWrapper {
        private final byte[] cachedBody;

        CachedBodyRequestWrapper(HttpServletRequest request, byte[] body) {
            super(request);
            this.cachedBody = body;
        }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream bais = new ByteArrayInputStream(cachedBody);
            return new ServletInputStream() {
                @Override public int read() { return bais.read(); }
                @Override public boolean isFinished() { return bais.available() == 0; }
                @Override public boolean isReady() { return true; }
                @Override public void setReadListener(ReadListener l) {}
            };
        }

        @Override
        public BufferedReader getReader() {
            return new BufferedReader(new InputStreamReader(getInputStream()));
        }
    }
}
