using System.Drawing;
using Azul.Core.BoardAggregate;
using Azul.Core.BoardAggregate.Contracts;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.PlayerAggregate;

/// <inheritdoc cref="IPlayer"/>
internal abstract class PlayerBase : IPlayer
{
    public Guid Id { get; }
    public string Name { get; }
    public DateOnly? LastVisitToPortugal { get; }
    public IBoard Board { get; set; }
    public bool HasStartingTile { get; set; }
    public List<TileType> TilesToPlace { get; }

    protected PlayerBase(Guid id, string name, DateOnly? lastVisitToPortugal)
    {
        Id = id;
        Name = name;
        LastVisitToPortugal = lastVisitToPortugal;
        Board = new Board();
        HasStartingTile = false;
        TilesToPlace = new List<TileType>();
    }
}