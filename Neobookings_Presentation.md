# Neobookings — Presentación Hackathon
Más contexto: cada carpeta del repo contiene un README/MD con detalles de implementación (revisar `FrontEnd/`, `MCP API/`, `Proxy API/`).

---

- Valor: demostramos que un asistente IA + MCP + Proxy API puede simplificar significativamente la experiencia de reservar viajes y permitir pagos descentralizados con trazabilidad.
- Los mayores desafíos fueron la documentación de Camino, gestión de wallets y la integración frontend-backend en tiempo.
- Aprendimos a trabajar con CaminoMessenger, diseñar e implementar un MCP, e integrar un LLM en el flujo.
Cierre — aprendizajes clave

GitIgnore (añadido al repo): ver `.gitignore`

- Si tienes una paleta específica, la actualizamos.
  - Background: #FFFFFF (blanco)
  - Neutral: #121212 (gris oscuro)
  - Accent: #00A67E (verde)
  - Primary: #0F62FE (azul)
- No se proporcionó la paleta final; proponemos una paleta simple para las diapositivas:
Colores y estilo (asunción — pedir paleta si se necesita exacta)

- Recomendación: mostrar un demo donde el usuario escribe en lenguaje natural y el sistema retorna resultados humanizados.
- Proxy API: Node/Express — traductor a Camino/Neobookings/Expedia
- MCP API: orquestador LLM + Tools
- FrontEnd: Vue.js — buscador con IA
Notas prácticas para el demo (slide final)

- Añadir métricas de calidad y reputación para mejor matching.
- Integrar pagos on-chain con flows de autorización (EUDI Wallet / credenciales verificadas para booking delegation).
- Implementar catálogo de suppliers con sincronización en tiempo real y caching inteligente.
- Mejorar conversación: pasar de prompt único a una sesión conversacional persistente.
- Añadir búsqueda de transfers y actividades.
Siguientes pasos / mejoras

- Problemas de conexión y CORS entre FrontEnd y MCP/Proxy durante desarrollo; resuelto parcialmente.
- Mucho tiempo invertido en: crear Camino Message Bot, creación y gestión de wallets, lectura extensa de documentación.
- No tuvimos tiempo de implementar búsquedas combinadas hotel+travel (paquetes completos), pero la arquitectura lo soporta.
Limitaciones actuales y problemas encontrados

- Proxy API permite añadir nuevos proveedores sin cambiar LLM ni MCP: actúa como capa de adaptadores.
- AI agents / agentes humanos / workflows B2B usan MCP para orquestar reservas y pagos.
- Usuarios pueden interactuar por chat (IA) o por formulario clásico.
Hybrid Interaction Model (valor diferencial)

- Más coste-efectivo y rápido de integrar para el scope de la hackathon.
- Supply estandarizado facilita mapeos y reduce complejidad frente a integraciones GDS completas.
- Arquitectura simple y patrón B2B probado para coordinación multi-supplier.
Por qué Camino Messenger

7. Render: FrontEnd recibe un JSON limpio y humanizado + datos estructurados listos para renderizar.
6. Refinamiento LLM: Los resultados regresan al LLM — filtra no disponibles, ordena por precio, transforma formatos técnicos en texto amigable y aplica filtros adicionales (ej: "solo hoteles con piscina") si la Tool no lo soportó.
5. Proxy API ("Translator"): Traduce la petición a la API específica del proveedor (Camino, Neobookings, Expedia...) y devuelve JSON crudo.
4. Ejecución MCP: El servidor MCP recibe la instrucción y ejecuta la Tool. En vez de llamar directamente a CaminoMessenger, llama al Proxy API.
3. Decisión: LLM extrae parámetros (ubicacion, fechas, huéspedes, filtros) y elige la Tool adecuada (ej: `buscar_disponibilidad`).
2. Interpretación: FrontEnd → API REST → LLM (GPT-4o). El LLM conoce las Tools y decide la acción a ejecutar.
1. Input: Usuario escribe en natural (ej: "Buscar hoteles en Barcelona para 2 personas del 1 al 7 de junio").
How it works — The flow (slide de alto impacto)

- Blockchain: pago on-chain (USDC / EURe) para liquidación instantánea y auditabilidad.
- Camino Messenger: proveedor/dispatcher B2B para coordinación y supply estándar.
- Proxy API (Node/Express): API inteligente que actúa de traductor y conector a Camino Messenger, Neobookings, Expedia, etc.
- MCP API: orquesta la interacción con el LLM (GPT-4o) y las Tools disponibles.
- FrontEnd (Vue): UI conversacional y formulario tradicional.
Arquitectura (diapositiva técnica)

- Usamos Camino Messenger como patrón probado para coordinación multi-supplier (B2B), y un Proxy API como traductor hacia múltiples proveedores.
- Añadimos un MCP (Model Context Protocol) para estandarizar descubrimiento y ejecución de herramientas desde el LLM.
- Interfaz híbrida: prompt en lenguaje natural + formulario clásico.
Solución tomada (alto nivel)

- Con la IA conversacional, un planificador que entienda lenguaje humano y busque vuelos y hoteles ofrece una experiencia simple, rápida y precisa.
- Las soluciones actuales muestran formularios complejos y mucha información para volver a ofrecer un solo hotel. El vuelo suele buscarse por separado.
Por qué necesitamos resolverlo (diapositiva corta)

- El sistema actúa como intermediario inteligente que agrega capacidades de múltiples suppliers y enruta solicitudes según preferencias y reglas.
- Construimos un asistente/planificador de viajes que entiende lenguaje natural y puede usar tanto prompts conversacionales como formularios clásicos.
Resumen del proyecto

- Stack visible: FrontEnd (Vue), MCP API (conector LLM), Proxy API (Node/Express), integraciones con proveedores (Camino, Neobookings, Expedia...)
- Neobookings: equipo de desarrollo. Primera hackathon.
Who we are (diapositiva corta)

  - Optimizar por velocidad y coste, con transparencia total en selección y pricing
  - Pagos instantáneos on-chain: USDC o EURe (Monerium)
  - Enrutamiento basado en reglas (comerciales, regulatorias, calidad)
  - Catálogo de proveedores actualizado y discovery en tiempo real
  - Matching inteligente por destino, tipo de servicio, rango de precio, métricas de calidad y disponibilidad
- Requisitos clave:
- Objetivo: Plataforma inteligente de itinerarios y reservas que permita a agentes de viaje, agentes AI o partes autorizadas componer y reservar servicios de viaje de forma inteligente entre múltiples proveedores.
El reto (challenge)

- Qué hacemos (one-liner): Motor de reservas inteligente para hoteles y cadenas hoteleras, integrable con múltiples proveedores.
- Quiénes somos: desarrolladores de Neobookings — primera participación en una hackathon. Trabajamos con blockchain y MCP.
- Nombre: Neobookings
Resumen rápido (para diapositiva inicial)

- [x] Añadir .gitignore (creado en el repo)
- [x] Añadir problemas y lecciones aprendidas
- [x] Describir cómo funciona (flow Input → Decide → Execute → Refine → Render)
- [x] Explicar solución (MCP + Camino Messenger + Proxy API + LLM)
- [x] Incluir el Challenge (itinerario IA + pagos descentralizados)
- [x] Resumir "Who We Are" (más corto)
- [x] Crear un MD de presentación compacto y listo para diapositivas
Checklist breve


