package co.edu.eci.blueprints.rt.dto;

/** Punto dibujado por un cliente sobre el plano {author}/{name}. */
public record DrawEvent(String author, String name, Point point) {}
