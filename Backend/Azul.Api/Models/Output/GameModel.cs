using AutoMapper;
using Azul.Core.GameAggregate.Contracts;

namespace Azul.Api.Models.Output;

public class GameModel
{
    public Guid Id { get; set; }
    public PlayerModel[] Players { get; set; }
    public Guid PlayerToPlayId { get; set; }
    public TileFactoryModel TileFactory { get; set; }
    public int RoundNumber { get; set; }
    public bool HasEnded { get; set; }
}

public class GameModelMappingProfile : Profile
{
    public GameModelMappingProfile()
    {
        CreateMap<IGame, GameModel>();
    }
}
