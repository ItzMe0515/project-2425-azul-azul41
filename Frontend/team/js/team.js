'use strict'

document.addEventListener('DOMContentLoaded', function () {
    const lobbyIcon = document.getElementById('lobby-icon');
    if (lobbyIcon) {
        lobbyIcon.addEventListener('click', function(event) {
            event.preventDefault();
            const token = localStorage.getItem('authToken');
            if (token) {
                // User is logged in, redirect to lobby
                window.location.href = '../lobby page/lobby.html';
            } else {
                // User not logged in, redirect to login
                window.location.href = '../login-register page/index.html';
            }
        });
    }
});
