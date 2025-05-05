using System.Drawing;
using Azul.Core.PlayerAggregate;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TableAggregate.Contracts;
using Azul.Core.UserAggregate;

namespace Azul.Core.TableAggregate;

/// <inheritdoc cref="ITable"/>
internal class Table : ITable
{
    private readonly List<IPlayer> _seatedPlayers;
    public Table(Guid id, ITablePreferences preferences)
    {
        Id = id;
        Preferences = preferences;
        GameId = Guid.Empty;
        _seatedPlayers = new List<IPlayer>();
    }

    public Guid Id { get; }
    public ITablePreferences Preferences { get; }
    public IReadOnlyList<IPlayer> SeatedPlayers => _seatedPlayers.AsReadOnly();
    public bool HasAvailableSeat => _seatedPlayers.Count < Preferences.NumberOfPlayers;
    public Guid GameId { get; set; }

    public void Join(User user)
    {
        if (!HasAvailableSeat)
        {
            throw new InvalidOperationException("Table is full.");
        }
         
        if (_seatedPlayers.Exists(p => p.Id == user.Id))
        {
            throw new InvalidOperationException("User is already seated at the table.");
        }

        IPlayer newPlayer = new HumanPlayer(user.Id, user.UserName ?? user.Email ?? "Unknown", user.LastVisitToPortugal);
        _seatedPlayers.Add(newPlayer);
    }

    public void Leave(Guid userId)
    {
        var player = _seatedPlayers.Find(p => p.Id == userId);
        if(player == null)
        {
            throw new InvalidOperationException("User is not seated at the table.");
        }
        _seatedPlayers.Remove(player);
    }

    public void FillWithArtificialPlayers(IGamePlayStrategy gamePlayStrategy)
    {
        throw new NotImplementedException();
    }
    
}