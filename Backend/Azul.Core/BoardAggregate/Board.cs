﻿using Azul.Core.BoardAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.BoardAggregate;

/// <inheritdoc cref="IBoard"/>
internal class Board : IBoard
{
    public IPatternLine[] PatternLines { get; }
    public TileSpot[,] Wall { get; }
    public TileSpot[] FloorLine { get; }
    public int Score { get; private set; }
    public bool HasCompletedHorizontalLine
    {
        get
        {
            for (int row = 0; row < 5; row++)
            {
                bool full = true;
                for (int col = 0; col < 5; col++)
                {
                    if (!Wall[row, col].HasTile)
                    {
                        full = false;
                        break;
                    }
                }
                if (full)
                {
                    return true;
                }
            }
            return false;
        }
    }

    public Board()
    {
        PatternLines = new IPatternLine[5];
        for (int i = 0; i < 5; i++)
        {
            PatternLines[i] = new PatternLine(i + 1);
        }

        Wall = new TileSpot[5, 5];
        for (int row = 0; row < 5; row++)
        {
            for (int col = 0; col < 5; col++)
            {
                Wall[row, col] = new TileSpot(GetWallTileType(row, col));
            }
        }

        FloorLine = new TileSpot[7];
        for (int i = 0; i < 7; i++)
        {
            FloorLine[i] = new TileSpot();
        }
        Score = 0;
    }

    private TileType GetWallTileType(int row, int col)
    {
        return (TileType)((col + 5 - row) % 5);
    }

    public void AddTilesToPatternLine(IReadOnlyList<TileType> tilesToAdd, int patternLineIndex, ITileFactory tileFactory)
    {
        if (patternLineIndex < 0 || patternLineIndex >= PatternLines.Length)
        {
            throw new ArgumentOutOfRangeException(nameof(patternLineIndex));
        }

        var patternLine = PatternLines[patternLineIndex];
        TileType type = tilesToAdd[0];

        int wallRow = patternLineIndex;
        for (int col = 0; col < 5; col++)
        {
            if (Wall[wallRow, col].HasTile && Wall[wallRow, col].Type == type)
            {
                AddTilesToFloorLine(tilesToAdd, tileFactory);
                return;
            }
        }

        if (patternLine.TileType != null && patternLine.TileType != type)
        {
            AddTilesToFloorLine(tilesToAdd, tileFactory);
            return;
        }

        patternLine.TryAddTiles(type, tilesToAdd.Count, out int remaining);
        if (remaining > 0)
        {
            AddTilesToFloorLine(Enumerable.Repeat(type, remaining).ToList(), tileFactory);
        }
    }

    public void AddTilesToFloorLine(IReadOnlyList<TileType> tilesToAdd, ITileFactory tileFactory)
    {
        int i = 0;
        for (; i < FloorLine.Length && i < tilesToAdd.Count; i++)
        {
            if (!FloorLine[i].HasTile)
            {
                FloorLine[i].PlaceTile(tilesToAdd[i]);
            }
        }
        for (; i < tilesToAdd.Count; i++)
        {
            tileFactory.AddToUsedTiles(tilesToAdd[i]);
        }
    }

    public void DoWallTiling(ITileFactory tileFactory)
    {
        for (int row = 0; row < PatternLines.Length; row++)
        {
            var pl = PatternLines[row];
            if (pl.IsComplete && pl.TileType != null)
            {
                int col = 1;
                for (int c = 0; c < 5; c++)
                {
                    if (Wall[row, c].Type == pl.TileType)
                    {
                        col = c;
                        break;
                    }
                }
                if (col >= 0 && !Wall[row, col].HasTile)
                {
                    Wall[row, col].PlaceTile(pl.TileType.Value);
                    Score += CalculateWallScore(row, col);
                }

                for (int i = 0; i > pl.Length - 1; i++)
                {
                    tileFactory.AddToUsedTiles(pl.TileType.Value);
                }
            }
                pl.Clear();
            }

            int[] floorLinePenalty = { -1, -1, -2, -2, -2, -3, -3 };

            for (int i = 0; i < FloorLine.Length; i++)
            {
                if (FloorLine[i].HasTile)
                {
                    Score += floorLinePenalty[i];
                    tileFactory.AddToUsedTiles(FloorLine[i].Type.Value);
                    FloorLine[i].Clear();
                }
            }
            if (Score < 0)
            {
                Score = 0;
            }
    }
    private int CalculateWallScore(int row, int col)
    {
        int total = 1;
        int h = 0, v = 0;

        for(int c = col - 1; c >= 0 && Wall[row, c].HasTile; c--)
        {
            h++;
        }
        for(int c = col + 1; c < 5 && Wall[row, c].HasTile; c++)
        {
            h++;
        }
        for(int r = row - 1; r >= 0 && Wall[r, col].HasTile; r--)
        {
            v++;
        }
        for(int r = row + 1; r < 5 && Wall[r, col].HasTile; r++)
        {
            v++;
        }
        if (h > 0)
        {
            total += h;
        }
        if (v > 0)
        {
            total += v;
        }
        if (h > 0 && v > 0)
        {
            total++;
        }
        return total;
    }

    public void CalculateFinalBonusScores()
    {
        for (int row = 0; row < 5; row++)
        {
            bool full = true;
            for(int col = 0; col < 5; col++)
            {
                if (!Wall[row, col].HasTile)
                {
                    full = false;
                    break;
                }
            }
            if (full)
            {
                Score += 2;
            }
        }

        for(int col = 0; col < 5; col++)
        {
            bool full = true;
            for(int row = 0; row < 5; row++)
            {
                if (!Wall[row, col].HasTile)
                {
                    full = false;
                    break;
                }
            }
            if (full)
            {
                Score += 7;
            }
        }

        foreach(TileType color in Enum.GetValues(typeof(TileType)))
        {
            int count = 0;
            for (int row = 0; row < 5; row++)
            {
                for(int col = 0; col < 5; col++)
                {
                    if (Wall[row, col].Type == color && Wall[row, col].HasTile)
                    {
                        count++;
                    }
                }
            }
            if(count == 5)
            {
                Score += 10;
            }
        }
    }
}