# Hilograma

Convierte una foto en un patrón de bordado. Todo corre en el navegador: no hace falta cuenta ni servidor.

## Qué hace

- Reduce la imagen a una grilla de puntadas
- Cuantiza el color y lo acerca a hilos **DMC**
- Simula cuatro estilos: **punto de cruz**, **satén**, **relleno tatami** y **contorno**
- Calcula el tamaño real según la cuenta de Aida
- Exporta **PNG**, **SVG**, **carta de patrón**, **lista de hilos** y **DST** para máquina Tajima

El DST es un archivo de bordado de máquina. Ábrelo en tu software (Wilcom, Ink/Stitch, Hatch, PE-Design, etc.) y revisa densidad y saltos antes de coserlo. Hilograma genera un diseño utilizable, no un archivo de producción final listo para fábrica.

## Uso

```bash
npm install
npm run dev
```

1. Suelta una foto o pulsa **Usar motivo de ejemplo**
2. Elige estilo, cantidad de puntadas y colores
3. Descarga el preview, la carta o el `.dst`

## Notas

Los códigos DMC son una paleta de trabajo para acercar el color de la foto a ovillos reales. Confirma el matiz con una carta física antes de comprar hilo.
