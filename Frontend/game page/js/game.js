let draggedTile = null;

document.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('dragstart', () => {
        draggedTile = tile;
        tile.classList.add('dragging');
    });

    tile.addEventListener('dragend', () => {
        tile.classList.remove('dragging');
    });
});

document.querySelectorAll('.tile-slot').forEach(slot => {
    slot.addEventListener('dragover', e => {
        e.preventDefault();
        slot.classList.add('drop-target');
    });

    slot.addEventListener('dragleave', () => {
        slot.classList.remove('drop-target');
    });

    slot.addEventListener('drop', () => {
        slot.classList.remove('drop-target');

        // Only allow drop if the slot is empty
        if (slot.innerHTML.trim() === '') {
            slot.appendChild(draggedTile.cloneNode(true));
        }
    });
});