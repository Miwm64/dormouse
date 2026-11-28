import { SHAPES, type Shape } from '../data/shapes';

export type Panel = {
    element: HTMLElement;
    toggleButton: HTMLButtonElement;
    setActiveShape(shape: Shape): void;
};

export function createPanel(options: { onShapeChange: (shape: Shape) => void }): Panel {
    const element = document.createElement('aside');
    element.classList.add('side-panel');

    const heading = document.createElement('h2');
    heading.textContent = 'Фигура';

    const shapeList = document.createElement('div');
    shapeList.classList.add('shape-list');

    element.append(heading, shapeList);

    const buttons = new Map<Shape, HTMLButtonElement>();
    for (const { id, label } of SHAPES) {
        const button = document.createElement('button');
        button.textContent = label;
        button.classList.add('control-button');
        button.addEventListener('click', () => options.onShapeChange(id));
        shapeList.appendChild(button);
        buttons.set(id, button);
    }

    const toggleButton = document.createElement('button');
    toggleButton.classList.add('panel-toggle');
    toggleButton.textContent = '☰';
    toggleButton.title = 'Показать / скрыть панель';
    toggleButton.addEventListener('click', () => element.classList.toggle('collapsed'));

    return {
        element,
        toggleButton,
        setActiveShape(shape) {
            for (const [id, button] of buttons) {
                button.classList.toggle('active', id === shape);
            }
        },
    };
}