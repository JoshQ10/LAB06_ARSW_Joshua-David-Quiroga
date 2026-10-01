package co.edu.eci.blueprints.rt;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

/** Observabilidad: registra conexiones, suscripciones y desconexiones STOMP. */
@Component
public class SessionEventsLogger {

    private static final Logger log = LoggerFactory.getLogger(SessionEventsLogger.class);

    @EventListener
    public void onConnected(SessionConnectedEvent event) {
        log.info("connect {}", StompHeaderAccessor.wrap(event.getMessage()).getSessionId());
    }

    @EventListener
    public void onSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor headers = StompHeaderAccessor.wrap(event.getMessage());
        log.info("subscribe {} -> {}", headers.getSessionId(), headers.getDestination());
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        log.info("disconnect {}: {}", event.getSessionId(), event.getCloseStatus());
    }
}
