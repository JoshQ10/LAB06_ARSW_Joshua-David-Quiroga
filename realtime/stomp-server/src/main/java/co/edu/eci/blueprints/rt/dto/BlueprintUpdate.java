package co.edu.eci.blueprints.rt.dto;

import java.util.List;

/** Puntos nuevos de un plano, publicados a todos los suscriptores de su topico. */
public record BlueprintUpdate(String author, String name, List<Point> points) {}
