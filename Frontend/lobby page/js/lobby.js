'use strict';

// --- Utility Functions ---

function getAuthToken() {
    return localStorage.getItem('authToken');
}

function getCurrentUser() {
    let user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// --- DOM Elements ---
let usernameSpan = document.getElementById('username');
let playerButtons = document.querySelectorAll('.player-btn');
let joinBtn = document.getElementById('join-btn');
let playerCountInput = document.getElementById('player-count');
let tableStatusDiv = document.getElementById('table-status');
let tableIdSpan = document.getElementById('table-id');
let seatsTakenSpan = document.getElementById('seats-taken');
let seatsTotalSpan = document.getElementById('seats-total');
let playersList = document.getElementById('players');
let lobbyErrorDiv = document.getElementById('lobby-error');

// --- State ---
let selectedPlayerCount = null;
let pollingInterval = null;

// --- Error Handling Helper ---
function showLobbyError(message) {
    if (lobbyErrorDiv) {
        if (message) {
            lobbyErrorDiv.textContent = message;
            lobbyErrorDiv.classList.add('visible');
        } else {
            lobbyErrorDiv.textContent = '';
            lobbyErrorDiv.classList.remove('visible');
        }
    }
}

// --- Initialization ---
window.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    let user = getCurrentUser();
    if (!user) {
        window.location.href = '../index.html';
        return;
    }

    // Show username
    usernameSpan.textContent = user.userName || user.username || user.email || 'Unknown';

    // Player count selection
    playerButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            playerButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedPlayerCount = parseInt(btn.dataset.count, 10);
            playerCountInput.value = selectedPlayerCount;
            joinBtn.disabled = false;
            showLobbyError('');
        });
    });

    // Join/create table
    document.getElementById('game-type-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        joinBtn.disabled = true;
        joinBtn.textContent = 'Joining...';
        showLobbyError('');

        // Defensive: check if player count is selected
        if (!selectedPlayerCount) {
            showLobbyError('Please select the number of players.');
            resetJoinBtn();
            return;
        }

        try {
            let response = await fetch('https://localhost:5051/api/Tables/join-or-create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + getAuthToken()
                },
                body: JSON.stringify({
                    playerCount: selectedPlayerCount
                })
            });

            let text = await response.text();
            let result = {};
            if (text) {
                try {
                    result = JSON.parse(text);
                } catch (e) {
                    showLobbyError('Invalid server response!');
                    resetJoinBtn();
                    return;
                }
            }

            if (!response.ok) {
                showLobbyError(result.message || 'Could not join or create table!');
                resetJoinBtn();
                return;
            }

            showLobbyError('');

            // Show table status
            showTableStatus(result);

            // Start polling for table updates (players joining)
            if (pollingInterval) clearInterval(pollingInterval);
            pollingInterval = setInterval(() => pollTableStatus(result.id), 2500);

        } catch (err) {
            showLobbyError('Could not connect to the server!');
            resetJoinBtn();
        }
    });
});

// --- Functions ---

function resetJoinBtn() {
    joinBtn.disabled = false;
    joinBtn.textContent = 'Find or Create Table';
}

function showTableStatus(table) {
    // table: { id, playerCount, currentPlayers: [ {userName/email}, ... ] }
    tableStatusDiv.classList.remove('hidden');
    tableIdSpan.textContent = table.id || '-';
    seatsTotalSpan.textContent = table.playerCount || selectedPlayerCount || '-';
    seatsTakenSpan.textContent = table.currentPlayers ? table.currentPlayers.length : 1;

    // Fill player list
    playersList.innerHTML = '';
    (table.currentPlayers || []).forEach(player => {
        let li = document.createElement('li');
        li.textContent = player.userName || player.username || player.email || 'Unknown';
        playersList.appendChild(li);
    });
}

async function pollTableStatus(tableId) {
    try {
        let response = await fetch(`https://localhost:5051/api/Tables/${tableId}`, {
            headers: {
                'Authorization': 'Bearer ' + getAuthToken()
            }
        });
        if (!response.ok) return;
        let table = await response.json();
        showTableStatus(table);

        // If table is full, stop polling and redirect to game
        if (table.currentPlayers && table.currentPlayers.length === table.playerCount) {
            clearInterval(pollingInterval);
            // Redirect to game page (update the URL as needed)
            window.location.href = `../game/game.html?tableId=${table.id}`;
        }
    } catch (err) {
        // Optionally, show a polling error (not required)
        showLobbyError('Error updating table status.');
    }
}
