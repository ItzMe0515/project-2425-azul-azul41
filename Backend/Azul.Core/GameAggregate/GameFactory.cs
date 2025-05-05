using System.Drawing;
using Azul.Core.GameAggregate.Contracts;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TableAggregate.Contracts;
using Azul.Core.TileFactoryAggregate;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.GameAggregate;

internal class GameFactory : IGameFactory
{
    public IGame CreateNewForTable(ITable table)
    {

        var tileBag = new TileBag();
        var colors = new[] 
        {
        TileType.PlainBlue,
        TileType.YellowRed,
        TileType.PlainRed,
        TileType.BlackBlue,
        TileType.WhiteTurquoise
        };

        foreach (var color in colors)
        {
            tileBag.AddTiles(20, color);
        }

        int numberOfDisplays = table.Preferences.NumberOfFactoryDisplays;

        var tileFactory = new TileFactory(numberOfDisplays, tileBag);

        Guid gameId = Guid.NewGuid();

        var players = table.SeatedPlayers.ToArray();
        var game = new Game(gameId, tileFactory, players);

        return game;
    }
}