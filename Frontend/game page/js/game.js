'use strict';

// === Asset Directory Constants ===
const TILE_IMAGE_DIR = 'assets/tiles/';
const FACTORY_BG_IMAGE = 'assets/factory/factory.jpg';
const BOARD_BG_IMAGE = 'assets/images/background board texture.jpg';
const BACKGROUND_IMAGE = 'assets/images/azul-bg.jpg';

const TILE_IMAGES = {
    PlainBlue: TILE_IMAGE_DIR + 'blue.png',
    YellowRed: TILE_IMAGE_DIR + 'yellow.png',
    BlackBlue: TILE_IMAGE_DIR + 'black.png',
    WhiteTurquoise: TILE_IMAGE_DIR + 'lightblue.png',
    PlainRed: TILE_IMAGE_DIR + 'red.png',
    StartingTile: TILE_IMAGE_DIR + 'token.jpg'
};

const API_BASE = 'https://localhost:5051/api';
const urlParams = new URLSearchParams(window.location.search);
let gameId = urlParams.get('gameId');
const tableId = urlParams.get('tableId');

// Set main background image
window.addEventListener('DOMContentLoaded', () => {
    document.body.style.background = `none`;
    document.body.style.backgroundImage = `url('${BACKGROUND_IMAGE}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
});

function getAuthToken() {
    return localStorage.getItem('authToken');
}
function getCurrentUser() {
    let user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

function showNotification(msg, duration = 2000) {
    const notif = document.getElementById('notification');
    notif.textContent = msg;
    notif.style.display = 'block';
    setTimeout(() => { notif.style.display = 'none'; }, duration);
}

// --- Factories & Center in a Circle ---
function renderFactoryCircle(factories, center) {
    const circleDiv = document.getElementById('factory-circle');
    circleDiv.innerHTML = '';

    const n = factories.length;
    const radius = 200; // px
    const cx = 240, cy = 240;

    // Render factories in a circle
    factories.forEach((factory, i) => {
        const angle = ((2 * Math.PI) / n) * i - Math.PI / 2;
        const x = cx + radius * Math.cos(angle) - 55;
        const y = cy + radius * Math.sin(angle) - 55;
        const div = document.createElement('div');
        div.className = 'factory';
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        div.style.backgroundImage = `url('${FACTORY_BG_IMAGE}')`;
        div.innerHTML = (factory.tiles || []).map(tile =>
            `<div class="factory-tile" style="background-image:url('${TILE_IMAGES[tile] || ''}')" title="${tile}"></div>`
        ).join('');
        circleDiv.appendChild(div);
    });

    // Render center in the middle
    const centerDiv = document.createElement('div');
    centerDiv.id = 'table-center';
    centerDiv.innerHTML = (center.tiles || []).map(tile =>
        `<div class="center-tile" style="background-image:url('${TILE_IMAGES[tile] || ''}')" title="${tile}"></div>`
    ).join('');
    circleDiv.appendChild(centerDiv);
}

// --- Boards ---
function renderBoards(players, currentPlayerId, playerToPlayId) {
    const boardsDiv = document.getElementById('boards');
    boardsDiv.innerHTML = '';
    if (!players || !Array.isArray(players)) return;
    players.forEach(player => {
        const boardDiv = document.createElement('div');
        boardDiv.className = 'player-board' + (player.id === currentPlayerId ? ' active' : '');
        boardDiv.style.backgroundImage = `url('${BOARD_BG_IMAGE}')`;
        boardDiv.style.backgroundSize = 'cover';
        boardDiv.style.backgroundPosition = 'center';

        let patternLinesHtml = '';
        if (player.board && Array.isArray(player.board.patternLines)) {
            patternLinesHtml = player.board.patternLines.map((line, idx) =>
                `<div class="pattern-line">${(line || []).map(tile =>
                    `<div class="pattern-tile" style="background-image:url('${TILE_IMAGES[tile] || ''}')"></div>`
                ).join('')}
                ${'<div class="pattern-tile empty"></div>'.repeat(Math.max(0, idx + 1 - (line ? line.length : 0)))}
                </div>`
            ).join('');
        }
        let wallHtml = '';
        if (player.board && Array.isArray(player.board.wall)) {
            wallHtml = player.board.wall.map(row =>
                `<div class="wall-row">${(row || []).map(tile =>
                    `<div class="wall-tile" style="background-image:url('${TILE_IMAGES[tile] || ''}')"></div>`
                ).join('')}</div>`
            ).join('');
        }
        let floorHtml = '';
        if (player.board && Array.isArray(player.board.floorLine)) {
            floorHtml = player.board.floorLine.map(tile =>
                `<div class="floor-tile" style="background-image:url('${TILE_IMAGES[tile] || ''}')"></div>`
            ).join('');
        }
        boardDiv.innerHTML = `
            <div class="player-name">
                ${player.name}
                ${player.id === playerToPlayId ? '<span class="turn-indicator">🎯 TURN</span>' : ''}
            </div>
            <div class="score">Score: ${player.board?.score ?? 0}</div>
            <div class="pattern-lines">${patternLinesHtml}</div>
            <div class="wall">${wallHtml}</div>
            <div class="floor-line">Floor: ${floorHtml}</div>
            ${player.hasStartingTile ? '<div class="turn-indicator">🏅 Has Starting Tile</div>' : ''}
        `;
        boardsDiv.appendChild(boardDiv);
    });
}

// --- Game Rendering ---
function renderGame(game) {
    document.getElementById('game-id').textContent = `Game ID: ${game.id}`;
    document.getElementById('round-info').textContent = `Round: ${game.roundNumber}`;
    const currentPlayer = game.players.find(p => p.id === game.playerToPlayId);
    document.getElementById('turn-indicator').textContent = currentPlayer
        ? `Current Turn: ${currentPlayer.name}`
        : '';
    renderFactoryCircle(game.tileFactory?.displays, game.tileFactory?.tableCenter);
    renderBoards(game.players, getCurrentUser()?.id, game.playerToPlayId);
}

// --- API ---
async function fetchTable(tableId) {
    const response = await fetch(`${API_BASE}/Tables/${tableId}`, {
        headers: { 'Authorization': 'Bearer ' + getAuthToken() }
    });
    if (!response.ok) throw new Error('Failed to fetch table');
    return await response.json();
}

async function pollForGameId() {
    if (!tableId) return;
    while (true) {
        try {
            const table = await fetchTable(tableId);
            if (table.gameId && table.gameId !== '00000000-0000-0000-0000-000000000000') {
                window.location.href = `game.html?gameId=${table.gameId}`;
                return;
            }
        } catch (err) {}
        showNotification("Waiting for game to start...", 1000);
        await new Promise(res => setTimeout(res, 2000));
    }
}

async function fetchGameWithRetry(gameId, maxRetries = 2, delayMs = 1000) {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const response = await fetch(`${API_BASE}/Games/${gameId}`, {
                headers: { 'Authorization': 'Bearer ' + getAuthToken() }
            });
            if (response.ok) {
                return await response.json();
            }
            if (response.status === 404) {
                attempt++;
                await new Promise(res => setTimeout(res, delayMs));
                continue;
            }
            throw new Error('Failed to fetch game');
        } catch (err) {
            attempt++;
            await new Promise(res => setTimeout(res, delayMs));
        }
    }
    throw new Error('Game not found after multiple attempts.');
}

async function pollGameState() {
    try {
        const game = await fetchGameWithRetry(gameId, 2, 1000);
        renderGame(game);
        setTimeout(pollGameState, 2000);
    } catch (err) {
        setTimeout(pollGameState, 2000);
    }
}

async function leaveGame() {
    const tableId = localStorage.getItem('tableId');
    if (tableId) {
        try {
            await fetch(`${API_BASE}/Tables/${tableId}/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + getAuthToken()
                }
            });
        } catch (err) {}
        localStorage.removeItem('tableId');
    }
    localStorage.removeItem('gameId');
    localStorage.removeItem('currentTableId');
    localStorage.removeItem('currentTableSeats');
    // Redirect to the game selection page (not the waiting room or lobby)
    window.location.href = '../lobby page/lobby.html'; // or your actual game selection page
}


// --- DOM Ready ---
window.addEventListener('DOMContentLoaded', () => {
    if (!gameId && tableId) {
        pollForGameId();
    } else if (gameId) {
        pollGameState();
    }
    document.getElementById('leave-game').addEventListener('click', leaveGame);
});
