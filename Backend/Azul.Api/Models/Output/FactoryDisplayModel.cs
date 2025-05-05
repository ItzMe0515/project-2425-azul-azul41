using AutoMapper;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Api.Models.Output;

public class FactoryDisplayModel
{
    public Guid Id { get; set; }
    public List<TileType> Tiles { get; set; }

    private class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<IFactoryDisplay, FactoryDisplayModel>()
            .ForMember(dest => dest.Tiles, opt => opt.MapFrom(src => src.Tiles.ToList()));

        }
    }
}