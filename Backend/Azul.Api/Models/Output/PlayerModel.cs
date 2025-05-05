using AutoMapper;
using Azul.Core.BoardAggregate.Contracts;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;
using Azul.Core.BoardAggregate;
using Azul.Core.PlayerAggregate;

namespace Azul.Api.Models.Output;

public class PlayerModel
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public DateOnly? LastVisitToPortugal { get; set; }
    public BoardModel Board { get; set; }
    public bool HasStartingTile { get; set; }
    public List<TileType> TilesToPlace { get; set; }

    private class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<IPlayer, PlayerModel>();
            CreateMap<IBoard, BoardModel>();
            CreateMap<IPatternLine, PatternLineModel>();
            CreateMap<TileSpot,  TileSpotModel>();
        }
    }
}