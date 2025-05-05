using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.TileFactoryAggregate;

/// <inheritdoc cref="ITileBag"/>
internal class TileBag : ITileBag
{
    private readonly List<TileType> _tiles;

    public TileBag()
    {
        _tiles = new List<TileType>();
    }

    public IReadOnlyList<TileType> Tiles => _tiles.AsReadOnly();

    public void AddTiles(int amount, TileType tileType)
    {
        for(int i = 0; i < amount; i++)
        {
            _tiles.Add(tileType);
        }
    }

    public void AddTiles(IReadOnlyList<TileType> tilesToAdd)
    {
        _tiles.AddRange(tilesToAdd);
    }

    public bool TryTakeTiles(int amount, out IReadOnlyList<TileType> tiles)
    {
        tiles = Array.Empty<TileType>();
        if (_tiles.Count == 0)
        {
            return false;
        }

        var takenTiles = new List<TileType>();
        var random = new Random();

        int takeCount = Math.Min(amount, _tiles.Count);
        for(int i = 0; i < takeCount; i++)
        {
            int index = random.Next(_tiles.Count);
            takenTiles.Add(_tiles[index]);
            _tiles.RemoveAt(index);
        }

        tiles = takenTiles;
        return takenTiles.Count == amount;
    }
}