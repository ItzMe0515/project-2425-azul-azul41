using Azul.Core.GameAggregate.Contracts;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TableAggregate.Contracts;
using Azul.Core.UserAggregate;

namespace Azul.Core.TableAggregate;

/// <inheritdoc cref="ITableManager"/>
internal class TableManager : ITableManager
{
    private readonly ITableRepository _tableRepository;
    private readonly ITableFactory _tableFactory;
    private readonly IGameRepository _gameRepository;
    private readonly IGameFactory _gameFactory;
    private readonly IGamePlayStrategy _gamePlayStrategy;

    public TableManager(
        ITableRepository tableRepository,
        ITableFactory tableFactory,
        IGameRepository gameRepository,
        IGameFactory gameFactory,
        IGamePlayStrategy gamePlayStrategy)
    {
        _tableRepository = tableRepository;
        _tableFactory = tableFactory;
        _gameRepository = gameRepository;
        _gameFactory = gameFactory;
        _gamePlayStrategy = gamePlayStrategy;
    }

    public ITable JoinOrCreateTable(User user, ITablePreferences preferences)
    {
        //Find a table with available seats that matches the given preferences
        //If no table is found, create a new table. Otherwise, take the first available table

        var availableTables = _tableRepository.FindTablesWithAvailableSeats(preferences);

        ITable table = availableTables.FirstOrDefault();

        if(table == null)
        {
            table = _tableFactory.CreateNewForUser(user, preferences);
            _tableRepository.Add(table);
        }
        else
        {
            table.Join(user);
        }

        return table;
    }

    public void LeaveTable(Guid tableId, User user)
    {
        var table = _tableRepository.Get(tableId);
        if(table == null)
        {
            throw new InvalidOperationException("Table not found.");
        }
        table.Leave(user.Id);

        if (table.SeatedPlayers.Count == 0)
        {
            _tableRepository.Remove(tableId);
        }
            
    }


    public IGame StartGameForTable(Guid tableId)
    {
        var table = _tableRepository.Get(tableId);

        if(table == null)
        {
            throw new InvalidOperationException("Table not found.");
        }

        if(table.SeatedPlayers.Count != table.Preferences.NumberOfPlayers)
        {
            throw new InvalidOperationException("Not enough players yet");
        }

        var game = _gameFactory.CreateNewForTable(table);

        _gameRepository.Add(game);
        table.GameId = game.Id;

        return game;
    }

    public void FillWithArtificialPlayers(Guid tableId, User user)
    {
        //TODO: Implement this method when you are working on the EXTRA requirement 'Play against AI'
        throw new NotImplementedException();
    }
}