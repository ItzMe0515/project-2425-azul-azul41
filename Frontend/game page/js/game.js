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

// --- Query Parameter Debugging ---
console.log("window.location.search:", window.location.search);
const urlParams = new URLSearchParams(window.location.search);
for (const [key, value] of urlParams.entries()) {
    console.log(`Query param: ${key} = ${value}`);
}
let gameId = urlParams.get('gameId');
const tableId = urlParams.get('tableId');
console.log("Extracted gameId:", gameId);
console.log("Extracted tableId:", tableId);

// Set main background image
window.addEventListener('DOMContentLoaded', () => {
    document.body.style.background = `none`;
    document.body.style.backgroundImage = `url('${BACKGROUND_IMAGE}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';

    if (!gameId && tableId) {
        console.log('No gameId in URL, polling for gameId using tableId:', tableId);
        pollForGameId();
    } else if (gameId) {
        console.log('Starting to poll game state for gameId:', gameId);
        pollGameState();
    }
    const leaveBtn = document.getElementById('leave-game');
    if (leaveBtn) leaveBtn.addEventListener('click', leaveGame);
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
    if (!circleDiv) {
        console.warn('No factory-circle div found in DOM!');
        return;
    }
    circleDiv.innerHTML = '';

    if (!factories || !Array.isArray(factories)) {
        console.error('Factories data is missing or not an array:', factories);
        return;
    }
    const n = factories.length;
    const radius = 200; // px
    const cx = 240, cy = 240;

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
        console.log(`Factory ${i} tiles:`, factory.tiles);
    });

    // Render center in the middle
    const centerDiv = document.createElement('div');
    centerDiv.id = 'table-center';
    centerDiv.innerHTML = (center.tiles || []).map(tile =>
        `<div class="center-tile" style="background-image:url('${TILE_IMAGES[tile] || ''}')" title="${tile}"></div>`
    ).join('');
    circleDiv.appendChild(centerDiv);
    console.log('Table center tiles:', center.tiles);
}

// --- Boards ---
function renderBoards(players, currentPlayerId, playerToPlayId) {
    const boardsDiv = document.getElementById('boards');
    if (!boardsDiv) {
        console.warn('No boardsDiv found in DOM!');
        return;
    }
    boardsDiv.innerHTML = '';
    if (!players || !Array.isArray(players)) {
        console.error('Players data is missing or not an array:', players);
        return;
    }
    players.forEach((player, idx) => {
        const boardDiv = document.createElement('div');
        boardDiv.className = 'player-board' + (player.id === currentPlayerId ? ' active' : '');
        boardDiv.style.backgroundImage = `url('${BOARD_BG_IMAGE}')`;
        boardDiv.style.backgroundSize = 'cover';
        boardDiv.style.backgroundPosition = 'center';

        let patternLinesHtml = '';
        if (player.board && Array.isArray(player.board.patternLines)) {
            patternLinesHtml = player.board.patternLines.map((line, idx) =>
                `<div class="pattern-line">${
                    (Array.isArray(line) ? line : []).map(tile =>
                        `<div class="pattern-tile" style="background-image:url('${TILE_IMAGES[tile] || ''}')"></div>`
                    ).join('')
                }${'<div class="pattern-tile empty"></div>'.repeat(Math.max(0, idx + 1 - (line ? line.length : 0)))}</div>`
            ).join('');
        } else {
            console.error(`Player ${idx} (${player.name}) has no board or patternLines:`, player.board);
        }
        let wallHtml = '';
        if (player.board && Array.isArray(player.board.wall)) {
            wallHtml = Array.from(player.board.wall).map(row =>
                `<div class="wall-row">${Array.from(row).map(tileSpot =>
                    `<div class="wall-tile" style="background-image:url('${TILE_IMAGES[tileSpot.Type] || ''}')"></div>`
                ).join('')}</div>`
            ).join('');
        } else {
            console.error(`Player ${idx} (${player.name}) has no board or wall:`, player.board);
        }
        let floorHtml = '';
        if (player.board && Array.isArray(player.board.floorLine)) {
            floorHtml = player.board.floorLine.map(tileSpot =>
                `<div class="floor-tile" style="background-image:url('${TILE_IMAGES[tileSpot.Type] || ''}')"></div>`
            ).join('');
        } else {
            console.error(`Player ${idx} (${player.name}) has no board or floorLine:`, player.board);
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
        console.log(`Player ${idx} (${player.name}) board:`, player.board);
    });
}

// --- Game Rendering ---
function renderGame(game) {
    try {
        console.log('Rendering game with ID:', game.id);
        if (!game.players || !Array.isArray(game.players)) {
            console.error('No players array in game object:', game);
        } else {
            console.log('Number of players:', game.players.length);
            game.players.forEach((p, idx) => {
                console.log(`Player ${idx}:`, p.name, 'Board:', p.board);
            });
        }
        if (!game.tileFactory || !Array.isArray(game.tileFactory.displays)) {
            console.error('No factory displays in game object:', game.tileFactory);
        } else {
            console.log('Number of factory displays:', game.tileFactory.displays.length);
            game.tileFactory.displays.forEach((f, idx) => {
                console.log(`Factory ${idx} tiles:`, f.tiles);
            });
        }
        if (!game.tileFactory || !game.tileFactory.tableCenter) {
            console.error('No table center in game object:', game.tileFactory);
        } else {
            console.log('Tiles in table center:', game.tileFactory.tableCenter.tiles);
        }

        document.getElementById('game-id').textContent = `Game ID: ${game.id}`;
        document.getElementById('round-info').textContent = `Round: ${game.roundNumber}`;
        const currentPlayer = game.players.find(p => p.id === game.playerToPlayId);
        document.getElementById('turn-indicator').textContent = currentPlayer
            ? `Current Turn: ${currentPlayer.name}`
            : '';

        renderFactoryCircle(game.tileFactory?.displays, game.tileFactory?.tableCenter);
        renderBoards(game.players, getCurrentUser()?.id, game.playerToPlayId);
    } catch (err) {
        console.error('Error rendering game:', err);
    }
}

// --- API ---
async function fetchTable(tableId) {
    try {
        const response = await fetch(`${API_BASE}/Tables/${tableId}`, {
            headers: { 'Authorization': 'Bearer ' + getAuthToken() }
        });
        if (!response.ok) throw new Error('Failed to fetch table');
        const data = await response.json();
        console.log('Fetched table data:', data);
        return data;
    } catch (err) {
        console.error('Error fetching table:', err);
        throw err;
    }
}

async function pollForGameId() {
    if (!tableId) return;
    while (true) {
        try {
            const table = await fetchTable(tableId);
            if (table.gameId && table.gameId !== '00000000-0000-0000-0000-000000000000') {
                console.log('GameId found, redirecting:', table.gameId);
                window.location.href = `game.html?gameId=${table.gameId}`;
                return;
            }
        } catch (err) {
            console.error('Error polling for gameId:', err);
        }
        showNotification("Waiting for game to start...", 1000);
        await new Promise(res => setTimeout(res, 2000));
    }
}

async function fetchGameWithRetry(gameId, maxRetries = 2, delayMs = 1000) {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            console.log(`Attempt ${attempt + 1} to fetch game with ID: ${gameId}`);
            const response = await fetch(`${API_BASE}/Games/${gameId}`, {
                headers: { 'Authorization': 'Bearer ' + getAuthToken() }
            });
            if (response.ok) {
                console.log('Game data fetched successfully');
                const data = await response.json();
                console.log('Game data:', data);
                return data;
            }
            if (response.status === 404) {
                console.warn(`Game with ID ${gameId} not found (404)`);
                attempt++;
                await new Promise(res => setTimeout(res, delayMs));
                continue;
            }
            console.error('Failed to fetch game: HTTP status', response.status);
            throw new Error('Failed to fetch game');
        } catch (err) {
            console.error('Error fetching game:', err);
            attempt++;
            await new Promise(res => setTimeout(res, delayMs));
        }
    }
    console.error('Game not found after multiple attempts.');
    throw new Error('Game not found after multiple attempts.');
}

async function pollGameState() {
    try {
        const game = await fetchGameWithRetry(gameId, 2, 1000);
        renderGame(game);
        setTimeout(pollGameState, 2000);
    } catch (err) {
        console.error('Polling game state failed:', err);
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
        } catch (err) {
            console.error('Error leaving table:', err);
        }
        localStorage.removeItem('tableId');
    }
    localStorage.removeItem('gameId');
    localStorage.removeItem('currentTableId');
    localStorage.removeItem('currentTableSeats');
    window.location.href = '../lobby page/lobby.html'; // or your actual game selection page
}
