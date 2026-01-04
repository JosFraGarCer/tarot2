# Proyecto Tarot

Un sistema de juego de rol universal diseñado para la narrativa emergente y personajes competentes.

[![Licencia: CC BY-SA 4.0](https://img.shields.io/badge/Licencia-CC%20BY--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)
[![Versión](https://img.shields.io/badge/Versión-0.1.2.0-blue.svg)](https://github.com/josegarridocercos/proyecto-tarot/releases)

## 🎯 Filosofía de Diseño

Proyecto Tarot se basa en tres pilares fundamentales:

- **🎭 Narrativa Emergente**: Cada tirada genera material narrativo rico y consecuencias inesperadas
- **⚔️ Personajes Competentes**: Los héroes son expertos en sus áreas, evitando tiradas triviales
- **🔧 Modularidad**: Sistema adaptable a cualquier ambientación mediante cartas intercambiables

## ✨ Características Principales

### Sistema de Cartas Único
Los personajes se definen mediante **cinco cartas fundamentales**:
- **Linaje**: Qué eres (herencia biológica/cultural)
- **Entorno**: Dónde te criaste (sociedad formativa)
- **Trasfondo**: Qué te ocurrió (evento definitorio)
- **Ocupación**: Qué haces ahora (profesión/clase)
- **Potencia**: En qué crees (motivador esencial)

### Mecánica del Giro Tarot
- **2d12**: Dado de Habilidad (éxito/fracaso) + Dado de Destino (consecuencias narrativas)
- **Escalabilidad**: Desde aventureros locales hasta leyendas cósmicas
- **Drama Garantizado**: Solo se tira cuando el resultado es narrativamente interesante

### Sistema Mágico Universal
Tres modelos de implementación que cubren cualquier tradición mágica:
- **Académico** (ej. Harry Potter): Una tradición, múltiples escuelas
- **Organizacional** (ej. La Rueda del Tiempo): Múltiples organizaciones especializadas  
- **Profesional** (ej. Warcraft): Múltiples profesiones con recursos compartidos

## 📚 Documentación

### Documentos Principales
- **[Documento de Diseño v0.1.2.0](ProyectoTarot_DocumentodeDiseñodeJuego_0.1.2.0.md)**: Reglas completas del sistema
- **[Cartas de La Rueda del Tiempo](cartas_rueda_del_tiempo_v2.md)**: Ejemplo de adaptación completa
- **[Marco Unificado de Sistemas Mágicos](marco_unificado_final.md)**: Guía para implementar magia

### Investigación y Desarrollo
- **[Análisis de Personajes](analisis_personajes_detallado.md)**: Estudio profundo de arquetipos
- **[Límites de Magia Poderosa](limites_magia_poderosa.md)**: Balance y restricciones
- **[Consenso de Sistemas Mágicos](consenso_unificado_hp_wot.md)**: Comparativa HP vs WoT vs Warcraft

## 🚀 Inicio Rápido

### Crear tu Primer Personaje

1. **Distribuye 9 puntos** entre tres Arcanos (Físico, Mental, Espiritual)
   - Arcano Primario: 5 puntos
   - Arcano Secundario: 3 puntos  
   - Arcano Terciario: 1 punto

2. **Elige tus cinco cartas** respondiendo:
   - ¿Qué eres? → **Linaje**
   - ¿Dónde te criaste? → **Entorno**
   - ¿Qué te ocurrió? → **Trasfondo**
   - ¿Qué haces ahora? → **Ocupación**
   - ¿En qué crees? → **Potencia**

3. **¡Listo para jugar!** Tu personaje es competente y único

### Ejemplo de Tirada

```
Dificultad: Difícil (12)
Faceta del Personaje: Agilidad +3
Dado de Habilidad: 8
Total: 8 + 3 = 11 → ¡Fallo!

Dado de Destino: 10 (Favorable)
Resultado: Fallas, pero sin consecuencias negativas adicionales
```

## 🌍 Ambientaciones Soportadas

El sistema es **verdaderamente universal** y se ha probado exitosamente en:

- **⚔️ Fantasía Medieval**: Dungeons & Dragons, Pathfinder
- **🪄 Mundos Mágicos**: Harry Potter, La Rueda del Tiempo
- **🎮 Fantasía de Videojuegos**: Warcraft, Elder Scrolls
- **🚀 Ciencia Ficción**: Star Wars, Warhammer 40K
- **🏙️ Moderno/Contemporáneo**: World of Darkness, Call of Cthulhu
- **🤖 Cyberpunk**: Shadowrun, Cyberpunk 2020

## 🎲 Ejemplos de Juego

### Harry Potter: Hermione Granger (4to año)
```yaml
Linaje: Nacida de Muggles (+1 Ingenio)
Entorno: Mundo Muggle (Competencia en Tecnología)
Trasfondo: Primera en su Clase (Bonificación académica)
Ocupación: Estudiante de Hogwarts (8 PA, +1 Erudición)
Potencia: El Conocimiento (Intervenciones de sabiduría)

Especialización: Transfiguración +2
Para Transfiguración: Alma (3) + Canalización (2) + Transfiguración (2) = +7
```

### La Rueda del Tiempo: Lan Mandragoran
```yaml
Linaje: Fronterizo (+1 Vigor)
Entorno: Shienar (Competencia en Supervivencia)
Trasfondo: Último Rey de Malkier (Habilidades de liderazgo)
Ocupación: Guardián (14 PA, +1 Fuerza)
Potencia: El Deber (Intervenciones de sacrificio)

Especialización: Espada +3
Para Combate: Fuerza (4) + Espada (3) = +7
```

## 🛠️ Herramientas de Desarrollo

### Para Directores de Juego
- **Arquetipos Universales**: 6 arquetipos adaptables a cualquier ambientación
- **Sistema de Sellos**: Progresión clara desde local hasta cósmico
- **Generación de Adversarios**: Usa los mismos principios que los PCs

### Para Creadores de Contenido
- **Cartas Modulares**: Fácil creación de nuevo contenido
- **Guías de Adaptación**: Preguntas clave para nuevas ambientaciones
- **Ejemplos Detallados**: Múltiples implementaciones de referencia

## 📈 Roadmap

### Versión 0.2.0 (Próxima)
- [ ] Bestiario universal con sistema de cartas
- [ ] Guías de conversión desde D&D 5e
- [ ] Herramientas digitales de creación de personajes

### Versión 0.3.0 (Futuro)
- [ ] Ambientaciones oficiales completas
- [ ] Sistema de combate de masas
- [ ] Reglas avanzadas de magia ritual

### Herramientas Digitales
- [ ] Generador web de personajes
- [ ] Aplicación móvil de gestión
- [ ] Calculadora de probabilidades

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Puedes ayudar de varias formas:

### 🐛 Reportar Problemas
- Usa los [Issues de GitHub](https://github.com/josegarridocercos/proyecto-tarot/issues)
- Incluye ejemplos específicos y contexto
- Etiqueta apropiadamente (bug, enhancement, question)

### 📝 Crear Contenido
- **Cartas nuevas**: Linajes, Entornos, Trasfondos, Ocupaciones, Potencias
- **Ambientaciones**: Adaptaciones completas a nuevos mundos
- **Ejemplos**: Personajes, aventuras, campañas

### 🔧 Desarrollo
1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Añade nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crea un Pull Request

### 📋 Guías de Contribución
- **Formato**: Usa Markdown para documentación
- **Estilo**: Mantén consistencia con el documento principal
- **Testing**: Prueba el contenido en juego real cuando sea posible
- **Licencia**: Todo el contenido debe ser compatible con CC BY-SA 4.0

## 📄 Licencia

Este proyecto está licenciado bajo [Creative Commons Atribución-CompartirIgual 4.0 Internacional](LICENSE).

**Eres libre de:**
- ✅ **Compartir**: copiar y redistribuir en cualquier medio o formato
- ✅ **Adaptar**: remezclar, transformar y construir sobre el material
- ✅ **Uso comercial**: incluso para propósitos comerciales

**Bajo los términos:**
- 📝 **Atribución**: Debes dar crédito apropiado
- 🔄 **CompartirIgual**: Distribuye derivados bajo la misma licencia

## 👥 Comunidad

### Enlaces Oficiales
- **📧 Email**: [jose.garrido.cercos@gmail.com](mailto:jose.garrido.cercos@gmail.com)
- **🐙 GitHub**: [josegarridocercos](https://github.com/josegarridocercos)

### Únete a la Conversación
- **💬 Discusiones**: Usa las [GitHub Discussions](https://github.com/josegarridocercos/proyecto-tarot/discussions)
- **📢 Anuncios**: Watch el repositorio para actualizaciones
- **🎲 Playtesting**: Comparte tus experiencias de juego

## 🙏 Agradecimientos

Proyecto Tarot se inspira en décadas de evolución en el diseño de juegos de rol, con especial reconocimiento a:

- **Sistemas Narrativos**: Fate, Powered by the Apocalypse
- **Mecánicas Innovadoras**: Blades in the Dark, Genesys
- **Universalidad**: GURPS, Savage Worlds
- **Comunidad**: Todos los jugadores y DMs que han probado el sistema

## 📊 Estadísticas del Proyecto

![GitHub stars](https://img.shields.io/github/stars/josegarridocercos/proyecto-tarot?style=social)
![GitHub forks](https://img.shields.io/github/forks/josegarridocercos/proyecto-tarot?style=social)
![GitHub issues](https://img.shields.io/github/issues/josegarridocercos/proyecto-tarot)
![GitHub pull requests](https://img.shields.io/github/issues-pr/josegarridocercos/proyecto-tarot)

---

**¿Listo para crear historias épicas? ¡Descarga el sistema y comienza tu aventura!**

*"En Proyecto Tarot, cada tirada cuenta una historia, cada personaje tiene un destino, y cada partida es una leyenda en construcción."*
