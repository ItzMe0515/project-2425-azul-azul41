using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.TileFactoryAggregate;

internal class TileFactory : ITileFactory
{
    private readonly List<IFactoryDisplay> _displays;
    private readonly List<TileType> _usedTiles;
    private readonly ITileBag _bag;
    private readonly ITableCenter _tableCenter;
    internal TileFactory(int numberOfDisplays, ITileBag bag)
    {
        _bag = bag;
        _usedTiles = new List<TileType>();
        _tableCenter = new TableCenter();
        _displays = new List<IFactoryDisplay>();

        for (int i = 0; i < numberOfDisplays; i++)
        {
            _displays.Add(new FactoryDisplay(_tableCenter));
        }

        _tableCenter.AddStartingTile();
    }

    public ITileBag Bag => _bag;

    public IReadOnlyList<IFactoryDisplay> Displays => _displays.AsReadOnly();

    public ITableCenter TableCenter => _tableCenter;

    public IReadOnlyList<TileType> UsedTiles => _usedTiles.AsReadOnly();

    public bool IsEmpty
    {
        get
        {
            if (_bag.Tiles.Count > 0)
            {
                return false;
            }
            if (_displays.Any(d => !d.IsEmpty))
            {
                return false;
            }
            return true;
        }
    }

    public void FillDisplays()
    {
        foreach (var display in _displays)
        {
            ClearDisplay(display);

            // Try to take 4 tiles for this display
            if (!_bag.TryTakeTiles(4, out var tiles) || tiles.Count < 4)
            {
                // If not enough tiles, and there are used tiles, refill the bag
                int missing = 4 - (tiles?.Count ?? 0);
                var currentTiles = tiles?.ToList() ?? new List<TileType>();

                if (_usedTiles.Count > 0)
                {
                    _bag.AddTiles(_usedTiles);
                    _usedTiles.Clear();

                    // Only take the missing amount!
                    if (_bag.TryTakeTiles(missing, out var refillTiles) && refillTiles.Count > 0)
                    {
                        currentTiles.AddRange(refillTiles);
                    }
                }

                display.AddTiles(currentTiles);
            }
            else
            {
                display.AddTiles(tiles);
            }
        }
    }










    public IReadOnlyList<TileType> TakeTiles(Guid displayId, TileType tileType)
    {
        var display = _displays.FirstOrDefault(d => d.Id == displayId);
        if (display == null)
        {
            return Array.Empty<TileType>();
        }

        var taken = display.TakeTiles(tileType);
        foreach (var t in display.Tiles)
        {
            if (t != tileType)
            {
                _tableCenter.AddTiles(new List<TileType> { t });
            }
        }
        return taken;
    }

    public void AddToUsedTiles(TileType tile)
    {
        _usedTiles.Add(tile);
    }

    private void ClearDisplay(IFactoryDisplay display)
    {
        var uniqueTypes = display.Tiles.Distinct().ToList();
        foreach (var type in uniqueTypes)
        {
            display.TakeTiles(type);
        }
    }
}