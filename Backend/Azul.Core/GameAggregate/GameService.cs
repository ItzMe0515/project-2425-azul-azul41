using Azul.Core.GameAggregate.Contracts;
using Azul.Core.PlayerAggregate;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.GameAggregate;

/// <inheritdoc cref="IGameService"/>
internal class GameService : IGameService
{
    private readonly IGameRepository _gameRepository;
    public GameService(IGameRepository gameRepository)
    {
        _gameRepository = gameRepository;
    }
    public IGame GetGame(Guid gameId)
    {
        var game = _gameRepository.GetById(gameId);
        if (game == null)
        {
            throw new InvalidOperationException($"Game with id {gameId} not found.");
        }
        return game;
    }
    public void TakeTilesFromFactory(Guid gameId, Guid playerId, Guid displayId, TileType tileType)
    {
        var game = GetGame(gameId);
        game.TakeTilesFromFactory(playerId, displayId, tileType);
        _gameRepository.Add(game);

    }

    public void PlaceTilesOnPatternLine(Guid gameId, Guid playerId, int patternLineIndex)
    {
        var game = GetGame(gameId);
        game.PlaceTilesOnPatternLine(playerId, patternLineIndex);
        _gameRepository.Add(game);
    }

    public void PlaceTilesOnFloorLine(Guid gameId, Guid playerId)
    {
        var game = GetGame(gameId);
        game.PlaceTilesOnFloorLine(playerId);
        _gameRepository.Add(game);
    }
}