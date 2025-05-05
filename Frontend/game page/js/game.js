'use strict';

// === Asset Directory Constants ===
const TILE_IMAGE_DIR = 'assets/tiles/';
const BACKGROUND_IMAGE = 'assets/images/red background.png';

const TILE_IMAGES = {
    PlainBlue: TILE_IMAGE_DIR + 'blue.png',
    YellowRed: TILE_IMAGE_DIR + 'yellow.png',
    BlackBlue: TILE_IMAGE_DIR + 'black.png',
    WhiteTurquoise: TILE_IMAGE_DIR + 'lightblue.png', // No spaces in filename!
    PlainRed: TILE_IMAGE_DIR + 'red.png',
    StartingTile: TILE_IMAGE_DIR + 'token.jpg'
};

const API_BASE = 'https://localhost:5051/api';
const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get('gameId') || urlParams.get('tableId'); // Support both

// Set background image dynamically for extra robustness
window.addEventListener('DOMContentLoaded', () => {
    document.body.style.background = `none`; // Remove default
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

async function fetchGameWithRetry(gameId, maxRetries = 10, delayMs = 1000) {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const response = await fetch(`${API_BASE}/Games/${gameId}`, {
                headers: { 'Authorization': 'Bearer ' + getAuthToken() }
            });
            if (response.ok) {
                return await response.json();
            }
            // If not found, wait and retry
            if (response.status === 404) {
                attempt++;
                await new Promise(res => setTimeout(res, delayMs));
                continue;
            }
            // For other errors, throw
            throw new Error('Failed to fetch game');
        } catch (err) {
            attempt++;
            await new Promise(res => setTimeout(res, delayMs));
        }
    }
    throw new Error('Game not found after multiple attempts.');
}

function renderFactories(factories) {
    const factoriesDiv = document.getElementById('factories');
    factoriesDiv.innerHTML = '';
    if (!factories || !Array.isArray(factories)) return;
    factories.forEach((factory, i) => {
        const div = document.createElement('div');
        div.className = 'factory';
        div.innerHTML = (factory.tiles || []).map(tile =>
            `<div class="factory-tile" style="background-image:url('${TILE_IMAGES[tile] || ''}')" title="${tile}"></div>`
        ).join('');
        div.setAttribute('data-factory-index', i);
        factoriesDiv.appendChild(div);
    });
}

function renderCenter(center) {
    const centerDiv = document.getElementById('center');
    centerDiv.innerHTML = '';
    if (!center || !Array.isArray(center.tiles)) return;
    center.tiles.forEach(tile => {
        const div = document.createElement('div');
        div.className = 'center-tile';
        div.style.backgroundImage = `url('${TILE_IMAGES[tile] || ''}')`;
        div.title = tile;
        centerDiv.appendChild(div);
    });
}

function renderBoards(players, currentPlayerId) {
    const boardsDiv = document.getElementById('boards');
    boardsDiv.innerHTML = '';
    if (!players || !Array.isArray(players)) return;
    players.forEach(player => {
        const boardDiv = document.createElement('div');
        boardDiv.className = 'player-board' + (player.id === currentPlayerId ? ' active' : '');
        // Defensive: handle missing board
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
            <div class="player-name">${player.name}</div>
            <div class="score">Score: ${player.score ?? 0}</div>
            <div class="pattern-lines">${patternLinesHtml}</div>
            <div class="wall">${wallHtml}</div>
            <div class="floor-line">Floor: ${floorHtml}</div>
            ${player.isCurrentTurn ? '<div class="turn-indicator">🎯 Your Turn!</div>' : ''}
        `;
        boardsDiv.appendChild(boardDiv);
    });
}

function renderGame(game) {
    document.getElementById('game-id').textContent = `Game ID: ${game.id}`;
    document.getElementById('current-turn').textContent = `Current turn: ${game.currentPlayerName || ''}`;
    renderFactories(game.tileFactory?.factories);
    renderCenter(game.tileFactory?.tableCenter);
    renderBoards(game.players, getCurrentUser()?.id);
}

let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 3;

async function pollGameState() {
    try {
        const game = await fetchGameWithRetry(gameId, 2, 1000); // fewer retries for polling
        renderGame(game);
        consecutiveErrors = 0;
        setTimeout(pollGameState, 2000);
    } catch (err) {
        consecutiveErrors++;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            alert('Unable to join game. Please try again later.');
            await leaveGame();
        } else {
            // Try again after a short delay
            setTimeout(pollGameState, 2000);
        }
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
    // Also remove any gameId or related info
    localStorage.removeItem('gameId');
    window.location.href = '../lobby page/lobby.html';
}


window.addEventListener('DOMContentLoaded', () => {
    pollGameState();
    document.getElementById('leave-game').addEventListener('click', leaveGame);
});
