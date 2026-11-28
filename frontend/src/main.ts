import '../style.css';
import { createViewer } from './viewer';
import { createPanel } from './ui/panel';
import { createPaletteLegend } from './ui/palette';
import { getData } from './data/data';
import type { Shape } from './data/shapes';

const layout = document.createElement('div');
layout.classList.add('layout');

const viewport = document.createElement('div');
viewport.classList.add('viewport');

const panel = createPanel({ onShapeChange: show });

layout.append(viewport, panel.element);
document.body.appendChild(layout);

const viewer = createViewer(viewport);
viewport.appendChild(panel.toggleButton);
createPaletteLegend(viewport);

function show(shape: Shape) {
    viewer.showShape(shape, getData(shape));
    panel.setActiveShape(shape);
}

show('pyramid'); // начальная фигура