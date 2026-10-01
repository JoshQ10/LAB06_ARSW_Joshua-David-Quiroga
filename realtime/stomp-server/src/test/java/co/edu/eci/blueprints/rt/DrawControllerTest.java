package co.edu.eci.blueprints.rt;

import co.edu.eci.blueprints.rt.dto.BlueprintUpdate;
import co.edu.eci.blueprints.rt.dto.DrawEvent;
import co.edu.eci.blueprints.rt.dto.Point;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class DrawControllerTest {

    @LocalServerPort
    private int port;

    private WebSocketStompClient client;
    private final List<StompSession> sessions = new ArrayList<>();

    @BeforeEach
    void setUp() {
        client = new WebSocketStompClient(new StandardWebSocketClient());
        client.setMessageConverter(new MappingJackson2MessageConverter());
    }

    @AfterEach
    void tearDown() {
        sessions.forEach(StompSession::disconnect);
        client.stop();
    }

    @Test
    void drawSePublicaATodosLosSuscriptoresDelPlano() throws Exception {
        BlockingQueue<BlueprintUpdate> a = subscribe(connect(), "john", "house");
        StompSession sender = connect();
        BlockingQueue<BlueprintUpdate> b = subscribe(sender, "john", "house");

        sender.send("/app/draw", new DrawEvent("john", "house", new Point(10, 20)));

        BlueprintUpdate expected = new BlueprintUpdate("john", "house", List.of(new Point(10, 20)));
        assertEquals(expected, a.poll(5, TimeUnit.SECONDS));
        // El topico tambien le entrega el punto al emisor
        assertEquals(expected, b.poll(5, TimeUnit.SECONDS));
    }

    @Test
    void losPlanosEstanAisladosPorTopico() throws Exception {
        BlockingQueue<BlueprintUpdate> house = subscribe(connect(), "john", "house");
        BlockingQueue<BlueprintUpdate> garden = subscribe(connect(), "jane", "garden");
        StompSession sender = connect();

        sender.send("/app/draw", new DrawEvent("john", "house", new Point(1, 2)));

        assertEquals("house", house.poll(5, TimeUnit.SECONDS).name());
        assertNull(garden.poll(300, TimeUnit.MILLISECONDS));
    }

    @Test
    void descartaEventosInvalidos() throws Exception {
        BlockingQueue<BlueprintUpdate> house = subscribe(connect(), "john", "house");
        StompSession sender = connect();

        sender.send("/app/draw", new DrawEvent("john", "house", null));
        sender.send("/app/draw", new DrawEvent("john", "house", new Point(7, 7)));

        // Solo llega el evento valido
        assertEquals(List.of(new Point(7, 7)), house.poll(5, TimeUnit.SECONDS).points());
        assertNull(house.poll(300, TimeUnit.MILLISECONDS));
    }

    private StompSession connect() throws Exception {
        StompSession session = client
                .connectAsync("ws://localhost:" + port + "/ws-blueprints", new StompSessionHandlerAdapter() {})
                .get(5, TimeUnit.SECONDS);
        sessions.add(session);
        return session;
    }

    private BlockingQueue<BlueprintUpdate> subscribe(StompSession session, String author, String name)
            throws InterruptedException {
        BlockingQueue<BlueprintUpdate> received = new LinkedBlockingQueue<>();
        session.subscribe(DrawController.topicOf(author, name), new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return BlueprintUpdate.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                received.add((BlueprintUpdate) payload);
            }
        });
        // El SUBSCRIBE es asincrono: se espera a que el broker lo registre antes de publicar.
        Thread.sleep(200);
        return received;
    }
}
