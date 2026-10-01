package co.edu.eci.blueprints.rt;

import co.edu.eci.blueprints.rt.dto.BlueprintUpdate;
import co.edu.eci.blueprints.rt.dto.DrawEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;

/**
 * Cada plano es un topico: /topic/blueprints.{author}.{name}. Un punto enviado a
 * /app/draw se publica en el topico de su plano (lo reciben todos, incluido el emisor).
 */
@Controller
public class DrawController {

    private static final Logger log = LoggerFactory.getLogger(DrawController.class);

    private final SimpMessagingTemplate template;

    public DrawController(SimpMessagingTemplate template) {
        this.template = template;
    }

    public static String topicOf(String author, String name) {
        return "/topic/blueprints." + author + "." + name;
    }

    private static boolean isValid(DrawEvent evt) {
        return evt != null
                && evt.author() != null && !evt.author().isBlank()
                && evt.name() != null && !evt.name().isBlank()
                && evt.point() != null;
    }

    @MessageMapping("/draw")
    public void onDraw(DrawEvent evt) {
        if (!isValid(evt)) {
            log.warn("draw rechazado: payload invalido {}", evt);
            return;
        }
        String topic = topicOf(evt.author(), evt.name());
        template.convertAndSend(topic, new BlueprintUpdate(evt.author(), evt.name(), List.of(evt.point())));
        log.info("draw -> {} ({}, {})", topic, evt.point().x(), evt.point().y());
    }
}
