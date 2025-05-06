using AutoMapper;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Api.Models.Output;

public class FactoryDisplayModel
{
    public Guid Id { get; set; }
    public List<string> Tiles { get; set; }
}

public class FactoryDisplayModelMappingProfile : Profile
{
    public FactoryDisplayModelMappingProfile()
    {
        CreateMap<IFactoryDisplay, FactoryDisplayModel>()
            .ForMember(dest => dest.Tiles, opt => opt.MapFrom(src => src.Tiles.Select(t => t.ToString()).ToList()));
    }
}

