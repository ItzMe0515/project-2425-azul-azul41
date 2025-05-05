namespace Azul.Core.TileFactoryAggregate.Contracts;

public interface ITableCenter : IFactoryDisplay
{
    public void AddStartingTile();
    bool HasStartingTile { get; }
    void RemoveStartingTile();
}