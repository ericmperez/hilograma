# Hilograma

Convierte una foto en un patrón de bordado. Todo corre en el navegador: no hace falta cuenta ni servidor.

## Qué hace

- Reduce la imagen a una grilla de puntadas
- Cuantiza el color y lo acerca a hilos **DMC**
- Digitaliza un modelo real: **satén** en zonas estrechas, **tatami** en rellenos y **contorno** al final
- Simula también **punto de cruz**, satén, relleno y contorno por separado
- Calcula el tamaño real según la cuenta de Aida
- Exporta **PNG**, **SVG**, **carta de patrón**, **lista de hilos** y **DST** para máquina Tajima

La vista previa enseña tela Aida o lino, hilo con volumen y el aro. Puedes reproducir cómo se va bordando. El DST incluye underlay, atados, saltos cortos como viaje y puntadas partidas a un largo máximo. Ábrelo en Wilcom, Ink/Stitch, Hatch o PE-Design y revisa densidad antes de coserlo en tela buena.

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
