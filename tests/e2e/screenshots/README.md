# Playwright Screenshots

Este directorio contiene las capturas de pantalla generadas por los tests E2E de Playwright para el proyecto Tarot2.

## 📸 Flujo CRUD Completo - Arcana

### 1. **01-antes-de-crear.png**
- **Estado inicial** de la pestaña Arcana
- Muestra la lista antes de crear nueva entidad
- Botón "Create Arcana" visible y accesible

### 2. **02-modal-antes-de-guardar.png**
- **UModal abierto** con formulario vacío
- Campos del formulario listos para llenar:
  - Code (#v-0-48)
  - Name (#v-0-56)
  - Description (#v-0-58)
  - Short text (#v-0-57)
  - Is active (#v-0-52)
  - Status (#v-0-51) - necesita manejo especial
- Botones "Save" y "Cancel" visibles

### 3. **03-despues-de-guardar.png**
- **Modal cerrado** y vuelta a la lista
- Nueva entidad `playwright-test-arcana` visible
- Confirmación de creación exitosa

### 4. **entity-before-deletion.png**
- **Captura detallada** antes de eliminación
- Muestra la entidad con sus botones de acción
- Útil para identificar selectores de edit/delete

### 5. **04-despues-de-borrar-simulado.png**
- **Estado simulado** después de borrar (implementación pendiente)
- Cuando implementemos el delete real, esta captura mostrará:
  - Lista sin la entidad eliminada
  - Confirmación de eliminación exitosa

## 🎯 Uso de las Capturas

### **Para Desarrollo:**
- **Entender la estructura** de la UI y selectores
- **Identificar botones de acción** (edit, delete)
- **Debug de problemas** con tests E2E

### **Para Documentación:**
- **Flujo completo** del CRUD de Arcana
- **Referencia visual** para nuevos desarrolladores
- **Evidencia de funcionamiento** correcto

### **Para Debug:**
- **Comparar estados** antes/después de acciones
- **Identificar cambios** en la UI
- **Verificar componentes** renderizados

## 📁 Generación

Las capturas se generan automáticamente cuando se ejecutan los tests E2E:
```bash
pnpm test:e2e --grep "should create arcana entity through web UI"
pnpm test:e2e --grep "should delete arcana entity through web UI"
```

## 🔄 Estados Futuros

Cuando implementemos los selectores correctos para botones:
- **Edit test** generará capturas del flujo de edición
- **Delete test** generará captura 04 real (no simulada)
- **Cleanup automático** eliminará entidades después de los tests
