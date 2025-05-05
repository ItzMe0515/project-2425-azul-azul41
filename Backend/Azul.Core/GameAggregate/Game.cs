using Azul.Core.GameAggregate.Contracts;
using Azul.Core.PlayerAggregate;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TileFactoryAggregate;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.GameAggregate;

/// <inheritdoc cref="IGame"/>
internal class Game : IGame
{
    /// <summary>
    /// Creates a new game and determines the player to play first.
    /// </summary>
    /// <param name="id">The unique identifier of the game</param>
    /// <param name="tileFactory">The tile factory</param>
    /// <param name="players">The players that will play the game</param>
    /// 
    public Guid Id { get; }
    public ITileFactory TileFactory { get; }
    public IPlayer[] Players { get; }
    public Guid PlayerToPlayId { get; private set; }
    public int RoundNumber { get; private set; }
    public bool HasEnded { get; private set; }
    public Game(Guid id, ITileFactory tileFactory, IPlayer[] players)
    {
        Id = id;
        TileFactory = tileFactory;
        Players = players;
        RoundNumber = 1;
        HasEnded = false;

        IPlayer starter;
        if (players.All(p => p.LastVisitToPortugal == null) ||
            players.Select(p => p.LastVisitToPortugal).Distinct().Count() == 1)
        {
            starter = players[0];
        }
        else
        {
            starter = players
                .OrderByDescending(p => p.LastVisitToPortugal ?? DateOnly.MinValue)
                .First();
        }
        PlayerToPlayId = starter.Id;


        foreach (var player in Players)
            player.HasStartingTile = false;

        TileFactory.TableCenter.AddStartingTile();

        TileFactory.FillDisplays();
    }

    public void TakeTilesFromFactory(Guid playerId, Guid displayId, TileType tileType)
    {
        // Zoek de speler
        var player = Players.FirstOrDefault(p => p.Id == playerId);
        if (player == null) throw new InvalidOperationException("Player not found.");

        // Neem de tegels uit de factory display of het midden
        var display = TileFactory.Displays.FirstOrDefault(d => d.Id == displayId)
                      ?? (TileFactory.TableCenter.Id == displayId ? TileFactory.TableCenter : null);
        if (display == null) throw new InvalidOperationException("Display not found.");

        var takenTiles = display.TakeTiles(tileType);
        if (takenTiles == null || takenTiles.Count == 0)
            throw new InvalidOperationException("No tiles taken.");

        // Voeg de tegels toe aan de hand van de speler
        player.TilesToPlace.Clear();
        player.TilesToPlace.AddRange(takenTiles);

        // Zet de starting tile als deze is genomen uit het midden
        if (display == TileFactory.TableCenter && TileFactory.TableCenter.HasStartingTile)
        {
            player.HasStartingTile = true;
            TileFactory.TableCenter.RemoveStartingTile();
        }
    }

    public void PlaceTilesOnPatternLine(Guid playerId, int patternLineIndex)
    {
        var player = Players.FirstOrDefault(p => p.Id == playerId);
        if (player == null) throw new InvalidOperationException("Player not found.");

        // TODO: Implementeer patroonlijn-logica
        player.TilesToPlace.Clear();
        NextTurn();
    }

    public void PlaceTilesOnFloorLine(Guid playerId)
    {
        var player = Players.FirstOrDefault(p => p.Id == playerId);
        if (player == null) throw new InvalidOperationException("Player not found.");

        // TODO: Implementeer vloer-logica
        player.TilesToPlace.Clear();
        NextTurn();
    }

    private void NextTurn()
    {
        // Bepaal de index van de huidige speler
        int idx = Array.FindIndex(Players, p => p.Id == PlayerToPlayId);
        int nextIdx = (idx + 1) % Players.Length;
        PlayerToPlayId = Players[nextIdx].Id;

        // TODO: Controleer of ronde of spel is afgelopen (HasEnded)
    }
}
