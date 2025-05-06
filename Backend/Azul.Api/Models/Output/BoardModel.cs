using AutoMapper;
using Azul.Core.BoardAggregate;
using Azul.Core.BoardAggregate.Contracts;

namespace Azul.Api.Models.Output;

public class BoardModel
{
    public PatternLineModel[] PatternLines { get; set; }
    public TileSpotModel[,] Wall { get; set; }
    public TileSpotModel[] FloorLine { get; set; }
    public int Score { get; set; }
}

public class BoardModelMappingProfile : Profile
{
    public BoardModelMappingProfile()
    {
        CreateMap<IBoard, BoardModel>()
            .ForMember(dest => dest.PatternLines, opt => opt.MapFrom(src => src.PatternLines))
            .ForMember(dest => dest.Wall, opt => opt.MapFrom(src => src.Wall))
            .ForMember(dest => dest.FloorLine, opt => opt.MapFrom(src => src.FloorLine))
            .ForMember(dest => dest.Score, opt => opt.MapFrom(src => src.Score));
    }
}
